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
import { EthereumWatcher } from './Ethereum/EthereumWatcher';

import util = require('util');
import config = require('config');

LoggingConfiguration.initialize(null);

const storageConfig = config.get('storage');
const rpcUrl = config.get('rpcUrl');
const startingBlock = config.get('startingBlock');

const storage = new AzureBlobStorage(storageConfig.azure.account, storageConfig.azure.key, storageConfig.root);
const eventBus = new ConsoleEventBus();
const web3Client = new EthereumWeb3Adapter(rpcUrl);
const fsCache = new EthereumWeb3AdapterStorageCache(web3Client, storage);
const ethClient = new EthereumClient(fsCache, storage);

new EthereumWatcher(ethClient, storage, eventBus, startingBlock)
    .Monitor()
    .catch(err => winston.error(err));
