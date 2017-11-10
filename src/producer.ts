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
import { EthereumEstimate} from './Ethereum/models/EthereumEstimate';

class Program {
    public static async Run() {
        LoggingConfiguration.initialize(null);
        const notary = new Sha256Notary();
        const fs = new FileSystemStorage('d:/src/Blockchain/ethereum-data/test/localAssets');
        const rawContract = (await fs.ReadItem('Test2.sol'));

        const web3 = new EthereumWeb3Adapter('http://localhost:8545');
        const factory = new ContractFactory(web3, fs, notary);
        const fromAddress = new EthereumAddress('0xe8dbb8e21b948cdf7a39a02fd02e4ef606fbbd02');
        const id = await factory.UploadAndVerify(rawContract);
        const reciept = await factory.PrepareTransaction(fromAddress, id, "Device", {
            deviceAddress: "",
            description: "Maino"
        });
        winston.debug(reciept);
    }
}

class ContractFactory {

    private readonly web3: IWeb3Adapter;
    private readonly storage: IStorage;
    private readonly notary: INotary;

    constructor(web3: IWeb3Adapter, storage: IStorage, notary: INotary) {
        this.web3 = web3;
        this.storage = storage;
        this.notary = notary;
    }

    public async UploadAndVerify(content: string): Promise<IIdentifier> {
        const fileSignature = this.notary.GetSignature(content);
        const compiledPath = this.GetCompilePath(fileSignature);

        if (!await this.storage.Exists(fileSignature)) {
            const compiled = solc.compile(content, 1);

            if (compiled.errors && compiled.errors.length > 0) {
                const error = new Error(compiled.errors.join('\n'));
                error.name = "Compilation failed";
                throw error;
            }

            await this.storage.SaveItem(compiledPath, JSON.stringify(compiled.contracts));
        }

        return new GenericIdentifier(fileSignature);
    }

    public async PrepareTransaction(address: EthereumAddress, id: IIdentifier, contractName: string, argumentPayload: any): Promise<any> {
        const contractPath = this.GetCompilePath(id.AsString());
        const compiled = JSON.parse(await this.storage.ReadItem(contractPath));
        const contract = compiled[`:${contractName}`];
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

    private GetBasePath(hash: string): string {
        return `Contracts/${hash}`;
    }

    private GetCompilePath(hash: string): string {
        return `${this.GetBasePath(hash)}/compiled.json`;
    }
}

Program.Run()
    .catch(err => winston.error(err));
