export interface ISigningNotary {
    Sign(rawTx: any): Promise<string>;
}