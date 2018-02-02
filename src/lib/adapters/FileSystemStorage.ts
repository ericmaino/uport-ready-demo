import winston = require('winston');
import fs = require('fs');
import path = require('path');

import { IStorage } from './../interfaces/IStorage';

export class FileSystemStorage implements IStorage {
    private readonly dataRoot: string;
    private readonly identifier: string;

    constructor(dataRoot: string) {
        this.dataRoot = dataRoot;
        this.identifier = `Local File System '${dataRoot}'`;
    }

    public Identifier(): string {
        return this.identifier;
    }

    public async ReadItem(itemPath: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            fs.readFile(this.GetPath(itemPath), { encoding: 'utf8' }, (err, data) => {
                if (err) {
                    reject(err);
                }
                resolve(data);
            });
        });
    }

    public async Exists(itemPath: string): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            fs.exists(this.GetPath(itemPath), (exists) => {
                resolve(exists);
            });
        });
    }

    public async SaveItem(itemPath: string, content: string): Promise<any> {
        const targetPath = this.GetPath(itemPath);
        return new Promise((resolve, reject) => {
            this.EnsureDirectoryExists(targetPath);
            fs.writeFile(targetPath, content, { encoding: 'utf8' }, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }

    public GetPath(itemPath: string): string {
        return path.join(this.dataRoot, itemPath);
    }

    private EnsureDirectoryExists(filePath: string) {
        const split = filePath.split(path.sep);
        split.slice(0, -1).reduce((prev, curr, i) => {
            const dir = prev + path.sep + curr;
            if (prev && !fs.existsSync(prev)) {
                fs.mkdirSync(prev);
            }

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            return dir;
        });
    }
}