import winston = require('winston');
import { IEthereumClient } from './../IEthereumClient';
import { EthereumTx } from './../models/EthereumTx';
import { BlockReader } from './BlockReader';
import { TxReader } from './TxReader';

export class BlockTxReader {
    private eth: IEthereumClient;
    private readonly blockReader: BlockReader;
    private txReader: TxReader;
    private tx: EthereumTx;

    constructor(eth: IEthereumClient, startingBlock: number) {
        this.eth = eth;
        this.blockReader = new BlockReader(eth, startingBlock);
    }

    public async MoveNext(): Promise<boolean> {
        this.tx = null;

        while (this.tx == null && this.txReader != null && await this.txReader.MoveNext()) {
            this.tx = await this.txReader.ReadTx();
        }

        while (this.tx == null && await this.blockReader.MoveNext()) {
            const block = await this.blockReader.ReadBlock();
            this.txReader = await new TxReader(this.eth, block);

            while (this.tx == null && await this.txReader.MoveNext()) {
                this.tx = await this.txReader.ReadTx();
            }
        }

        return this.tx != null;
    }

    public async ReadTx(): Promise<EthereumTx> {
        return new Promise<EthereumTx>(resolve => resolve(this.tx));
    }
}
