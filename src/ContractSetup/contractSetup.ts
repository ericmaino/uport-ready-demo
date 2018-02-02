import winston = require('winston');
import config = require('config');

import { LoggingConfiguration, ContractFactory } from './../lib/modules';
import { IWeb3Adapter, Ethereum } from './../lib/Ethereum';
import { IIdentifier, ISigningNotary, IStorage } from './../lib/interfaces';
import { EthereumTxInput, EthereumAddress, EthereumEstimate } from './../lib/Ethereum/models';

import {
    AzureBlobStorage,
    FileSystemStorage,
    Sha256Notary,
    SigningNotary,
    GenericIdentifier
} from './../lib/adapters';

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
        const demoConfig = config.get('setup');
        const signer = new SigningNotary(this.storage, demoConfig.secret);

        const rawContract = (await this.storage.ReadItem(demoConfig.contract.file));
        await this.DeployContract(rawContract, demoConfig.contract.name, demoConfig.contract.parameters, demoConfig.account, signer);
    }

    public async DeployContract(rawContract: string, contractName: string, contractParams: any, account: string, signer: ISigningNotary) {
        const fromAddress = new EthereumAddress(account);
        const id = await this.factory.UploadAndVerify(rawContract);
        const constructor = null;
        const prepared = await this.factory.PrepareTransaction(fromAddress, id, contractName, constructor, contractParams);
        const signed = await signer.Sign(prepared);
        winston.debug('Submitting transaction');
        const receipt = await this.web3.SendSignedTx(signed);
        winston.debug(receipt);
        winston.debug('Waiting for transaction to be mined');
        const r = await this.web3.WaitForTx(receipt);
        winston.debug(r.contractAddress);
    }
}

new Program().Run()
    .catch(err => winston.error(err));
