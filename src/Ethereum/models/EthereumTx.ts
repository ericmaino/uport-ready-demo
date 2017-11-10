import winston = require('winston');
import { EthereumAddress } from './EthereumAddress';

export class EthereumTx {
    private readonly tx;
    private readonly receipt;

    constructor(tx: any, receipt: any) {
        this.tx = tx;
        this.receipt = receipt;
    }

    public TargetAddress(): EthereumAddress {
        let address = null;

        if (this.receipt.contractAddress) {
            address = this.receipt.contractAddress;
        }

        if (!address && this.receipt.to) {
            address = this.receipt.to;
        }

        return new EthereumAddress(address);
    }

    public OriginatingAddress(): EthereumAddress {
        return new EthereumAddress(this.tx.from);
    }

    public Hash(): string {
        return this.tx.hash;
    }

    public AsSerializable() : string {
        return JSON.stringify({tx: this.tx, receipt: this.receipt});
    }
}