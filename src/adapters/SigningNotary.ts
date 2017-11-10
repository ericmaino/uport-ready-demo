import winston = require('winston');
import Tx = require('ethereumjs-tx');
import KeyFactory = require("keythereum");

import { ISigningNotary } from './../interfaces/ISigningNotary';
import { IStorage } from './../interfaces/IStorage';

export class SigningNotary implements ISigningNotary {
    private readonly storage: IStorage;

    constructor(storage: IStorage) {
        this.storage = storage;
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
        return new Buffer(KeyFactory.recover("", keyContent), 'hex');
    }
}