import winston = require('winston');
import solc = require('solc');
import coder = require('web3/lib/solidity/coder');

import { LoggingConfiguration } from './modules/LoggingConfiguration';
import { FileSystemStorage } from './adapters/FileSystemStorage';
import { Sha256Notary } from './adapters/Sha256Notary';
import { GenericIdentifier } from './adapters/GenericIdentifier';
import { IIdentifier } from './interfaces/IIdentifier';
import { INotary } from './interfaces/INotary';
import { IStorage } from './interfaces/IStorage';
import { IWeb3Adapter } from './Ethereum/IWeb3Adapter';
import { EthereumWeb3Adapter } from './Ethereum/web3/EthereumWeb3Adapter';
import { EthereumTxInput } from './Ethereum/models/EthereumTxInput';
import { EthereumAddress } from './Ethereum/models/EthereumAddress';
import { EthereumEstimate } from './Ethereum/models/EthereumEstimate';
import { SigningNotary } from './adapters/SigningNotary';

class Program {
    public static async Run() {
        LoggingConfiguration.initialize(null);
        const notary = new Sha256Notary();
        const fs = new FileSystemStorage('d:/src/Blockchain/ethereum-data/test/localAssets');
        const rawContract = (await fs.ReadItem('Test2.sol'));
        const signer = new SigningNotary(fs);

        const web3 = new EthereumWeb3Adapter('http://localhost:8545');
        const factory = new ContractFactory(web3, fs, notary);
        const fromAddress = new EthereumAddress('0xcd2051a37cdc02db5da21d61415de21af4058a5e');
        const id = await factory.UploadAndVerify(rawContract);
        const prepared = await factory.PrepareTransaction(fromAddress, id, "Device", {
            deviceAddress: "",
            description: "Maino"
        });
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
