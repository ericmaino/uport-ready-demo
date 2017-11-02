import { EthereumBlock, EthereumBlockDetail } from './models/EthereumBlock';
import { EthereumTx } from './models/EthereumTx';
import { EthereumCode } from './models/EthereumCode';
import { EthereumAddress } from './models/EthereumAddress';

export interface IReader<T> {
    MoveNext(): Promise<boolean>;
    Read(): Promise<T>;
}

export interface IEthereum {
    GetLatestBlockNumber() : Promise<number>;
    GetBlockFromNumber(blockNumber: number): Promise<EthereumBlock>;
    GetTransaction(txHash: string): Promise<EthereumTx>;
    GetTrace(tx: EthereumTx): Promise<IReader<EthereumAddress>>;
    GetCode(address: EthereumAddress): Promise<EthereumCode>;
}