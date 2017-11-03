import Web3 = require('web3');
import net = require('net');
import winston = require('winston');
import { JobQueue } from './../modules/JobQueue';
import { IEthereumClient } from './IEthereumClient';
import { EthereumBlock, EthereumBlockDetail } from './models/EthereumBlock';
import { EthereumTx } from './models/EthereumTx';
import { EthereumCode } from './models/EthereumCode';
import { EthereumAddress } from './models/EthereumAddress';
import { IReader } from './../interfaces/IReader';
import { TraceReader } from './EthereumTrace';

export class EthereumWeb3Client implements IEthereumClient {
    private readonly web3: Web3;
    private readonly queue: JobQueue;

    constructor(public rpcUrl: string) {
        this.web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl, 2000));
        this.queue = new JobQueue();
    }

    public async GetTrace(tx: EthereumTx): Promise<IReader<EthereumAddress>> {

        const traceLog = await this.queue.ExecuteJob(() => new Promise((resolve, reject) => {
            this.web3.currentProvider.sendAsync({
                jsonrpc: "2.0",
                method: "debug_traceTransaction",
                params: [tx.Hash()],
                id: new Date().getTime()
            }, function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.result);
                }
            });
        }));

        return new TraceReader(traceLog.structLogs);
    }

    public async GetTransaction(txHash: string): Promise<EthereumTx> {
        const tx = await this.GetTransactionData(txHash);
        const receipt = await this.GetTransactionReceipt(txHash);
        return new EthereumTx({ tx: tx, receipt: receipt });
    }

    public async GetCode(address: EthereumAddress): Promise<EthereumCode> {
        const code = await this.queue.ExecuteJob(() => new Promise((resolve, reject) => {
            this.web3.eth.getCode(address, (error, result) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(result);
                }
            });
        }));

        return new EthereumCode(code);
    }

    public async GetBlockFromNumber(blockNumber: number): Promise<EthereumBlock> {
        const block = await this.GetBlockFromIdentifer(blockNumber);
        return new EthereumBlock(block);
    }

    public async GetLatestBlockNumber(): Promise<number> {
        const latestBlock = await this.GetBlockFromIdentifer('latest');
        return latestBlock.number;
    }

    private GetBlockFromIdentifer(blockHashNumberOrLabel) {
        return this.queue.ExecuteJob(() =>
            new Promise((resolve, reject) => {
                this.web3.eth.getBlock(blockHashNumberOrLabel, (error, block) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(block);
                    }
                });
            }));
    }

    private GetTransactionReceipt(txHash) {
        return this.queue.ExecuteJob(() => new Promise((resolve, reject) => {
            this.web3.eth.getTransactionReceipt(txHash, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        }));
    }

    private async GetTransactionData(txHash) {
        return await this.queue.ExecuteJob(async () => new Promise((resolve, reject) => {
            this.web3.eth.getTransaction(txHash, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        }));
    }
}