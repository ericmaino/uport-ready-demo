
import { EthereumAddress } from './EthereumAddress';
import { EthereumEstimate } from './EthereumEstimate';

export class EthereumTxInput {
    private readonly fromAddress: EthereumAddress;
    private readonly byteCode: string;
    private readonly paramCode: string;

    constructor(fromAddress: EthereumAddress, byteCode: string, paramCode: string) {
        this.fromAddress = fromAddress;
        this.byteCode = byteCode;
        this.paramCode = paramCode;
    }

    public AsRawTx(): any {
        const tx = {
            from: this.fromAddress.AsHex(),
            data: `0x${this.byteCode}${this.paramCode}`
        };

        return tx;
    }

    public FromAddress(): EthereumAddress {
        return this.fromAddress;
    }
}