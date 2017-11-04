import winston = require('winston');
import { IEthereumClient } from './../IEthereumClient';
import { EthereumBlock } from './../models/EthereumBlock';

export class BlockReader {
    private eth: IEthereumClient;
    private currentBlock;
    private nextBlock: number;
    private latestBlock: number;

    constructor(eth: IEthereumClient, startingBlock: number) {
        this.eth = eth;
        this.nextBlock = startingBlock;
    }

    public async MoveNext(): Promise<boolean> {
        let moved: boolean = false;

        if (!this.latestBlock) {
            this.latestBlock = await this.eth.GetLatestBlockNumber();
        }
        else if (this.nextBlock === this.latestBlock) {
            this.latestBlock = await this.eth.GetLatestBlockNumber();
        }

        if (this.nextBlock < this.latestBlock) {
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