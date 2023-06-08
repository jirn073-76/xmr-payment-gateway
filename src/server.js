const express = require('express');
const lodash = require('lodash');
const request = require('request');
const { result } = require('lodash');
const { query } = require('express');
const monerojs = require("monero-javascript");
const { get } = require("request");

const app = express()
const port = 3001

var outputs = []

async function connect() {
    return await monerojs.connectToWalletRpc("127.0.0.1:28084", "rpc_user", "abc123");
}




async function openWallet(walletRpc) {
    await walletRpc.openWallet("testWallet", "supersecretpassword");
}

async function createWallet(walletRpc) {
    await walletRpc.createWallet({
        path: "mywallet",
        password: "supersecretpassword",
        mnemonic: "aptitude zero union apology academy optical velvet lexicon soccer tarnished dabbing tuxedo madness tuxedo vulture vary mice fetches daft etiquette auctions snake aglow apex tuxedo",
        restoreHeight: 1543218
    });
}

async function createAccount(walletRpc) {
    return await walletRpc.createAccount("nibble3");
}

function getAddress(account) {
    return account.state.primaryAddress;
}

async function start() {
    let walletRpc = await connect();
    let wallet = await openWallet(walletRpc);
    let account = await createAccount(walletRpc);
    let resp = { "address": getAddress(account) }
    console.log();

    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        next();
    });

    app.get('/address', (req, res) => {
        res.json(resp)
    })

    app.get('/outputs', (req, res) => {
        res.json(outputs)
    })

    walletRpc.addListener(new class extends monerojs.MoneroWalletListener {
        onOutputReceived(output) {
            let amount = output.getAmount();
            let txHash = output.getTx().getHash();
            let isConfirmed = output.getTx().isConfirmed();
            let isLocked = output.getTx().isLocked();
            outputs.push({amount,txHash,isConfirmed,isLocked});
        }
    });

    app.listen(port, () => console.log(`server running on http://localhost:${port}`))
    process.on('SIGINT',async function() {
        console.log("Closing Wallet");
        await walletRpc.close(true)
        process.exit()
    });
}

module.exports = {
    start
}