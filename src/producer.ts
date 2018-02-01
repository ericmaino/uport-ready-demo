import winston = require('winston');
import config = require('config');

import { LoggingConfiguration, ContractFactory } from './modules';
import { IWeb3Adapter, Ethereum } from './Ethereum';
import { IIdentifier, ISigningNotary, IStorage } from './interfaces';
import { EthereumTxInput, EthereumAddress, EthereumEstimate } from './Ethereum/models';

import {
    AzureBlobStorage,
    FileSystemStorage,
    Sha256Notary,
    SigningNotary,
    GenericIdentifier
} from './adapters';

const EthereumWeb3Adapter = Ethereum.Web3.EthereumWeb3Adapter;

class Program {
    private readonly web3: IWeb3Adapter;
    private readonly factory: ContractFactory;
    private readonly storage: IStorage;

    constructor() {
        LoggingConfiguration.initialize(null);

        const storageConfig = config.get('storage');
        const rpcUrl = config.get('rpcUrl');

        const notary = new Sha256Notary();

        if (storageConfig.implementation === 'FileSystem') {
            this.storage = new FileSystemStorage(storageConfig.root);
        } else {
            this.storage = new AzureBlobStorage(storageConfig.azure.account, storageConfig.azure.key, storageConfig.root);
        }

        this.web3 = new EthereumWeb3Adapter(rpcUrl);
        this.factory = new ContractFactory(this.web3, this.storage, notary);
    }


    public async Run() {
        const testConfig = config.get('test');
        const signer = new SigningNotary(this.storage, testConfig.secret);

        const rawContract = (await this.storage.ReadItem(testConfig.contract.file));
        await this.DeployContract(rawContract, testConfig.contract.name, testConfig.contract.parameters, testConfig.account, signer);
    }

    public async DeployContract(rawContract: string, contractName: string, contractParams: any, account: string, signer: ISigningNotary) {
        const fromAddress = new EthereumAddress(account);
        const id = await this.factory.UploadAndVerify(rawContract);
        const constructor = null;
        const prepared = await this.factory.PrepareTransaction(fromAddress, id, contractName, constructor, contractParams);
        const signed = await signer.Sign(prepared);
        const receipt = await this.web3.SendSignedTx(signed);
        winston.debug(receipt);
    }
}

new Program().Run()
    .catch(err => winston.error(err));
