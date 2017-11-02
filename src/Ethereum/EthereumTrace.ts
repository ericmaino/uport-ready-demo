import { EthereumAddress } from './models/EthereumAddress';

export class TraceReader {
    private readonly traceLog;
    private readonly addressSet: Map<string, EthereumAddress>;
    private index: number;

    constructor(traceLog) {
        this.traceLog = traceLog;
        this.index = -1;
        this.addressSet = new Map<string, EthereumAddress>();
    }

    private static ExtractAddressesFromTrace(trace): EthereumAddress {
        let address: EthereumAddress;

        if (trace.op === "CALL" || trace.op === "DELEGATECALL" || trace.op === "CALLER") {
            let possibleAddress = trace.stack[0];

            if (possibleAddress) {
                if (trace.op === "CALL" || trace.op === "DELEGATECALL") {
                    possibleAddress = trace.stack[trace.stack.length - 2];
                }
                address = EthereumAddress.Parse(possibleAddress);
            }
        }

        return address;
    }

    public async MoveNext(): Promise<boolean> {
        const lastCount = this.addressSet.size;

        while (lastCount === this.addressSet.size && (++this.index) < this.traceLog.length) {
            const address = await this.ReadAddress();

            if (address && !this.addressSet.has(address.AsHex())) {
                this.addressSet.set(address.AsHex(), address);
            }
        }

        return this.addressSet.size > lastCount;
    }

    public async ReadAddress(): Promise<EthereumAddress> {
        return new Promise<EthereumAddress>(resolve => resolve(TraceReader.ExtractAddressesFromTrace(this.traceLog[this.index])));
    }
}