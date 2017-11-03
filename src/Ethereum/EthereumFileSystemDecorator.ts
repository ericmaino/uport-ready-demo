import winston = require('winston');
import fs = require('fs');
import path = require('path');

import { IEthereumClient } from './IEthereumClient';
import { EthereumBlock, EthereumBlockDetail } from './models/EthereumBlock';
import { EthereumTx } from './models/EthereumTx';
import { EthereumCode } from './models/EthereumCode';
import { EthereumAddress } from './models/EthereumAddress';
import { IReader } from './../interfaces/IReader';
import { TraceReader } from './EthereumTrace';

export class EthereumFileSystemDecoratorClient implements IEthereumClient {
    private readonly baseClient: IEthereumClient;
    private readonly dataRoot: string;

    constructor(baseClient: IEthereumClient, dataRoot: string) {
        this.baseClient = baseClient;
        this.dataRoot = dataRoot;
    }

    public async GetLatestBlockNumber(): Promise<number> {
        return this.baseClient.GetLatestBlockNumber();
    }

    public async GetBlockFromNumber(blockNumber: number): Promise<EthereumBlock> {
        const block = await this.baseClient.GetBlockFromNumber(blockNumber);
        this.Save(`Blocks/${block.BlockNumber()}.json`, block.AsSerializable());
        return block;
    }

    public async GetTransaction(txHash: string): Promise<EthereumTx> {
        const tx = await this.baseClient.GetTransaction(txHash);
        this.Save(`Tx/${tx.Hash()}.json`, tx.AsSerializable());
        return tx;
    }

    public async GetTrace(tx: EthereumTx): Promise<IReader<EthereumAddress>> {
        return this.baseClient.GetTrace(tx);
    }

    public async GetCode(address: EthereumAddress): Promise<EthereumCode> {
        const code = await this.baseClient.GetCode(address);
        this.Save(`Code/${code.Hash()}/code.json`, code.Code());
        this.Save(`Addresses/${address.AsHex()}/codeKey.json`, code.Hash());
        return code;
    }

    private EnsureDirectoryExists(filePath: string) {
        const split = filePath.split(path.sep);
        split.slice(0, -1).reduce((prev, curr, i) => {
            const dir = prev + path.sep + curr;
            if (!fs.existsSync(prev)) {
                fs.mkdirSync(prev);
            }

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            return dir;
        });
    }

    private async Save(filePath: string, content: string) {
        const targetPath = path.join(this.dataRoot, filePath);
        return new Promise((resolve, reject) => {
            this.EnsureDirectoryExists(targetPath);
            fs.writeFile(targetPath, content, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
}