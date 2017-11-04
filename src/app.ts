import winston = require('winston');

import { EthereumWeb3Adapter } from './Ethereum/web3/EthereumWeb3Adapter';
import { EthereumWeb3AdapterStorageCache } from './Ethereum/web3/EthereumWeb3AdapterStorageCache';
import { FileSystemStorage } from './adapters/FileSystemStorage';
import { EthereumClient } from './Ethereum/EthereumClient';
import { IEthereumClient } from './Ethereum/IEthereumClient';
import { LoggingConfiguration } from './modules/LoggingConfiguration';
import { TraceReader } from './Ethereum/readers/TraceReader';
import { BlockAddressReader } from './Ethereum/readers/BlockAddressReader';
import { BlockDetailReader } from './Ethereum/readers/BlockDetailReader';

import util = require('util');


class EthereumData {
    private readonly eth: IEthereumClient;

    constructor(rpcUrl: string, storageRoot: string) {
        const fsStorage = new FileSystemStorage(storageRoot);
        const web3Client = new EthereumWeb3Adapter(rpcUrl);
        const fsCache = new EthereumWeb3AdapterStorageCache(web3Client, fsStorage);
        this.eth = new EthereumClient(fsCache, fsStorage);
    }

    public async filterFromBlock(blockNumber: number) {
        const reader = new BlockDetailReader(this.eth, blockNumber);

        while (await reader.MoveNext()) {
            const data = await reader.Read();
            let index = -1;

            while ((++index) < data.addresses.length) {
                const address = data.addresses[index];
                const output = await this.eth.GetData(address, data.Block());

                if (output) {
                    winston.debug(output);
                }
            }
        }
    }
}

LoggingConfiguration.initialize(null);
new EthereumData("http://localhost:8545", "d:/chaindata").filterFromBlock(2235)
    .catch(err => winston.error(err));
