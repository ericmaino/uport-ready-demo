import winston = require('winston');
import solc = require('solc');
import coder = require('web3/lib/solidity/coder');

import { IStorage, INotary, IIdentifier } from './../interfaces';
import { ContractPathFactory } from './ContractPathFactory';
import { IWeb3Adapter, Ethereum } from './../Ethereum';
import { GenericIdentifier } from './../adapters';

export class ContractFactory {

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

        const fileWrites = [
            this.storage.SaveItem(contractPaths.CompiledPath(), JSON.stringify(contract)),
            this.storage.SaveItem(contractPaths.AbiPath(), JSON.stringify(JSON.parse(contract.interface))),
            this.storage.SaveItem(contractPaths.NamePath(), ""),
            this.storage.SaveItem(contractPaths.SourceMapPath(), contractSignature)
        ];
        await Promise.all(fileWrites);
    }

    public async PrepareTransaction(address: Ethereum.Models.EthereumAddress, id: IIdentifier, contractName: string, argumentPayload: any): Promise<any> {
        const contractPath = await this.paths.GetCompiledPath(id.AsString(), contractName);
        const contract = JSON.parse(await this.storage.ReadItem(contractPath));
        const abi = JSON.parse(contract.interface);
        const constructor: string = null;
        const encodedParams = this.EncodeContractParameters(abi, argumentPayload, constructor);
        const rawTx = new Ethereum.Models.EthereumTxInput(address, contract.bytecode, encodedParams);
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