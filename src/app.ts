import winston = require('winston');

import { EthereumWeb3Client } from './Ethereum/EthereumWeb3Client';
import { EthereumFileSystemDecoratorClient } from './Ethereum/EthereumFileSystemDecorator';
import { IEthereumClient } from './Ethereum/IEthereumClient';
import { LoggingConfiguration } from './modules/LoggingConfiguration';
import { TraceReader } from './Ethereum/EthereumTrace';
import { BlockAddressReader, BlockDetailReader, CodeReader } from './Ethereum/Readers';

import util = require('util');


class EthereumData {
    private readonly eth: IEthereumClient;

    constructor() {
        const web3Client = new EthereumWeb3Client("http://localhost:8545");
        this.eth = new EthereumFileSystemDecoratorClient(web3Client, "d:/chaindata");
    }
    public async filterFromBlock(blockNumber) {
        const reader = new BlockDetailReader(this.eth, blockNumber);
        const codeReader = new CodeReader(this.eth);

        while (await reader.MoveNext()) {
            const data = await reader.Read();
            let index = -1;

            while ((++index) < data.addresses.length) {
                await codeReader.ExtractCode(data.addresses[index]);
            }
        }
    }
}

LoggingConfiguration.initialize(null);
new EthereumData().filterFromBlock(174535)
    .catch(err => winston.error(err));
