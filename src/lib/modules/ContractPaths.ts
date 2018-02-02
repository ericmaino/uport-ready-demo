
export class ContractPaths {
    private readonly abiPath: string;
    private readonly compiledPath: string;
    private readonly namePath: string;
    private readonly sourceMapPath: string;
    private readonly bytecodePath: string;
    private readonly runtimeBytecodePath: string;

    constructor(root: string, signature: string, contractName: string, sourceMap: string) {
        const base = `${root}/Code/${signature}`;
        this.abiPath = `${base}/abi.json`;
        this.compiledPath = `${base}/compiled.json`;
        this.runtimeBytecodePath = `${base}/runtimeBytecode.json`;
        this.bytecodePath = `${base}/bytecode.json`;
        this.namePath = `${base}/${contractName}`;
        this.sourceMapPath = sourceMap;
    }

    public AbiPath(): string {
        return this.abiPath;
    }

    public CompiledPath(): string {
        return this.compiledPath;
    }

    public RuntimeBytecodePath(): string {
        return this.runtimeBytecodePath;
    }

    public BytecodePath(): string {
        return this.bytecodePath;
    }

    public NamePath(): string {
        return this.namePath;
    }

    public SourceMapPath(): string {
        return this.sourceMapPath;
    }
}