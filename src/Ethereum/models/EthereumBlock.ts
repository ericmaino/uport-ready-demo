import { EthereumAddress } from './EthereumAddress';
import { EthereumTx } from './EthereumTx';
import winston = require('winston');

export class EthereumBlock {
    private readonly content;

    constructor(content) {
        this.content = content;
    }

    public TransactionCount(): number {
        return this.content.transactions.length;
    }

    public GetTransactionHash(index: number): string {
        return this.content.transactions[index];
    }

    public BlockNumber(): number {
        return this.content.number;
    }

    public AsSerializable(): string {
        return JSON.stringify(this.content);
    }
}

export class EthereumBlockDetail {
    private block: EthereumBlock;
    private txs: Array<EthereumTx>;
    public addresses: Array<EthereumAddress>;

    constructor(block: EthereumBlock, txs: Array<EthereumTx>, addresses: Array<EthereumAddress>) {
        this.block = block;
        this.txs = txs;
        this.addresses = addresses;
    }

    public Block() : EthereumBlock {
        return this.block;
    }
}