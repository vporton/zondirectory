$(document).ajaxError(function( event, request, settings ) {
    alert("Error: " + request.status);
});

const INFINITY = (BigInt(1) << BigInt(256)) - BigInt(1);

const arweave = window.Arweave ? Arweave.init() : undefined;

function numParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    const val = urlParams.get(name);
    return /^[0-9]+$/.test(val) ? val : 0;
}

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
    return new Promise(async (resolve, error) => {
        const THEGRAPH_URL = await getAddress('TheGraph');
        $.post(THEGRAPH_URL, `{ "query": "${query}" }`, function(data) {
            // TODO: Correct error handling.
            if(data.errors) {
                alert(data.errors.map(e => e.message).join("\n"));
            } else
                resolve(data);
        });
    });
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
        c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
        }
    }
    return "";
}

let web3;

// FIXME: If MetaMask is missing or locked.
let defaultAccount;
// web3.eth.defaultAccount = web3.eth.accounts[0];
async function defaultAccountPromise() { return (await getWeb3()).eth.getAccounts(); }

// TODO: Load it once!
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

let addressesFile = null;

function getAddressesFile() {
    if(addressesFile) return addressesFile;
    return new Promise((resolve) => {
        fetch("artifacts/rinkeby.addresses")
            .then(response => resolve(addressesFile = response.json()));
    });
}

async function getAddress(name) {
    return (await getAddressesFile())[name];
}

let myWeb3 = null;

async function getWeb3() {
    if(myWeb3) return myWeb3;
    return myWeb3 = new Web3(window.web3 ? window.web3.currentProvider : await getAddress('Web3Provider'));
}

$(async function() {
    web3 = await getWeb3();
    defaultAccount = (await defaultAccountPromise())[0];

    const choosenNetwork = Number(getCookie('web3network'));
    if(choosenNetwork != web3.currentProvider.chainId) {
        alert("Wrong browser/MetaMask Ethereum network choosen! Change your Ethereum network or settings.")
    }

    if(window.ethereum) window.ethereum.enable();
    $('#rootLink').attr('href', "index.html?cat=" + await getAddress('Root'));
});