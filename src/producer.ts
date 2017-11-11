import winston = require('winston');
import solc = require('solc');
import config = require('config');
import coder = require('web3/lib/solidity/coder');

import { LoggingConfiguration } from './modules';
import { IWeb3Adapter, Ethereum } from './Ethereum';
import { IBlockTracker, IIdentifier, INotary, IStorage } from './interfaces';
import { EthereumTxInput, EthereumAddress, EthereumEstimate } from './Ethereum/models';

import {
    AzureBlobStorage,
    FileSystemStorage,
    Sha256Notary,
    SigningNotary,
    GenericIdentifier
} from './adapters';

const EthereumWeb3Adapter = Ethereum.Web3.EthereumWeb3Adapter;

class Program {
    public static async Run() {
        LoggingConfiguration.initialize(null);

        const storageConfig = config.get('storage');
        const rpcUrl = config.get('rpcUrl');
        const testConfig = config.get('test');

        const notary = new Sha256Notary();

        let fs: IStorage;
        if (storageConfig.implementation === 'FileSystem') {
            fs = new FileSystemStorage(storageConfig.root);
        } else {
            fs = new AzureBlobStorage(storageConfig.azure.account, storageConfig.azure.key, storageConfig.root);
        }

        const rawContract = (await fs.ReadItem(testConfig.contract.file));
        const signer = new SigningNotary(fs);

        const web3 = new EthereumWeb3Adapter(rpcUrl);
        const factory = new ContractFactory(web3, fs, notary);
        const fromAddress = new EthereumAddress(testConfig.account);
        const id = await factory.UploadAndVerify(rawContract);
        const prepared = await factory.PrepareTransaction(fromAddress, id, testConfig.contract.name, testConfig.contract.parameters);
        const signed = await signer.Sign(prepared);
        const receipt = await web3.SendSignedTx(signed);
        winston.debug(receipt);
    }
}

class ContractPaths {
    private readonly abiPath: string;
    private readonly compiledPath: string;
    private readonly namePath: string;
    private readonly sourceMapPath: string;

    constructor(root: string, signature: string, contractName: string, sourceMap: string) {
        const base = `${root}/Code/${signature}`;
        this.abiPath = `${base}/abi.json`;
        this.compiledPath = `${base}/compiled.json`;
        this.namePath = `${base}/${contractName}`;
        this.sourceMapPath = sourceMap;
    }

    public AbiPath(): string {
        return this.abiPath;
    }

    public CompiledPath(): string {
        return this.compiledPath;
    }

    public NamePath(): string {
        return this.namePath;
    }

    public SourceMapPath(): string {
        return this.sourceMapPath;
    }
}

class ContractPathFactory {
    private readonly root: string;
    private readonly storage: IStorage;

    constructor(storage: IStorage) {
        this.root = "Contracts";
        this.storage = storage;
    }

    public GetSourceRoot(fileSignature: string): string {
        return `${this.root}/Sources/${fileSignature}`;
    }

    public GetSourceFilePath(fileSignature: string): string {
        return `${this.GetSourceRoot(fileSignature)}/source.json`;
    }
    public GetContractPaths(sourceSignature: string, signature: string, contractName: string): ContractPaths {
        return new ContractPaths(this.root, signature, contractName, this.GetSourceToCodeMapPath(sourceSignature, contractName));
    }

    public async GetCompiledPath(sourceSignature: string, contractName: string): Promise<string> {
        const sourceMapPath = this.GetSourceToCodeMapPath(sourceSignature, contractName);
        const contractSignature = await this.storage.ReadItem(sourceMapPath);
        return new ContractPaths(this.root, contractSignature, contractName, sourceMapPath).CompiledPath();
    }

    private GetSourceToCodeMapPath(sourceSignature: string, contractName: string): string {
        return `${this.GetSourceRoot(sourceSignature)}/${contractName}.json`;
    }
}

class ContractFactory {

    private readonly web3: IWeb3Adapter;
    private readonly storage: IStorage;
    private readonly notary: INotary;
    private readonly paths: ContractPathFactory;

    constructor(web3: IWeb3Adapter, storage: IStorage, notary: INotary) {
        this.web3 = web3;
        this.storage = storage;
        this.notary = notary;
        this.paths = new ContractPathFactory(storage);
    }

    public async UploadAndVerify(content: string): Promise<IIdentifier> {
        const sourceSignature = this.notary.GetSignature(content);
        const sourceFile = this.paths.GetSourceFilePath(sourceSignature);

        if (!await this.storage.Exists(sourceFile)) {
            winston.debug(`Compiling ${sourceSignature}`);
            const compiled = solc.compile(content, 1);

            if (compiled.errors && compiled.errors.length > 0) {
                await this.storage.SaveItem(sourceFile, JSON.stringify(compiled));
                const error = new Error(compiled.errors.join('\n'));
                error.name = "Compilation failed";
                throw error;
            }
            const promises = new Array<Promise<void>>();

            Object.keys(compiled.contracts).forEach(contractKey => {
                const contract = compiled.contracts[contractKey];
                const contractName = contractKey.substr(1);
                promises.push(this.WriteContractData(sourceSignature, contract, contractName));
            });

            await Promise.all(promises);
            await this.storage.SaveItem(sourceFile, "Success");
        }

        return new GenericIdentifier(sourceSignature);
    }

    private async WriteContractData(sourceSignature: string, contract: any, contractName: string): Promise<void> {
        winston.debug(`Persisting contract ${contractName}`);
        const contractSignature = this.notary.GetSignature(`0x${contract.runtimeBytecode}`);
        const contractPaths = this.paths.GetContractPaths(sourceSignature, contractSignature, contractName);
        await this.storage.SaveItem(contractPaths.CompiledPath(), JSON.stringify(contract));
        await this.storage.SaveItem(contractPaths.AbiPath(), JSON.stringify(JSON.parse(contract.interface)));
        await this.storage.SaveItem(contractPaths.NamePath(), "");
        await this.storage.SaveItem(contractPaths.SourceMapPath(), contractSignature);
    }

    public async PrepareTransaction(address: EthereumAddress, id: IIdentifier, contractName: string, argumentPayload: any): Promise<any> {
        const contractPath = await this.paths.GetCompiledPath(id.AsString(), contractName);
        const contract = JSON.parse(await this.storage.ReadItem(contractPath));
        const abi = JSON.parse(contract.interface);
        const constructor: string = null;
        const encodedParams = this.EncodeContractParameters(abi, argumentPayload, constructor);
        const rawTx = new EthereumTxInput(address, contract.bytecode, encodedParams);
        const estimate = await this.web3.EstimateTx(rawTx);
        return await this.web3.PrepareEstimatedTx(estimate);
    }

    private IsAbiMatch(method: string, abi: any): boolean {
        let result = abi.type === 'constructor';

        if (method) {
            result = abi.name === method;
        }

        return result;
    }

    private EncodeContractParameters(abi: Array<any>, params: any, method: string): any {
        const paramKeys = Object.keys(params);
        const paramsCount = paramKeys.length;
        const methodDecl = abi.filter((json) => this.IsAbiMatch(method, json) && json.inputs.length === paramsCount)[0];
        const types = methodDecl.inputs.map(input => input.type);
        const values = paramKeys.map(key => params[key]);
        return coder.encodeParams(types, values);
    }


}

Program.Run()
    .catch(err => winston.error(err));
