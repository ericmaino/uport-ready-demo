import winston = require('winston');

import * as Adapters from './adapters';

import { IStorage } from './interfaces/IStorage';
import { LoggingConfiguration } from './modules/LoggingConfiguration';
import { EthereumWeb3Adapter } from './Ethereum/web3/EthereumWeb3Adapter';
import { EthereumWeb3AdapterStorageCache } from './Ethereum/web3/EthereumWeb3AdapterStorageCache';
import { EthereumReader } from './Ethereum/EthereumReader';
import { BlockDetailReader } from './Ethereum/readers/BlockDetailReader';
import { EthereumWatcher } from './Ethereum/EthereumWatcher';
import util = require('util');
import config = require('config');

const AzureBlobStorage = Adapters.AzureBlobStorage;
const FileSystemStorage = Adapters.FileSystemStorage;
const ServiceBusConfig = Adapters.ServiceBusConfig;
const EventBusGroup = Adapters.EventBusGroup;
const ConsoleEventBus = Adapters.ConsoleEventBus;
const AzureServiceBusEventBus = Adapters.AzureServiceBusEventBus;

class Program {
    public static async Run() {
        LoggingConfiguration.initialize(null);

        const storageConfig = config.get('storage');
        const rpcUrl = config.get('rpcUrl');
        const startingBlock = config.get('startingBlock');
        const web3Client = new EthereumWeb3Adapter(rpcUrl);
        const networkId = EthereumReader.GetIdentity(web3Client);
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

        const fsCache = new EthereumWeb3AdapterStorageCache(web3Client, chiainStorage);
        const ethClient = new EthereumReader(fsCache, constractStorage);

        new EthereumWatcher(ethClient, chiainStorage, eventBus, startingBlock)
            .Monitor()
            .catch(err => winston.error(err));
    }
}

Program.Run()
    .catch(err => winston.error(err));
