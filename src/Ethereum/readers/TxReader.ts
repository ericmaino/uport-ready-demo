import winston = require('winston');
import { IEthereumClient } from './../IEthereumClient';
import { EthereumBlock } from './../models/EthereumBlock';
import { EthereumTx } from './../models/EthereumTx';

export class TxReader {
    private eth: IEthereumClient;
    private readonly block: EthereumBlock;
    private index: number;

    constructor(eth: IEthereumClient, block: EthereumBlock) {
        this.eth = eth;
        this.block = block;
        this.index = -1;
    }

    public async MoveNext(): Promise<boolean> {
        let moved: boolean = false;

        if ((++this.index) < this.block.TransactionCount()) {
            moved = true;
        }
        return new Promise<boolean>(resolve => resolve(moved));
    }

    public async ReadTx(): Promise<EthereumTx> {
        const txHash = this.block.GetTransactionHash(this.index);
        winston.debug(`Reading Tx ${txHash}`);
        return await this.eth.GetTransaction(txHash);
    }
}