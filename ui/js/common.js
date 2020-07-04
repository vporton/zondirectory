const THEGRAPH_URL = "https://api.thegraph.com/subgraphs/name/vporton/cryptozonrinkeby3";

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

let defaultAccount;
// web3.eth.defaultAccount = web3.eth.accounts[0];
function defaultAccountPromise() { return web3.eth.getAccounts(); }
defaultAccountPromise().then( function (result) { return defaultAccount = result[0] });

function categoriesJsonInterface() {
    return new Promise((resolve) => {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200)
                resolve(JSON.parse(xhttp.responseText));
        };
        xhttp.open("GET", "artifacts/Categories.abi", true);
        xhttp.send();
    });
}