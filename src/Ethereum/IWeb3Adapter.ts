import { EthereumCode } from './models/EthereumCode';

export interface IWeb3Adapter {
    GetCode(address: string): Promise<EthereumCode>;
    GetTransaction(txHash: string): Promise<any>;
    GetTransactionReceipt(txHash: string): Promise<any>;
    GetTrace(txHash: string): Promise<any>;
    GetBlock(identitifer: any): Promise<any>;
    GetNetworkId(): Promise<number>;
    ReadContract(address: string, abi: any, block: any): Promise<any>;
}