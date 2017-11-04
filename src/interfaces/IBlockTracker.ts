export interface IBlockTracker {
    NextBlock(): Promise<number>;
    MarkComplete(blockNumber: number): Promise<void>;
}