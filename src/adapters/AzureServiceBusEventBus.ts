import azure = require('azure');
import { IEventBus } from './../interfaces/IEventBus';

export class ServiceBusConfig {
    private readonly namespace: string;
    private readonly keyName: string;
    private readonly key: string;
    private readonly topic: string;
    private readonly identifier: string;

    constructor(config: any) {
        if (config && config.key) {
            this.namespace = config.namespace;
            this.keyName = config.keyName;
            this.key = config.key;
            this.topic = config.topic;
            this.identifier = `'${this.namespace}' - ${this.topic}'`;
        }
    }

    public AsConnectionString(): string {
        return `Endpoint=sb://${this.namespace}.servicebus.windows.net/;SharedAccessKeyName=${this.keyName};SharedAccessKey=${this.key};`;
    }

    public Identifier(): string {
        return this.identifier;
    }

    public Topic(): string {
        return this.topic;
    }

    public IsValid(): boolean {
        return this.key !== undefined;
    }
}

export class AzureServiceBusEventBus implements IEventBus {
    private readonly identifier: string;
    private readonly serviceBus: azure.ServiceBusService;
    private readonly topic: string;

    constructor(config: ServiceBusConfig) {
        this.serviceBus = azure.createServiceBusService(config.AsConnectionString());
        this.topic = config.Topic();
        this.identifier = `Azure Service Bus ${config.Identifier()}`;
    }

    public Identifier(): string {
        return this.identifier;
    }

    public async SendEvent(contents: any): Promise<void> {
        const message = {
            body: JSON.stringify(contents)
        };

        await new Promise<void>((resolve, reject) => {
            this.serviceBus.sendTopicMessage(this.topic, message, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }
}