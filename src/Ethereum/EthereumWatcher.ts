import winston = require('winston');

import { IStorage } from './../interfaces/IStorage';
import { IEventBus } from './../interfaces/IEventBus';
import { IBlockTracker } from './../interfaces/IBlockTracker';
import { IEthereumReader } from './IEthereumReader';
import { BlockDetailReader } from './readers/BlockDetailReader';

import util = require('util');
import config = require('config');

export class EthereumWatcher {
    private readonly eth: IEthereumReader;
    private readonly eventBus: IEventBus;
    private readonly blockTracker: WatcherConfig;
    private readonly blockReader: BlockDetailReader;

    constructor(client: IEthereumReader, storage: IStorage, eventBus: IEventBus, blockNumber: number) {
        this.eth = client;
        this.eventBus = eventBus;
        this.blockTracker = new WatcherConfig(storage, blockNumber);
        this.blockReader = new BlockDetailReader(client, this.blockTracker);

        winston.info(storage.Identifier());
        winston.info(eventBus.Identifier());
    }

    public async Monitor() {
        while (await this.blockReader.MoveNext()) {
            const data = await this.blockReader.Read();
            const block = data.Block();
            let index = -1;

            while ((++index) < data.addresses.length) {
                const address = data.addresses[index];
                const output = await this.eth.GetData(address, block);

                if (output) {
                    this.eventBus.SendEvent(output);
                }
            }

            this.blockTracker.MarkComplete(block.BlockNumber());
        }

        const _self = this;
        setTimeout(async () => {
            await _self.Monitor()
                .catch(err => winston.error(err));
        }, 8500);
    }
}

export class WatcherConfig implements IBlockTracker {
    private readonly configName: string;
    private readonly storage: IStorage;
    private readonly originalBlock: number;
    private nextBlock: number;

    constructor(storage: IStorage, startingBlock: number) {
        this.configName = "watcherConfig.json";
        this.storage = storage;
        this.originalBlock = startingBlock;
        this.nextBlock =  -1;
    }

    public async NextBlock(): Promise<number> {
        if (this.nextBlock === -1) {
            if (await this.storage.Exists(this.configName)) {
                const content = await this.storage.ReadItem(this.configName);
                this.nextBlock = JSON.parse(content).nextBlock;
            }
        }

        if (this.nextBlock === -1) {
            this.nextBlock = this.originalBlock;
        }

        return this.nextBlock;
    }

    public async MarkComplete(blockNumber: number): Promise<void> {
        this.nextBlock = blockNumber + 1;
        const content = JSON.stringify({
            nextBlock: this.nextBlock
        });
        await this.storage.SaveItem(this.configName, content);
    }
}

