import winston = require('winston');
import { IEventBus } from './../interfaces/IEventBus';

export class ConsoleEventBus implements IEventBus {
    private readonly identifier: string;

    constructor() {
        this.identifier = "Console Event Bus";
    }

    public Identifier(): string {
        return this.identifier;
    }

    public SendEvent(content: any): Promise<void> {
        winston.info(JSON.stringify(content));
        return new Promise<void>(resolve => resolve());
    }
}