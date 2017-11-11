import winston = require('winston');
import { IWeb3Adapter } from './../IWeb3Adapter';
import { IStorage } from './../../interfaces/IStorage';
import {
    EthereumCode,
    EthereumEstimate,
    EthereumTxInput
} from './../models';

export class EthereumWeb3AdapterStorageCache implements IWeb3Adapter {
    private readonly baseClient: IWeb3Adapter;
    private readonly storage: IStorage;

    constructor(baseClient: IWeb3Adapter, storage: IStorage) {
        this.baseClient = baseClient;
        this.storage = storage;
    }

    public async GetBlock(identifier: number): Promise<any> {
        const block = await this.baseClient.GetBlock(identifier);
        await this.storage.SaveItem(`Blocks/${block.number}/block.json`, JSON.stringify(block));
        return block;
    }

    public async GetTransaction(txHash: string): Promise<any> {
        const tx = await this.baseClient.GetTransaction(txHash);
        await this.storage.SaveItem(`Tx/${txHash}/tx.json`, JSON.stringify(tx));
        return tx;
    }

    public async GetTransactionReceipt(txHash: string): Promise<any> {
        const receipt = await this.baseClient.GetTransactionReceipt(txHash);
        await this.storage.SaveItem(`Tx/${txHash}/receipt.json`, JSON.stringify(receipt));
        return receipt;
    }

    public async GetTrace(txHash: string): Promise<any> {
        const trace = await this.baseClient.GetTrace(txHash);
        await this.storage.SaveItem(`Tx/${txHash}/trace.json`, JSON.stringify(trace));
        return trace;
    }

    public async GetCode(address: string): Promise<EthereumCode> {
        const code = await this.baseClient.GetCode(address);

        if (code) {
            const hash = code.Hash();

            await this.storage.SaveItem(`Code/${code.Hash()}/code.json`, JSON.stringify(code.Code()));
            await this.storage.SaveItem(`Addresses/${address}/codeHash.json`, JSON.stringify(hash));
        }

        return code;
    }

    public ReadContract(address: string, abi: any, block?: any): Promise<any> {
        return this.baseClient.ReadContract(address, abi, block);
    }

    public async GetNetworkId(): Promise<number> {
        return this.baseClient.GetNetworkId();
    }

    public async EstimateTx(tx: EthereumTxInput): Promise<EthereumEstimate> {
        return this.baseClient.EstimateTx(tx);
    }

    public async PrepareEstimatedTx(tx: EthereumEstimate): Promise<any> {
        return this.baseClient.PrepareEstimatedTx(tx);
    }

    public async SendSignedTx(txBytesAsHex: string): Promise<string> {
        return this.baseClient.SendSignedTx(txBytesAsHex);
    }

    public async GetBalance(address: string): Promise<number> {
        return this.baseClient.GetBalance(address);
    }
}