import express = require('express');
import winston = require('winston');
import jsontokens = require('jsontokens');
import bodyParser = require('body-parser');
import config = require('config');

import { LoggingConfiguration, ContractFactory } from './../lib/modules';
import { UPortFactory } from './../lib/modules/uPort';
import { IStorage } from './../lib/interfaces';

import {
    AzureBlobStorage,
    FileSystemStorage
} from './../lib/adapters';

LoggingConfiguration.initialize(null);
const app = express();

class UI {
    public static GenerateQRCode(res: any, uri: string) {
        const qrurl = 'http://chart.apis.google.com/chart?cht=qr&chs=400x400&chl=' + encodeURIComponent(uri);
        winston.info(uri);
        res.send('<div><img src=' + qrurl + '></img></div>');
    }
}

class UportApp {
    private readonly storage: IStorage;
    private readonly uport: UPortFactory;
    private readonly callbackRoot: string;
    private readonly contractAddress: string;

    constructor(uportConfig: any, storageConfig: any) {
        if (storageConfig.implementation === 'FileSystem') {
            this.storage = new FileSystemStorage(storageConfig.root);
        } else {
            this.storage = new AzureBlobStorage(storageConfig.azure.account, storageConfig.azure.key, storageConfig.root);
        }

        this.uport = new UPortFactory(uportConfig.app.name, uportConfig.network, uportConfig.app.id, uportConfig.app.secret);
        this.callbackRoot = uportConfig.callbackRoot;
        this.contractAddress = uportConfig.contractAddress;
    }

    public async GenerateQRCode(res: any) {
        const uri = await this.uport.GenerateClaimsRequest(['name', 'avatar'], `${this.callbackRoot}/register`, Math.floor(new Date().getTime() / 1000) + 300);
        UI.GenerateQRCode(res, uri);
    }

    public async RequestRegistration(jwt: any) {
        const data = await this.uport.ReadToken(jwt);
        this.storage.SaveItem(data.address, JSON.stringify(data));
        const uri = this.uport.GenerateFunctionCallUri(this.contractAddress, 'Register', [], `${this.callbackRoot}/attest?address=${data.address}`);

        winston.info(`Notify ${data.address} to Register`);
        await this.uport.Push(data.pushToken, data.publicEncKey, {
            url: uri
        });
    }

    public async RespondWithAttestation(txHash: string, address: string) {
        const data = JSON.parse(await this.storage.ReadItem(address));
        const uri = await this.uport.Attest(data.address, { Session: "CD-ARC303" }, config.attestCallback);
        winston.info(`Push attestation`);
        await this.uport.Push(data.pushToken, data.publicEncKey, {
            url: uri
        });
    }

    public Run() {
        const _self = this;
        app.set('port', process.env.PORT || process.env.APPSETTING_PORT || 8081);
        app.use(bodyParser.json({ type: '*/*' }));

        app.get('/', async function (req: any, res: any) {
            await _self.GenerateQRCode(res);
        });

        app.post('/register', async function (req: any, res: any) {
            await _self.RequestRegistration(req.body.access_token);
        });

        app.post('/attest', async function (req: any, res: any) {
            await _self.RespondWithAttestation(req.body.tx, req.query.address);
        });

        const server = app.listen(app.get('port'), function () {
            winston.info(`Tutorial app running... Port ${app.get('port')}`);
            winston.info(`Callback URL: ${_self.callbackRoot}`);
            winston.info(`Contract Address: ${_self.contractAddress}`);
        });
    }
}

new UportApp(config.get("uport"), config.get("storage")).Run();

