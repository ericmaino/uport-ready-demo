import winston = require('winston');
import { EthereumAddress } from './models/EthereumAddress';
import { IReader } from './../interfaces/IReader';

export class TraceReader implements IReader<EthereumAddress> {
    private readonly traceLog;
    private readonly addressSet: Map<string, EthereumAddress>;
    private index: number;
    private currentAddress: EthereumAddress;

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

            winston.debug(`${trace.op} - ${possibleAddress}`);
        }

        return address;
    }

    public async MoveNext(): Promise<boolean> {
        const lastCount = this.addressSet.size;
        this.currentAddress = null;

        while (lastCount === this.addressSet.size && (++this.index) < this.traceLog.length) {
            const address = TraceReader.ExtractAddressesFromTrace(this.traceLog[this.index]);

            if (address && !this.addressSet.has(address.AsHex())) {
                this.addressSet.set(address.AsHex(), address);
                this.currentAddress = address;
            }
        }

        return this.addressSet.size > lastCount;
    }

    public async Read(): Promise<EthereumAddress> {
        return new Promise<EthereumAddress>(resolve => resolve(this.currentAddress));
    }
}