$(document).ajaxError(function( event, request, settings ) {
    alert("Error: " + request.status);
});

const THEGRAPH_URL = "https://api.thegraph.com/subgraphs/name/vporton/cryptozon-rinkeby7";

const INFINITY = (BigInt(1) << BigInt(256)) - BigInt(1);

const arweave = window.Arweave ? Arweave.init() : undefined;

function formatPriceETH(price) {
    return price == INFINITY ? '-' : web3.utils.fromWei(price);
}

function formatPriceAR(price) {
    return price == INFINITY ? '-' : arweave.ar.winstonToAr(price).replace(/0+$/, '');
}

function safe_tags(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function queryThegraph(query) {
    query = query.replace(/\\/g, '\\').replace(/"/g, '\\"').replace(/\n/g, "\\n");
    return new Promise((resolve, error) => {
        $.post(THEGRAPH_URL, `{ "query": "${query}" }`, function(data) {
            resolve(data);
        });
    });
}

const web3 = new Web3(window.web3.currentProvider);
window.ethereum.enable();

// FIXME: If MetaMask is missing or locked.
let defaultAccount;
// web3.eth.defaultAccount = web3.eth.accounts[0];
function defaultAccountPromise() { return web3.eth.getAccounts(); }
defaultAccountPromise().then( function (result, x) { defaultAccount = result[0] });

function filesJsonInterface() {
    return new Promise((resolve) => {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200)
                resolve(JSON.parse(xhttp.responseText));
        };
        xhttp.open("GET", "artifacts/Files.abi", true);
        xhttp.send();
    });
}