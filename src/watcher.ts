import winston = require('winston');

import * as Adapters from './adapters';

import { LoggingConfiguration } from './modules';
import { IWeb3Adapter, Ethereum } from './Ethereum';
import { IBlockTracker, IIdentifier, INotary, IStorage } from './interfaces';

import {
    AzureBlobStorage,
    FileSystemStorage,
    Sha256Notary,
    SigningNotary,
    GenericIdentifier,
    ServiceBusConfig,
    EventBusGroup,
    ConsoleEventBus,
    AzureServiceBusEventBus
} from './adapters';

import util = require('util');
import config = require('config');

class Program {
    public static async Run() {
        LoggingConfiguration.initialize(null);

        const storageConfig = config.get('storage');
        const rpcUrl = config.get('rpcUrl');
        const startingBlock = config.get('startingBlock');
        const web3Client = new Ethereum.Web3.EthereumWeb3Adapter(rpcUrl);
        const networkId = Ethereum.EthereumReader.GetIdentity(web3Client);
        const serviceBusConfig = new ServiceBusConfig(config.get("serviceBus"));

        const eventBus = new EventBusGroup();
        eventBus.AddEventBus(new ConsoleEventBus());

        if (serviceBusConfig.IsValid()) {
            eventBus.AddEventBus(new AzureServiceBusEventBus(serviceBusConfig));
        }

        let chiainStorage: IStorage;
        let constractStorage: IStorage;
        const storageRoot = `${storageConfig.root}/${(await networkId).AsString()}`;
        const contractRoot = `${storageConfig.root}/Contracts`;

        if (storageConfig.implementation === 'FileSystem') {
            chiainStorage = new FileSystemStorage(storageRoot);
            constractStorage = new FileSystemStorage(contractRoot);
        } else {
            chiainStorage = new AzureBlobStorage(storageConfig.azure.account, storageConfig.azure.key, storageRoot);
            constractStorage = new AzureBlobStorage(storageConfig.azure.account, storageConfig.azure.key, contractRoot);
        }

        const fsCache = new Ethereum.Web3.EthereumWeb3AdapterStorageCache(web3Client, chiainStorage);
        const ethClient = new Ethereum.EthereumReader(fsCache, constractStorage);

        new Ethereum.EthereumWatcher(ethClient, chiainStorage, eventBus, startingBlock)
            .Monitor()
            .catch(err => winston.error(err));
    }
}

Program.Run()
    .catch(err => winston.error(err));
