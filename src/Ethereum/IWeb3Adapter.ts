import { EthereumCode } from './models/EthereumCode';
import { EthereumEstimate } from './models/EthereumEstimate';
import { EthereumTxInput } from './models/EthereumTxInput';

export interface IWeb3Adapter {
    GetCode(address: string): Promise<EthereumCode>;
    GetTransaction(txHash: string): Promise<any>;
    GetTransactionReceipt(txHash: string): Promise<any>;
    GetTrace(txHash: string): Promise<any>;
    GetBlock(identitifer: any): Promise<any>;
    GetNetworkId(): Promise<number>;
    ReadContract(address: string, abi: any, block: any): Promise<any>;
    EstimateTx(tx: EthereumTxInput) : Promise<EthereumEstimate>;
    PrepareEstimatedTx(tx: EthereumEstimate) : Promise<any>;
    SendSignedTx(txBytesAsHex: string) : Promise<string>;
}