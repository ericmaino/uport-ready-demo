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
    GetCode(address: EthereumAddress): Promise<EthereumCode>;
}

export interface IEthereumAdapter {
    GetCode(address: string): Promise<any>;
    GetTransaction(txHash: string): Promise<any>;
    GetTransactionReceipt(txHash: string): Promise<any>;
    GetTrace(txHash: string): Promise<any>;
    GetBlock(identitifer: any): Promise<any>;
}