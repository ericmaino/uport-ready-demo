import express = require('express');
import winston = require('winston');
import jsontokens = require('jsontokens');
import bodyParser = require('body-parser');
import { LoggingConfiguration, ContractFactory } from './modules';
import { UPortFactory, UPortCredentialFactory } from './modules/uPort';

LoggingConfiguration.initialize(null);
const app = express();
app.set('port', process.env.PORT || process.env.APPSETTING_PORT || 8081);

app.use(bodyParser.json({ type: '*/*' }));
const config = {
    attestCallback: 'https://254e6b49.ngrok.io/attest',
    callback: 'https://254e6b49.ngrok.io/callback',
    app: {
        name: 'Eric\'s Demo',
        id: '2oj4NvuUVtPsCJAf3Kb2R9LoEG9p7XLjcmV',
        secret: 'ec3619e8e2ff62f5a1ecab500c97ef606835ab46061a506ecc4ec8bc08e4f263'
    },
    network: '0x4',
    contractAddress: '0x74a51450c48dd198ab71c8d01449288690bfe469'
};

class TopicFactory {
    public static DoWork(name: string): any {
        winston.debug('Topic ' + name);
        return {
            url: config.callback
        };
    }
}
const cFactory = new UPortCredentialFactory(config.app.name, config.app.id, config.app.secret, TopicFactory.DoWork);
const uFactory = new UPortFactory(config.app.name, config.network);

class UI {

    public static GenerateQRCode(res: any, uri: string) {
        const qrurl = 'http://chart.apis.google.com/chart?cht=qr&chs=400x400&chl=' + encodeURIComponent(uri);
        winston.info(uri);
        res.send('<div><img src=' + qrurl + '></img></div>');
    }
}

app.get('/', async function (req: any, res: any) {
    const uri = await cFactory.GenerateClaimsRequest(['name', 'avatar'], config.callback, Math.floor(new Date().getTime() / 1000) + 300);
    UI.GenerateQRCode(res, uri);
});

app.post('/callback', async function (req: any, res: any) {
    const jwt = req.body.access_token;
    winston.info(req.body);
    const data = await cFactory.ReadToken(jwt);
    winston.info(data);
    const callerAddress = uFactory.DecodeId(data.address).address;

    //const uri = await cFactory.Attest(data.address, { Test: "Testing" }, config.attestCallback);

    const uri = uFactory.GenerateFunctionCallUri(config.contractAddress, 'Register', [], config.callback);
    winston.debug(uri);
    await cFactory.Push(data.pushToken, data.publicEncKey, {
        url: uri
    });
    
});

app.post('/attest', async function (req: any, res: any) {
    winston.info(req.body);
});

const server = app.listen(app.get('port'), function () {
    winston.info("Tutorial app running...");
});

