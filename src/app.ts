import winston = require('winston');

import { EthereumWeb3Adapter } from './Ethereum/web3/EthereumWeb3Adapter';
import { EthereumWeb3AdapterFileSystemCache } from './Ethereum/web3/EthereumWeb3AdapterFileSystemCache';
import { EthereumClient } from './Ethereum/EthereumClient';
import { IEthereumClient } from './Ethereum/IEthereumClient';
import { LoggingConfiguration } from './modules/LoggingConfiguration';
import { TraceReader } from './Ethereum/readers/TraceReader';
import { BlockAddressReader } from './Ethereum/readers/BlockAddressReader';
import { BlockDetailReader } from './Ethereum/readers/BlockDetailReader';
import { CodeReader } from './Ethereum/readers/CodeReader';

import util = require('util');


class EthereumData {
    private readonly eth: IEthereumClient;

    constructor() {
        const web3Client = new EthereumWeb3Adapter("http://localhost:8545");
        const fsCache = new EthereumWeb3AdapterFileSystemCache(web3Client, "d:/chaindata");
        this.eth = new EthereumClient(fsCache);
    }
    public async filterFromBlock(blockNumber) {
        const reader = new BlockDetailReader(this.eth, blockNumber);
        const codeReader = new CodeReader(this.eth);

        while (await reader.MoveNext()) {
            const data = await reader.Read();
            let index = -1;

            while ((++index) < data.addresses.length) {
                const address = data.addresses[index];
                await codeReader.ExtractCode(address);
                const output = await this.eth.GetData(address);
                winston.debug(output);
            }
        }
    }
}

LoggingConfiguration.initialize(null);
new EthereumData().filterFromBlock(2235)
    .catch(err => winston.error(err));
