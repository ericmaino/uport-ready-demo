import crypto = require('crypto');

export class EthereumCode {
    private readonly code: string;
    private readonly hash: string;

    constructor(code: string) {
        this.hash = EthereumCode.CreateHash(code);
        this.code = code;
    }

    public Code(): string {
        return this.code;
    }

    public Hash(): string {
        return this.hash;
    }

    private static CreateHash(code: string): string {
        const sha3 = crypto.createHash('sha256');
        sha3.update(code);
        return sha3.digest('hex');
    }
}