import winston = require('winston');
import jsontokens = require('jsontokens');
import { Connect, Credentials, SimpleSigner, MNID } from 'uport-connect';

export class UPortFactory {
    private readonly appName: string;
    private readonly networkId: string;

    public constructor(appName: string, networkId: string) {
        this.appName = appName;
        this.networkId = networkId;
    }

    public GenerateFunctionCallUri(contractAddress: string, functionName: string, functionParams: Array<any>, callbackUrl: string): string {
        let paramString = '';

        if (functionParams != null) {
            functionParams.forEach((v) => {
                if (paramString.length > 0) {
                    paramString += ', ';
                }
                paramString += `${v.type} ${v.value}`;
            });
        }

        const contractId = this.EncodeId(contractAddress);
        const encodedArgs = `function=${functionName}(${paramString})&callback_url=${callbackUrl}`;
        const uri = `me.uport:${contractId}?${encodedArgs}`;
        return uri;
    }

    public async GenerateClaimsRequest(claims: Array<string>, callbackUrl: string, expiration: number): Promise<string> {
        //exp: Math.floor(new Date().getTime() / 1000) + 300
        const requestToken = await Credentials.createRequest({
            requested: claims,
            callbackUrl: callbackUrl,
            exp: expiration
        });

        return 'me.uport:me?requestToken=' + requestToken;
    }

    public EncodeId(contractAddress: string): string {
        return MNID.encode({ network: this.networkId, address: contractAddress });
    }

    public DecodeId(encodedId: string): any {
        return MNID.decode(encodedId);
    }
}

export class UPortCredentialFactory {
    private readonly credentials: Credentials;
    private readonly connect: Connect;

    public constructor(appName: string, identifer: string, key: string, topicFactory: any) {
        const signer = SimpleSigner(key);
        this.credentials = new Credentials({
            appName: appName,
            address: identifer,
            signer: signer
        });
        this.connect = new Connect(appName, { credentials: this.credentials, topicFactory: topicFactory });
    }

    public async GenerateClaimsRequest(claims: Array<string>, callbackUrl: string, expiration: number): Promise<string> {
        const requestToken = await this.credentials.createRequest({
            requested: claims,
            callbackUrl: callbackUrl,
            exp: expiration,
            notifications: true
        });

        return 'me.uport:me?requestToken=' + requestToken;
    }

    public async ReadToken(jwt: string): Promise<any> {
        return await this.credentials.receive(jwt);
    }

    public async Push(token: string, pubKey: string, payload: any): Promise<any> {
        return await this.credentials.push(token, pubKey, payload);
    }

    public async Attest(uportId: string, claim: any, callbackUrl: string): Promise<any> {
        const att = {
            sub: uportId,
            exp: new Date().getTime() + 30 * 24 * 60 * 60 * 1000,
            claim: claim
        };
        const jwt = await this.credentials.attest(att);
        return `me.uport:add?attestations=${encodeURIComponent(jwt)}&callback_url=${encodeURIComponent(callbackUrl)}`;
    }
}

