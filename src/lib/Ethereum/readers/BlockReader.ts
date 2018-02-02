import winston = require('winston');
import { IEthereumReader } from './../IEthereumReader';
import { IBlockTracker } from './../../interfaces';
import { EthereumBlock } from './../models';

export class BlockReader {
    private readonly eth: IEthereumReader;
    private readonly blockTracker: IBlockTracker;
    private currentBlock: number;
    private nextBlock: number;
    private latestBlock: number;

    constructor(eth: IEthereumReader, blockTracker: IBlockTracker) {
        this.eth = eth;
        this.blockTracker = blockTracker;
        this.currentBlock = this.nextBlock = this.latestBlock = -1;
    }

    public async MoveNext(): Promise<boolean> {
        let moved: boolean = false;

        if (this.latestBlock === -1) {
            this.latestBlock = await this.eth.GetLatestBlockNumber();
        }
        else if (this.nextBlock === this.latestBlock) {
            this.latestBlock = await this.eth.GetLatestBlockNumber();
        }

        if (this.nextBlock === -1) {
            this.nextBlock = await this.blockTracker.NextBlock();
        }

        if (this.nextBlock <= this.latestBlock) {
            this.currentBlock = this.nextBlock;
            this.nextBlock++;
            moved = true;
        }

        return new Promise<boolean>(resolve => resolve(moved));
    }

    public async ReadBlock(): Promise<EthereumBlock> {
        if ((this.currentBlock % 10) === 0) {
            winston.debug(`Reading Block ${this.currentBlock}`);
        }

        return await this.eth.GetBlockFromNumber(this.currentBlock);
    }
}