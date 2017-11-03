import winston = require('winston');
import { IEthereumClient } from './IEthereumClient';
import { IReader } from './../interfaces/IReader';
import { EthereumBlock, EthereumBlockDetail } from './models/EthereumBlock';
import { EthereumTx } from './models/EthereumTx';
import { EthereumCode } from './models/EthereumCode';
import { EthereumAddress } from './models/EthereumAddress';
import { TraceReader } from './EthereumTrace';

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
        winston.debug(`Reading Block ${this.currentBlock}`);
        return await this.eth.GetBlockFromNumber(this.currentBlock);
    }
}

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

class MapHelper {
    static AddAddress(set: Set<string>, array: Array<EthereumAddress>, address: EthereumAddress) {
        const asHex = address.AsHex();

        if (!set.has(asHex)) {
            set.add(asHex);
            array.push(address);
        }
    }
}

export class BlockDetailReader {
    private eth: IEthereumClient;
    private readonly blockReader: BlockReader;

    constructor(eth: IEthereumClient, startingBlock: number) {
        this.eth = eth;
        this.blockReader = new BlockReader(eth, startingBlock);
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

                const traceReader = await Trace.ConstructReader(this.eth, tx);
                while (await traceReader.MoveNext()) {
                    MapHelper.AddAddress(addressSet, addresses, await traceReader.Read());
                }
            }
        }

        return new EthereumBlockDetail(block, txs, addresses);
    }
}

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

class Trace {
    public static async ConstructReader(eth: IEthereumClient, tx: EthereumTx): Promise<IReader<EthereumAddress>> {
        return await eth.GetTrace(tx);
    }
}

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
            this.traceReader = await Trace.ConstructReader(this.eth, tx);
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

export class CodeReader {
    private eth: IEthereumClient;

    constructor(eth: IEthereumClient) {
        this.eth = eth;
    }

    public async ExtractCode(address: EthereumAddress): Promise<EthereumCode> {
        return await this.eth.GetCode(address);
    }
}

// export class AddressReader {
//     private eth: IEthereumClient;
//     private readonly blockReader: BlockReader;
//     private txReader: TxReader;
//     private incrementBlock: boolean;
//     private index: number;
//     private currentAddress: EthereumAddress;

//     constructor(eth: IEthereumClient, startingBlock: number) {
//         this.eth = eth;
//         this.blockReader = new BlockReader(this.eth, startingBlock);
//         this.incrementBlock = true;
//     }

//     public async ReadAddress(): Promise<EthereumAddress>
//     {
//         return new Promise<EthereumAddress>(resolve => resolve(this.currentAddress));
//     } 

//     public async MoveNext()
//     {
//         if (this.txReader != null)
//         {
//             if (!await this.txReader.MoveNext())
//             {
//                 this.txReader = null;
//             }
//         }

//         while (this.txReader == null && await this.blockReader.MoveNext()) {
//             let block = await this.blockReader.ReadBlock();

//             if (block.TransactionCount() > 0)
//             {
//                 this.txReader = await new TxReader(this.eth, block);
//                 await this.txReader.MoveNext();
//             }
//         }


//         (await this.txReader.ReadTx()).ContractAddress()
//             if (this.txReader.)
//             while (nextAddress == null && await this.txReader.MoveNext()) {
//                 let tx = await this.txReader.ReadTx();
//                 tx.
//             }
//         }

//         if (this.incrementBlock)
//         {
//             this.txReader = null;

//             if (await this.blockReader.MoveNext())
//             {
//                 this.txReader = new TxReader(this.eth, await this.blockReader.ReadBlock());
//             }
//         }

//         if (this.txReader != null)
//         {

//         }
//         let blockReader = 
//         let codeReader = new CodeReader(this.eth);


//     }
// }