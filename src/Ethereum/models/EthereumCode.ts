import crypto = require('crypto');

export class EthereumCode {
    private readonly code: string;
    private readonly hash: string;

    constructor(code: string) {
        const sha3 = crypto.createHash('sha256');
        sha3.update(code);
        this.hash = sha3.digest('hex');
        this.code = code;
    }
}