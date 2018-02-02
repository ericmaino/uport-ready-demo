import winston = require('winston');

import * as Adapters from './../lib/adapters';

import { LoggingConfiguration } from './../lib/modules';
import { IWeb3Adapter, Ethereum } from './../lib/Ethereum';
import { IBlockTracker, IIdentifier, INotary, IStorage, IEventBus } from './../lib/interfaces';

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
} from './../lib/adapters';

import util = require('util');
import config = require('config');

class Program {
    public static async Run() {
        await Program.WatchChain(config.get('rpcUrl'), config.get('startingBlock'));
    }

    public static async WatchChain(rpcUrl: string, startingBlock: number) {
        LoggingConfiguration.initialize(null);

        const storageConfig = config.get('storage');
        const web3Client = new Ethereum.Web3.EthereumWeb3Adapter(rpcUrl);
        const networkId = await Ethereum.EthereumReader.GetIdentity(web3Client);
        const eventBus = Program.GetEventBus(new ServiceBusConfig(config.get('serviceBus')));
        const chiainStorage = Program.GetChainStorage(storageConfig, networkId);
        const constractStorage = Program.GetContractStorage(storageConfig);
        const fsCache = new Ethereum.Web3.EthereumWeb3AdapterStorageCache(web3Client, chiainStorage);
        const ethClient = new Ethereum.EthereumReader(fsCache, constractStorage);

        new Ethereum.EthereumWatcher(ethClient, chiainStorage, eventBus, startingBlock)
            .Monitor()
            .catch(err => winston.error(err));
    }

    private static GetEventBus(serviceBusConfig: ServiceBusConfig): IEventBus {
        const eventBus = new EventBusGroup();
        eventBus.AddEventBus(new ConsoleEventBus());

        if (serviceBusConfig.IsValid()) {
            eventBus.AddEventBus(new AzureServiceBusEventBus(serviceBusConfig));
        }

        return eventBus;
    }

    private static GetChainStorage(storageConfig: any, networkId: IIdentifier): IStorage {
        const chainRoot = `${storageConfig.root}/${networkId.AsString()}`;
        return Program.GetStorage(chainRoot, storageConfig);
    }

    private static GetContractStorage(storageConfig: any): IStorage {
        const chainRoot = `${storageConfig.root}/Contracts`;
        return Program.GetStorage(chainRoot, storageConfig);
    }

    private static GetStorage(storageRoot: string, storageConfig: any): IStorage {
        let storage: IStorage;

        if (storageConfig.implementation === 'FileSystem') {
            storage = new FileSystemStorage(storageRoot);
        } else {
            storage = new AzureBlobStorage(storageConfig.azure.account, storageConfig.azure.key, storageRoot);
        }

        return storage;
    }
}

Program.Run()
    .catch(err => winston.error(err));
