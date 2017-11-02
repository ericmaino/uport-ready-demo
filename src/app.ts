import winston = require('winston');

import { Ethereum } from './Ethereum/Ethereum';
import { LoggingConfiguration } from './modules/LoggingConfiguration';
import { TraceReader } from './Ethereum/EthereumTrace';
import { BlockAddressReader, BlockDetailReader, CodeReader } from './Ethereum/Readers';

import util = require('util');


class EthereumData {
    private readonly eth: Ethereum = new Ethereum("http://localhost:8545");

    public async filterFromBlock(blockNumber) {
        const reader = new BlockDetailReader(this.eth, blockNumber);
        const codeReader = new CodeReader(this.eth);

        while (await reader.MoveNext()) {
            const data = await reader.Read();
            winston.info(data);
        }
    }
}

// function readTransactionFromHash(txHash) {
//     //winston.debug('Reading %s', txHash);
//     return eth.GetTxAndReceipt(txHash)
//         .then(txData => {
//             //winston.debug('Reading trace for %s', txHash);
//             return eth.TraceTransaction(txData.tx.hash)
//                 .then(trace => {
//                     txData.trace = trace;
//                     return txData;
//                 })
//         })
//         .then(txData => saveAndReturn(util.format("./data/%s/%s/tx.json", txData.tx.blockNumber, txData.tx.hash), txData.tx, txData))
//         .then(txData => saveAndReturn(util.format("./data/%s/%s/receipt.json", txData.tx.blockNumber, txData.tx.hash), txData.receipt, txData))
//         .then(txData => saveAndReturn(util.format("./data/%s/%s/trace.json", txData.tx.blockNumber, txData.tx.hash), txData.trace, txData))
//         .then(txData => {
//             var addressSet = processTraceLogs(txData.trace.structLogs);
//             addEntryAddress(txData.receipt, addressSet);
//             return addressSet;
//         });
// }

// function ensureDirectoryExists(path) {
//     var split = path.split('/');
//     split.slice(0, -1).reduce((prev, curr, i) => {
//         var dir = prev + '/' + curr;
//         if (!fs.existsSync(prev)) {
//             fs.mkdirSync(prev);
//         }

//         if (!fs.existsSync(dir)) {
//             fs.mkdirSync(dir);
//         }
//         return dir;
//     });
// }
// function saveAndReturn(path, result, returnResult) {
//     //winston.debug(path);
//     return new Promise((resolve, reject) => {
//         if (!returnResult) {
//             returnResult = result;
//         }

//         ensureDirectoryExists(path);
//         fs.writeFile(path, JSON.stringify(result), (err) => {
//             if (err) {
//                 reject(err);
//             }
//             else {
//                 resolve(returnResult);
//             }
//         })
//     });
// }

// function flattenArrayOfSet(input) {
//     var result = new Set();

//     for (var i in input) {
//         for (var x in input[i]) {
//             result.add(x);
//         }
//     }

//     return result;
// }




// function readBlockData(block) {
//     winston.debug("Reading block %s", block.number);
//     var promises = [];

//     if (block.transactions.length > 0) {
//         for (var txi in block.transactions) {
//             var tx = block.transactions[txi];
//             var txPromise = readTransactionFromHash(tx)
//             promises.push(txPromise);
//         }
//     }

//     return Promise.all(promises)
//         .then(result => flattenArrayOfSet(result))
//         .then(result => extractCode(result))
//         .then(result => { winston.debug(JSON.stringify(result)); return result })
//         .then(result => result.length > 0 ? saveAndReturn(util.format("./data/%s/addressMap.json", block.number), result) : result)
//         .then(result => { winston.debug("Finished reading block %s", block.number); return result });
// }


// return eth.GetLatestBlockNumber()
//     .then(latestBlockNumber => {

//         var promises = [];

//         for (blockNumber; blockNumber <= latestBlockNumber; blockNumber++) {
//             promises.push(
//                 eth.GetBlockFromNumber(blockNumber)
//                     .then(block => saveAndReturn(util.format("./data/%s/block.json", block.number), block))
//                     .then(block => readBlockData(block))
//             );
//         }
//         return Promise.all(promises)
//             .then(promiseResult => {
//                 var result = [];

//                 promiseResult.forEach(function (element) {
//                     element.forEach(function (item) {
//                         if (item) {
//                             result.push(item);
//                         }
//                     }, this);

//                 }, this);

//                 return result;
//             })
//     });
// }
// }
LoggingConfiguration.initialize(null);
new EthereumData().filterFromBlock(174535);

// filterFromBlock(174535)
//     .then(result => winston.debug(result))
//     .catch(error => winston.error(error));

//.slice(0, -1).reduce(function (prev, curr, i) {
//    winston.debug('make dir %s', prev);
    // fs.mkdirSync(prev);
    // fs.writeFile({
    //     path: path, data: JSON.stringify(result), callback: (err) => {

    //     }
    // })
//})
// eth.GetBlockFromHash('0x9185a654d7f24f065ab0e61118954acb5e33eecc1ab8f3ceddc5a7c65fe5fd2c')
//     .then(block => readBlockData(block))
//     .catch(error => winston.error(error));

//clearFilterAndAttach(readBlockData);