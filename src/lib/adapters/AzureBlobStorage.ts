import azure = require('azure-storage');
import winston = require('winston');
import { IStorage } from './../interfaces/IStorage';

export class AzureBlobStorage implements IStorage {
    private readonly blobService: azure.BlobService;
    private readonly containerRoot: string;
    private readonly pathPrefix: string;
    private readonly identifier: string;

    constructor(storageAccount: string, storageKey: string, container: string) {
        this.blobService = azure.createBlobService(storageAccount, storageKey);
        const pathSplit = container.split('/', 2);
        this.containerRoot = pathSplit[0].toLowerCase();

        let idPrefix: string;

        if (pathSplit.length === 2) {
            this.pathPrefix = pathSplit[1];
            idPrefix = ` - '${this.pathPrefix}'`;
        }

        this.identifier = `Azure Blob Storage '${storageAccount}' - '${this.containerRoot}'${idPrefix}`;
    }

    public Identifier(): string {
        return this.identifier;
    }

    public async ReadItem(itemPath: string): Promise<any> {
        return await new Promise<any>((resolve, reject) => {
            this.blobService.getBlobToText(this.containerRoot, this.AdjustPath(itemPath), function (error: any, text: any, blockBlob: any, response: any) {
                if (error) {
                    reject(error);
                } else {
                    resolve(text);
                }
            });
        });
    }

    public async Exists(itemPath: string): Promise<boolean> {
        return await new Promise<boolean>((resolve, reject) => {
            this.blobService.doesBlobExist(this.containerRoot, this.AdjustPath(itemPath), function (error: any, result: any, response: any) {
                if (error) {
                    reject(error);
                } else {
                    resolve(result.exists);
                }
            });
        });
    }

    public async SaveItem(itemPath: string, content: string): Promise<void> {
        await this.CreateContainerIfNotExist(this.containerRoot);

        return new Promise<void>((resolve, reject) => {
            this.blobService.createBlockBlobFromText(this.containerRoot, this.AdjustPath(itemPath), content, function (error: any, result: any, response: any) {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    public GetPath(itemPath: string): string {
        return this.AdjustPath(itemPath);
    }
    
    private AdjustPath(itemPath: string): string {
        if (this.pathPrefix) {
            itemPath = `${this.pathPrefix}/${itemPath}`;
        }

        return itemPath;
    }

    private async CreateContainerIfNotExist(containerName: string): Promise<void> {
        return await new Promise<void>((resolve, reject) => {
            this.blobService.createContainerIfNotExists(containerName, {
                publicAccessLevel: 'container'
            }, function (error: any, result: any, response: any) {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }
}