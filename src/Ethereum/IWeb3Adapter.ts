export interface IWeb3Adapter {
    GetCode(address: string): Promise<any>;
    GetTransaction(txHash: string): Promise<any>;
    GetTransactionReceipt(txHash: string): Promise<any>;
    GetTrace(txHash: string): Promise<any>;
    GetBlock(identitifer: any): Promise<any>;
}