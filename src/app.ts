import winston = require('winston');

import { IStorage } from './interfaces/IStorage';
import { IEventBus } from './interfaces/IEventBus';
import { EthereumWeb3Adapter } from './Ethereum/web3/EthereumWeb3Adapter';
import { EthereumWeb3AdapterStorageCache } from './Ethereum/web3/EthereumWeb3AdapterStorageCache';
import { FileSystemStorage } from './adapters/FileSystemStorage';
import { AzureBlobStorage } from './adapters/AzureBlobStorage';
import { ConsoleEventBus } from './adapters/ConsoleEventBus';
import { EthereumClient } from './Ethereum/EthereumClient';
import { IEthereumClient } from './Ethereum/IEthereumClient';
import { LoggingConfiguration } from './modules/LoggingConfiguration';
import { BlockDetailReader } from './Ethereum/readers/BlockDetailReader';

import util = require('util');
import config = require('config');

class EthereumData {
    private readonly eth: IEthereumClient;
    private readonly eventBus: IEventBus;

    constructor(rpcUrl: string, storage : IStorage, eventBus : IEventBus) {
        const web3Client = new EthereumWeb3Adapter(rpcUrl);
        const fsCache = new EthereumWeb3AdapterStorageCache(web3Client, storage);
        this.eth = new EthereumClient(fsCache, storage);
        this.eventBus = eventBus;

        winston.info(`Using RPC endpoint '${rpcUrl}`);
        winston.info(storage.Identifier());
        winston.info(eventBus.Identifier());
    }

    public async filterFromBlock(blockNumber: number) {
        const reader = new BlockDetailReader(this.eth, blockNumber);
        let nextBlock: number = blockNumber;

        while (await reader.MoveNext()) {
            const data = await reader.Read();
            let index = -1;

            while ((++index) < data.addresses.length) {
                const address = data.addresses[index];
                const output = await this.eth.GetData(address, data.Block());

                if (output) {
                    this.eventBus.SendEvent(output);
                }
            }

            nextBlock = data.Block().BlockNumber() + 1;
        }

        const _self = this;
        setTimeout(async () => {
            await _self.filterFromBlock(nextBlock)
                .catch(err => winston.error(err));
        }, 8500);
    }
}

LoggingConfiguration.initialize(null);

const storageConfig = config.get('storage');
const storage = new AzureBlobStorage(storageConfig.azure.account, storageConfig.azure.key, storageConfig.root);
const eventBus = new ConsoleEventBus();

new EthereumData(config.get('rpcUrl'), storage, eventBus).filterFromBlock(config.get('startingBlock'))
    .catch(err => winston.error(err));
