import winston = require('winston');
import { IEthereumReader } from './../IEthereumReader';
import { EthereumBlock, EthereumTx } from './../models';


export class TxReader {
    private eth: IEthereumReader;
    private readonly block: EthereumBlock;
    private index: number;

    constructor(eth: IEthereumReader, block: EthereumBlock) {
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