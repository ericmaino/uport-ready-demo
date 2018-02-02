import { EthereumTxInput } from './EthereumTxInput';

export class EthereumEstimate {
    private readonly gasPrice: number;
    private readonly gasEstimate: number;
    private readonly nonce: number;
    private readonly txInput: EthereumTxInput;

    constructor(txInput: EthereumTxInput, nonce: number, gasEstimate: number, gasPrice: number) {
        this.nonce = nonce;
        this.gasEstimate = gasEstimate;
        this.gasPrice = gasPrice;
        this.txInput = txInput;
    }

    public Nonce(): number {
        return this.nonce;
    }

    public GasPrice(): number {
        return this.gasPrice;
    }

    public GasEstimate(): number {
        return this.gasEstimate;
    }

    public TxInput() : EthereumTxInput {
        return this.txInput;
    }
}