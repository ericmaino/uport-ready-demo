import { EthereumBlock, EthereumBlockDetail } from './models/EthereumBlock';
import { EthereumTx } from './models/EthereumTx';
import { EthereumCode } from './models/EthereumCode';
import { EthereumAddress } from './models/EthereumAddress';
import { IReader } from './../interfaces/IReader';

export interface IEthereumClient {
    GetLatestBlockNumber(): Promise<number>;
    GetBlockFromNumber(blockNumber: number): Promise<EthereumBlock>;
    GetTransaction(txHash: string): Promise<EthereumTx>;
    GetTrace(tx: EthereumTx): Promise<IReader<EthereumAddress>>;
    GetData(address: EthereumAddress, block: EthereumBlock) : Promise<any>;
}