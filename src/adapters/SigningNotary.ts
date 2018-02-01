import winston = require('winston');
import Tx = require('ethereumjs-tx');
import KeyFactory = require("keythereum");

import { ISigningNotary } from './../interfaces/ISigningNotary';
import { IStorage } from './../interfaces/IStorage';

export class SigningNotary implements ISigningNotary {
    private readonly storage: IStorage;
    private readonly secret: string;

    constructor(storage: IStorage, secret: string) {
        this.storage = storage;
        this.secret = secret;
    }

    public async Sign(rawTx: any): Promise<string> {
        const key = await this.ReadKey(rawTx.from);
        const tx = new Tx(rawTx);
        tx.sign(key);
        return `0x${tx.serialize().toString('hex')}`;
    }

    private async ReadKey(address: string): Promise<Buffer> {
        const rawContent = await this.storage.ReadItem(`keystore/${address}.json`);
        const keyContent = JSON.parse(rawContent);
        const recovered = KeyFactory.recover(this.secret, keyContent);
        return new Buffer(recovered, 'hex');
    }
}