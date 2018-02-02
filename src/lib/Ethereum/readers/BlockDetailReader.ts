import winston = require('winston');
import { IReader, IBlockTracker } from './../../interfaces/';
import { IEthereumReader } from './../IEthereumReader';
import { BlockReader } from './BlockReader';
import { TxReader } from './TxReader';

import {
    EthereumBlockDetail,
    EthereumTx,
    EthereumAddress
} from './../models';

export class BlockDetailReader {
    private eth: IEthereumReader;
    private readonly blockReader: BlockReader;

    constructor(eth: IEthereumReader, blockTracker: IBlockTracker) {
        this.eth = eth;
        this.blockReader = new BlockReader(eth, blockTracker);
    }

    public async MoveNext(): Promise<boolean> {
        return this.blockReader.MoveNext();
    }

    public async Read(): Promise<EthereumBlockDetail> {
        const block = await this.blockReader.ReadBlock();
        const txs = new Array<EthereumTx>();
        const addressSet = new Set<string>();
        const addresses = new Array<EthereumAddress>();

        if (block.TransactionCount() > 0) {
            const txReader = new TxReader(this.eth, block);

            while (await txReader.MoveNext()) {
                const tx = await txReader.ReadTx();
                txs.push(tx);
                MapHelper.AddAddress(addressSet, addresses, tx.OriginatingAddress());
                MapHelper.AddAddress(addressSet, addresses, tx.TargetAddress());

                const traceReader = await this.eth.GetTrace(tx);
                while (await traceReader.MoveNext()) {
                    MapHelper.AddAddress(addressSet, addresses, await traceReader.Read());
                }
            }
        }

        return new EthereumBlockDetail(block, txs, addresses);
    }
}

class MapHelper {
    static AddAddress(set: Set<string>, array: Array<EthereumAddress>, address: EthereumAddress) {
        const asHex = address.AsHex();

        if (!set.has(asHex)) {
            set.add(asHex);
            array.push(address);
        }
    }
}