import Web3 = require('web3');
import net = require('net');
import winston = require('winston');
import { JobQueue } from './../../modules/JobQueue';
import { IWeb3Adapter } from './../IWeb3Adapter';
import { EthereumCode } from './../models/EthereumCode';

export class EthereumWeb3Adapter implements IWeb3Adapter {
    private readonly web3: Web3;
    private readonly queue: JobQueue;

    constructor(public rpcUrl: string) {
        this.web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl, 2000));
        this.queue = new JobQueue();
    }

    public async GetTrace(txHash: string): Promise<any> {

        const traceLog = await this.queue.ExecuteJob(() => new Promise((resolve, reject) => {
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
        }));

        return traceLog.structLogs;
    }

    public async GetCode(address: string): Promise<EthereumCode> {
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

        let result: EthereumCode;

        if (code && code.length > 2) {
            result = new EthereumCode(code);
        }

        return result;
    }

    public async ReadContract(address: string, abi: any, block?: any): Promise<any> {
        if (!block) {
            block = 'latest';
        }

        return await this.queue.ExecuteJob(() => new Promise((resolve, reject) => {
            const contract = this.web3.eth.contract(abi).at(address);
            const contractData = {};

            abi.forEach(x => {
                if (x.constant && x.inputs.length === 0) {
                    const value = contract[x.name](block);

                    if (x.outputs[0].type === 'uint256') {
                        contractData[x.name] = value.toNumber();
                    }
                    else {
                        contractData[x.name] = value;
                    }
                }
            });

            resolve(contractData);
        }));
    }

    public async GetBlock(identifer: string): Promise<any> {
        return await this.queue.ExecuteJob(() =>
            new Promise((resolve, reject) => {
                this.web3.eth.getBlock(identifer, (error, block) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(block);
                    }
                });
            }));
    }

    public async GetTransactionReceipt(txHash: string): Promise<any> {
        return await this.queue.ExecuteJob(() => new Promise((resolve, reject) => {
            this.web3.eth.getTransactionReceipt(txHash, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        }));
    }

    public async GetTransaction(txHash: string): Promise<any> {
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