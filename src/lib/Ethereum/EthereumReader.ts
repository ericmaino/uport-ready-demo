import winston = require('winston');
import fs = require('fs');
import path = require('path');

import { IReader, IStorage } from './../interfaces';
import { TraceReader } from './readers';
import { IEthereumReader } from './IEthereumReader';
import { IWeb3Adapter } from './IWeb3Adapter';
import { EthereumAddress, EthereumBlock, EthereumBlockDetail, EthereumIdentity, EthereumCode, EthereumTx } from './models';

export class EthereumReader implements IEthereumReader {
    private readonly baseClient: IWeb3Adapter;
    private readonly contractStorage: IStorage;

    constructor(baseClient: IWeb3Adapter, contractStorage: IStorage) {
        this.baseClient = baseClient;
        this.contractStorage = contractStorage;
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
        let data: any = {};

        if (abi) {
            data = await this.baseClient.ReadContract(address.AsHex(), abi, block.BlockNumber());
        }

        const balance = await this.baseClient.GetBalance(address.AsHex());

        if (abi || balance > 0) {
            data._block = block.BlockNumber();
            data._address = address.AsHex();
            data._balance = balance;
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

            if (await this.contractStorage.Exists(abiPath)) {
                const buffer = await this.contractStorage.ReadItem(abiPath);
                abi = JSON.parse(buffer);
            }
        }

        return abi;
    }
}