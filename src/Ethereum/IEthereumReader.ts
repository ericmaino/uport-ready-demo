import { IReader } from './../interfaces';

import {
    EthereumAddress,
    EthereumTx,
    EthereumBlock
} from './models';

export interface IEthereumReader {
    GetLatestBlockNumber(): Promise<number>;
    GetBlockFromNumber(blockNumber: number): Promise<EthereumBlock>;
    GetTransaction(txHash: string): Promise<EthereumTx>;
    GetTrace(tx: EthereumTx): Promise<IReader<EthereumAddress>>;
    GetData(address: EthereumAddress, block: EthereumBlock): Promise<any>;
}