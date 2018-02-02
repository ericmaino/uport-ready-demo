import express = require('express');
import winston = require('winston');
import jsontokens = require('jsontokens');
import bodyParser = require('body-parser');
import config = require('config');

import { LoggingConfiguration, ContractFactory } from './../lib/modules';
import { UPortFactory, UPortCredentialFactory } from './../lib/modules/uPort';

LoggingConfiguration.initialize(null);
const app = express();
app.set('port', process.env.PORT || process.env.APPSETTING_PORT || 8081);

app.use(bodyParser.json({ type: '*/*' }));
const uportConfig = config.get("uport");

class TopicFactory {
    public static DoWork(name: string): any {
        winston.debug('Topic ' + name);
        return {
            url: uportConfig.callback
        };
    }
}
const cFactory = new UPortCredentialFactory(uportConfig.app.name, uportConfig.app.id, uportConfig.app.secret, TopicFactory.DoWork);
const uFactory = new UPortFactory(uportConfig.app.name, uportConfig.network);

class UI {

    public static GenerateQRCode(res: any, uri: string) {
        const qrurl = 'http://chart.apis.google.com/chart?cht=qr&chs=400x400&chl=' + encodeURIComponent(uri);
        winston.info(uri);
        res.send('<div><img src=' + qrurl + '></img></div>');
    }
}

app.get('/', async function (req: any, res: any) {
    const uri = await cFactory.GenerateClaimsRequest(['name', 'avatar'], `${uportConfig.callbackRoot}/callback`, Math.floor(new Date().getTime() / 1000) + 300);
    UI.GenerateQRCode(res, uri);
});

app.post('/callback', async function (req: any, res: any) {
    const jwt = req.body.access_token;
    winston.info(req.body);
    const data = await cFactory.ReadToken(jwt);
    winston.info(data);
    const callerAddress = uFactory.DecodeId(data.address).address;

    //const uri = await cFactory.Attest(data.address, { Test: "Testing" }, config.attestCallback);

    const uri = uFactory.GenerateFunctionCallUri(uportConfig.contractAddress, 'Register', [], `${uportConfig.callbackRoot}/callback`);
    winston.debug(uri);
    await cFactory.Push(data.pushToken, data.publicEncKey, {
        url: uri
    });
});

app.post('/attest', async function (req: any, res: any) {
    winston.info(req.body);
});

const server = app.listen(app.get('port'), function () {
    winston.info(`Tutorial app running... Port ${app.get('port')}`);
    winston.info(`Callback URL: ${uportConfig.callbackRoot}`);
    winston.info(`Contract Address: ${uportConfig.contractAddress}`);
});

