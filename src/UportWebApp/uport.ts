import express = require('express');
import winston = require('winston');
import jsontokens = require('jsontokens');
import bodyParser = require('body-parser');
import config = require('config');
import qr = require('qr-image');

import { LoggingConfiguration, ContractFactory } from './../lib/modules';
import { UPortFactory } from './../lib/modules/uPort';
import { IStorage } from './../lib/interfaces';
import { IWeb3Adapter, Ethereum } from './../lib/Ethereum';

import {
    AzureBlobStorage,
    FileSystemStorage
} from './../lib/adapters';

LoggingConfiguration.initialize(null);
const app = express();

class UI {
    public static GenerateQRCode(res: any, uri: string) {
        const code = qr.image(uri, {type : 'svg'});
        res.type('svg');
        code.pipe(res);
    }
}

class UportApp {
    private readonly storage: IStorage;
    private readonly uport: UPortFactory;
    private readonly callbackRoot: string;
    private readonly contractAddress: string;
    private readonly ethereum: Ethereum.EthereumReader;

    constructor(uportConfig: any, storageConfig: any, rpcUrl: string) {
        LoggingConfiguration.initialize(null);

        this.storage = UportApp.GetStorage(`${storageConfig.root}/Tokens`, storageConfig);
        const contracts = UportApp.GetStorage(`${storageConfig.root}/Contracts`, storageConfig);
        this.uport = new UPortFactory(uportConfig.app.name, uportConfig.network, uportConfig.app.id, uportConfig.app.secret);
        this.callbackRoot = uportConfig.callbackRoot;
        this.contractAddress = uportConfig.contractAddress;
        const web3Client = new Ethereum.Web3.EthereumWeb3Adapter(rpcUrl);
        this.ethereum = new Ethereum.EthereumReader(web3Client, contracts);
    }

    public async GenerateQRCode(res: any, callback: string) {
        const uri = await this.uport.GenerateClaimsRequest(['name', 'avatar'], `${callback}`, Math.floor(new Date().getTime() / 1000) + 300);
        UI.GenerateQRCode(res, uri);
    }

    public async GenerateRegistrationQRCode(res: any) {
        await this.GenerateQRCode(res, `${this.callbackRoot}/register`);
    }

    public async GenerateCompletionQRCode(res: any) {
        await this.GenerateQRCode(res, `${this.callbackRoot}/attestcomplete`);
    }

    public async RequestRegistration(jwt: any) {
        const data = await this.uport.ReadToken(jwt);
        this.storage.SaveItem(`${this.TokenItemPath(data.address)}`, JSON.stringify(data));
        const uri = this.uport.GenerateFunctionCallUri(this.contractAddress, 'Register', [], `${this.callbackRoot}/attestregistration?address=${data.address}`);

        winston.info(`Notify ${data.name} to Register`);
        await this.uport.Push(data.pushToken, data.publicEncKey, {
            url: uri
        });
    }

    public async RespondWithRegistration(txHash: string, address: string) {
        const data = JSON.parse(await this.storage.ReadItem(`${this.TokenItemPath(address)}`));
        await this.RespondWithAttestation(data, "Attended");
    }

    public async RespondWithCompletion(jwt: any) {
        const data = await this.uport.ReadToken(jwt);
        const identityAddress = this.uport.DecodeId(data.address).address;
        const instance = await this.ethereum.GetContractInstance(new Ethereum.Models.EthereumAddress(this.contractAddress));
        const registered: boolean = instance.Participants(`${identityAddress}`);

        if (registered) {
            winston.info(`Notify ${data.name} of Completion`);
            await this.RespondWithAttestation(data, "Completed");
        }
    }

    public async RespondWithAttestation(data: any, action: string) {
        const uri = await this.uport.Attest(data.address, { Session: "CD-ARC303", Action: action }, `${this.callbackRoot}/attested`);
        winston.info(`Push ${action} Attestation`);
        await this.uport.Push(data.pushToken, data.publicEncKey, {
            url: uri
        });
    }

    private TokenItemPath(address: string): string {
        return `${address}.json`;
    }

    private static GetStorage(storageRoot: string, storageConfig: any): IStorage {
        let storage: IStorage;

        if (storageConfig.implementation === 'FileSystem') {
            storage = new FileSystemStorage(storageRoot);
        } else {
            storage = new AzureBlobStorage(storageConfig.azure.account, storageConfig.azure.key, storageRoot);
        }

        return storage;
    }

    public Run() {
        const _self = this;
        app.set('port', process.env.PORT || process.env.APPSETTING_PORT || 8081);
        app.use(bodyParser.json({ type: '*/*' }));

        app.get('/', async function (req: any, res: any) {
            await _self.GenerateRegistrationQRCode(res);
        });

        app.get('/completed', async function (req: any, res: any) {
            await _self.GenerateCompletionQRCode(res);
        });

        app.post('/register', async function (req: any, res: any) {
            await _self.RequestRegistration(req.body.access_token);
        });

        app.post('/attestregistration', async function (req: any, res: any) {
            await _self.RespondWithRegistration(req.body.tx, req.query.address);
        });

        app.post('/attestcomplete', async function (req: any, res: any) {
            await _self.RespondWithCompletion(req.body.access_token);
        });

        app.post('/attested', async function (req: any, res: any) {
            winston.info(req.body);
        });

        const server = app.listen(app.get('port'), function () {
            winston.info(`Tutorial app running... Port ${app.get('port')}`);
            winston.info(`Callback URL: ${_self.callbackRoot}`);
            winston.info(`Contract Address: ${_self.contractAddress}`);
        });
    }
}

new UportApp(config.get("uport"), config.get("storage"), config.get('rpcUrl')).Run();

