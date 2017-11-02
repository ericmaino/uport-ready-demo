import Web3 = require('web3');
import net = require('net');
import winston = require('winston');
import { JobQueue } from './../modules/JobQueue';

export class Ethereum {
    private readonly web3: Web3;
    private readonly queue: JobQueue;

    constructor(public rpcUrl: string) {
        this.web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl, 2000));
        this.queue = new JobQueue();
    }

    public TraceTransaction(txHash) {
        return this.queue.ExecuteJob(() => new Promise((resolve, reject) => {
            try {
                this.web3.currentProvider.sendAsync({
                    jsonrpc: "2.0",
                    method: "debug_traceTransaction",
                    params: [txHash],
                    id: new Date().getTime()
                }, function (err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result.result);
                    }
                });
            }
            catch (err) {
                reject(err);
            }
        }));
    }

    public GetTxAndReceipt(txHash) {
        return this.GetTransaction(txHash)
            .then(tx => this.GetTransactionReceipt(tx.hash)
                .then(receipt => {
                    return {
                        tx: tx,
                        receipt: receipt
                    };
                }));
    }

    public GetCodeForAddress(address) {
        return this.queue.ExecuteJob(() => new Promise((resolve, reject) => {
            this.web3.eth.getCode(address, (error, code) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve({ code: code, address: address });
                }
            })
        }));
    }

    public GetBlockFromHash(hash) {
        return this.GetBlockFromIdentifer(hash);
    }

    public GetBlockFromNumber(blockNumber) {
        return this.GetBlockFromIdentifer(blockNumber);
    }

    public GetLatestBlockNumber() {
        return this.GetBlockFromIdentifer('latest')
            .then(block => block.number);
    }

    private GetBlockFromIdentifer(blockHashNumberOrLabel, count = 0) {
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

    private GetTransaction(txHash) {
        return this.queue.ExecuteJob(() => new Promise((resolve, reject) => {
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