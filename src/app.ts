import winston = require('winston');

import { EthereumWeb3Client } from './Ethereum/EthereumWeb3Client';
import { EthereumFileSystemCacheClientDecorator } from './Ethereum/EthereumFileSystemCacheClientDecorator';
import { EthereumClient } from './Ethereum/EthereumClient';
import { IEthereumClient } from './Ethereum/IEthereumClient';
import { LoggingConfiguration } from './modules/LoggingConfiguration';
import { TraceReader } from './Ethereum/EthereumTrace';
import { BlockAddressReader, BlockDetailReader, CodeReader } from './Ethereum/Readers';

import util = require('util');


class EthereumData {
    private readonly eth: IEthereumClient;

    constructor() {
        const web3Client = new EthereumWeb3Client("http://localhost:8545");
        const fsCache = new EthereumFileSystemCacheClientDecorator(web3Client, "d:/chaindata");
        this.eth = new EthereumClient(fsCache);
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
new EthereumData().filterFromBlock(2200)
    .catch(err => winston.error(err));
