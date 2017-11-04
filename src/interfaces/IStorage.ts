export interface IStorage {
    ReadItem(itemPath: string): Promise<any>;
    Exists(itemPath: string): Promise<boolean>;
    SaveItem(itemPath: string, content: string): Promise<void>;
}