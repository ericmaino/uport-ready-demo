import crypto = require('crypto');
import { INotary } from './../interfaces/INotary';

export class Sha256Notary implements INotary {
    public GetSignature(content: string): string {
        const sha3 = crypto.createHash('sha256');
        sha3.update(content);
        return sha3.digest('hex');
    }
}