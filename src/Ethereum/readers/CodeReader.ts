import winston = require('winston');
import { IEthereumClient } from './../IEthereumClient';
import { EthereumCode } from './../models/EthereumCode';
import { EthereumAddress } from './../models/EthereumAddress';

export class CodeReader {
    private eth: IEthereumClient;

    constructor(eth: IEthereumClient) {
        this.eth = eth;
    }

    public async ExtractCode(address: EthereumAddress): Promise<EthereumCode> {
        return await this.eth.GetCode(address);
    }
}