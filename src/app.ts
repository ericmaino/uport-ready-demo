import winston = require('winston');

import { EthereumWeb3Client } from './Ethereum/EthereumWeb3Client';
import { IEthereumClient } from './Ethereum/IEthereumClient';
import { LoggingConfiguration } from './modules/LoggingConfiguration';
import { TraceReader } from './Ethereum/EthereumTrace';
import { BlockAddressReader, BlockDetailReader, CodeReader } from './Ethereum/Readers';

import util = require('util');


class EthereumData {
    private readonly eth: IEthereumClient = new EthereumWeb3Client("http://localhost:8545");

    public async filterFromBlock(blockNumber) {
        const reader = new BlockDetailReader(this.eth, blockNumber);
        const codeReader = new CodeReader(this.eth);

        while (await reader.MoveNext()) {
            const data = await reader.Read();
            winston.info(data);
        }
    }
}

LoggingConfiguration.initialize(null);
new EthereumData().filterFromBlock(174535)
.catch(err => winston.error(err));
