export interface IEventBus {
    Identifier(): string;
    SendEvent(contents: any): Promise<void>;
}