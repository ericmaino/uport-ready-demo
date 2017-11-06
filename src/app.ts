import winston = require('winston');

import { IStorage } from './interfaces/IStorage';
import { LoggingConfiguration } from './modules/LoggingConfiguration';
import { EthereumWeb3Adapter } from './Ethereum/web3/EthereumWeb3Adapter';
import { EthereumWeb3AdapterStorageCache } from './Ethereum/web3/EthereumWeb3AdapterStorageCache';
import { FileSystemStorage } from './adapters/FileSystemStorage';
import { AzureBlobStorage } from './adapters/AzureBlobStorage';
import { ConsoleEventBus } from './adapters/ConsoleEventBus';
import { EventBusGroup } from './adapters/EventBusGroup';
import { AzureServiceBusEventBus, ServiceBusConfig } from './adapters/AzureServiceBusEventBus';
import { EthereumClient } from './Ethereum/EthereumClient';
import { BlockDetailReader } from './Ethereum/readers/BlockDetailReader';
import { EthereumWatcher } from './Ethereum/EthereumWatcher';
import util = require('util');
import config = require('config');

class Program {
    public static async Run() {
        LoggingConfiguration.initialize(null);

        const storageConfig = config.get('storage');
        const rpcUrl = config.get('rpcUrl');
        const startingBlock = config.get('startingBlock');
        const serviceBusConfig = new ServiceBusConfig(config.get("serviceBus"));
        const web3Client = new EthereumWeb3Adapter(rpcUrl);
        const networkId = EthereumClient.GetIdentity(web3Client);

        const eventBus = new EventBusGroup();
        eventBus.AddEventBus(new ConsoleEventBus());
        eventBus.AddEventBus(new AzureServiceBusEventBus(serviceBusConfig));

        let storage: IStorage;
        const storageRoot = `${storageConfig.root}/${(await networkId).AsString()}`;

        if (storageConfig.implementation === 'FileSystem') {
            storage = new FileSystemStorage(storageRoot);
        } else {
            storage = new AzureBlobStorage(storageConfig.azure.account, storageConfig.azure.key, storageRoot);
        }

        const fsCache = new EthereumWeb3AdapterStorageCache(web3Client, storage);
        const ethClient = new EthereumClient(fsCache, storage);

        new EthereumWatcher(ethClient, storage, eventBus, startingBlock)
            .Monitor()
            .catch(err => winston.error(err));
    }
}

Program.Run()
    .catch(err => winston.error(err));
