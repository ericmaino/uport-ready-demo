import winston = require('winston');
import fs = require('fs');
import path = require('path');

import { IReader } from './../interfaces/IReader';
import { IStorage } from './../interfaces/IStorage';

import { IEthereumReader } from './IEthereumReader';
import { IWeb3Adapter } from './IWeb3Adapter';
import { EthereumBlock, EthereumBlockDetail } from './models/EthereumBlock';
import { EthereumTx } from './models/EthereumTx';
import { EthereumIdentity } from './models/EthereumIdentity';
import { EthereumCode } from './models/EthereumCode';
import { EthereumAddress } from './models/EthereumAddress';
import { TraceReader } from './readers/TraceReader';

export class EthereumReader implements IEthereumReader {
    private readonly baseClient: IWeb3Adapter;
    private readonly storage: IStorage;

    constructor(baseClient: IWeb3Adapter, storage: IStorage) {
        this.baseClient = baseClient;
        this.storage = storage;
    }

    public async GetLatestBlockNumber(): Promise<number> {
        const blockData = await this.baseClient.GetBlock('latest');
        return blockData.number;
    }

    public async GetBlockFromNumber(blockNumber: number): Promise<EthereumBlock> {
        const blockContent = await this.baseClient.GetBlock(blockNumber);
        return new EthereumBlock(blockContent);
    }

    public async GetTransaction(txHash: string): Promise<EthereumTx> {
        const tx = await this.baseClient.GetTransaction(txHash);
        const receipt = await this.baseClient.GetTransactionReceipt(txHash);
        return new EthereumTx(tx, receipt);
    }

    public async GetTrace(tx: EthereumTx): Promise<IReader<EthereumAddress>> {
        const traceLog = await this.baseClient.GetTrace(tx.Hash());
        return new TraceReader(traceLog);
    }

    public async GetData(address: EthereumAddress, block: EthereumBlock): Promise<any> {
        const abi = await this.GetAbi(address);
        let data = null;

        if (abi) {
            data = await this.baseClient.ReadContract(address.AsHex(), abi, block.BlockNumber());
        } else {
            const balance = await this.baseClient.GetBalance(address.AsHex());
            data = {
                address: address.AsHex(),
                balance: balance
            };
        }

        return data;
    }

    public static async GetIdentity(client: IWeb3Adapter): Promise<EthereumIdentity> {
        const origin = await client.GetBlock(0);
        const networkId = await client.GetNetworkId();
        return new EthereumIdentity(networkId, origin.hash);
    }

    private async GetAbi(address: EthereumAddress): Promise<any> {
        const code = await this.baseClient.GetCode(address.AsHex());
        let abi: any = null;

        if (code) {
            const abiPath = `Code/${code.Hash()}/abi.json`;

            if (await this.storage.Exists(abiPath)) {
                const buffer = await this.storage.ReadItem(abiPath);
                abi = JSON.parse(buffer);
            } else {
                winston.warn(`Unknown ABI for ${code.Hash()}`);
            }
        }

        return abi;
    }
}