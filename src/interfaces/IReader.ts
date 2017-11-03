export interface IReader<T> {
    MoveNext(): Promise<boolean>;
    Read(): Promise<T>;
}
