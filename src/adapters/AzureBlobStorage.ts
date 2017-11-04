import azure = require('azure-storage');
import winston = require('winston');
import { IStorage } from './../interfaces/IStorage';

export class AzureBlobStorage implements IStorage {
    private readonly blobService: azure.BlobService;
    private readonly containerRoot: string;
    private readonly identifier : string;

    constructor(storageAccount: string, storageKey: string, container: string) {
        this.blobService = azure.createBlobService(storageAccount, storageKey);
        this.containerRoot = container;
        this.identifier = `Azure Blob Storage '${storageAccount}' - '${container}'`;
    }

    public Identifier() : string {
        return this.identifier;
    }

    public async ReadItem(itemPath: string): Promise<any> {
        return await new Promise<any>((resolve, reject) => {
            this.blobService.getBlobToText(this.containerRoot, itemPath, function (error: any, text: any, blockBlob: any, response: any) {
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
            this.blobService.doesBlobExist(this.containerRoot, itemPath, function (error: any, result: any, response: any) {
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
            this.blobService.createBlockBlobFromText(this.containerRoot, itemPath, content, function (error: any, result: any, response: any) {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
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