import winston = require('winston');
import { IEthereumClient } from './../IEthereumClient';
import { IReader } from './../../interfaces/IReader';
import { EthereumAddress } from './../models/EthereumAddress';
import { BlockTxReader } from './BlockTxReader';

export class BlockAddressReader {
    private eth: IEthereumClient;
    private readonly blockTxReader: BlockTxReader;
    private traceReader: IReader<EthereumAddress>;
    private address: EthereumAddress;

    constructor(eth: IEthereumClient, startingBlock: number) {
        this.eth = eth;
        this.blockTxReader = new BlockTxReader(eth, startingBlock);
    }

    public async MoveNext(): Promise<boolean> {
        this.address = null;

        while (this.address == null && this.traceReader != null && await this.traceReader.MoveNext()) {
            this.address = await this.traceReader.Read();
        }

        while (this.address == null && await this.blockTxReader.MoveNext()) {
            const tx = await this.blockTxReader.ReadTx();
            this.traceReader = await this.eth.GetTrace(tx);
            this.address = tx.TargetAddress();

            while (this.address == null && await this.traceReader.MoveNext()) {
                this.address = await this.traceReader.Read();
            }
        }

        return this.address != null;
    }

    public async ReadAddress(): Promise<EthereumAddress> {
        return new Promise<EthereumAddress>(resolve => resolve(this.address));
    }
}