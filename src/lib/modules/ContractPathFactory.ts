
import { IStorage } from './../interfaces';
import { ContractPaths } from './ContractPaths';

export class ContractPathFactory {
    private readonly root: string;
    private readonly storage: IStorage;

    constructor(storage: IStorage) {
        this.root = "Contracts";
        this.storage = storage;
    }

    public GetSourceRoot(fileSignature: string): string {
        return `${this.root}/Sources/${fileSignature}`;
    }

    public GetSourceFilePath(fileSignature: string): string {
        return `${this.GetSourceRoot(fileSignature)}/source.json`;
    }
    public GetContractPaths(sourceSignature: string, signature: string, contractName: string): ContractPaths {
        return new ContractPaths(this.root, signature, contractName, this.GetSourceToCodeMapPath(sourceSignature, contractName));
    }

    public async GetCompiledPath(sourceSignature: string, contractName: string): Promise<string> {
        const sourceMapPath = this.GetSourceToCodeMapPath(sourceSignature, contractName);
        const contractSignature = await this.storage.ReadItem(sourceMapPath);
        return new ContractPaths(this.root, contractSignature, contractName, sourceMapPath).CompiledPath();
    }

    private GetSourceToCodeMapPath(sourceSignature: string, contractName: string): string {
        return `${this.GetSourceRoot(sourceSignature)}/${contractName}.json`;
    }
}