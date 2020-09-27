"strict";

$(document).ajaxError(function( event, request, settings ) {
    alert("Error: " + request.status);
});

const INFINITY = (BigInt(1) << BigInt(256)) - BigInt(1);

// See also https://github.com/ArweaveTeam/arweave-js/issues/47
const arweave = window.Arweave ? Arweave.init({
    host: "arweave.net",
    port: 443,
    protocol: "https"
}) : undefined;

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

function safe_attrs(str) {
    return safe_tags(str).replace(/"/g,'&quot;').replace(/'<'/g,'&apos;');
}

function queryThegraph(query) {
    query = query.replace(/\\/g, '\\').replace(/"/g, '\\"').replace(/\n/g, "\\n");
    return new Promise(async (resolve, error) => {
        const THEGRAPH_URL = "https://api.thegraph.com/subgraphs/name/" + await getAddress('TheGraph');
        $.post(THEGRAPH_URL, `{ "query": "${query}" }`, function(data) {
            // TODO: Correct error handling.
            if(data.errors) {
                alert(data.errors.map(e => e.message).join("\n"));
            } else
                resolve(data);
        });
    });
}

// TODO: Renames, eliminate duplicate code.
function queryThegraph2(query) {
    query = query.replace(/\\/g, '\\').replace(/"/g, '\\"').replace(/\n/g, "\\n");
    return new Promise(async (resolve, error) => {
        const THEGRAPH_URL = "https://api.thegraph.com/subgraphs/name/" + await getAddress('TheGraphTemplates');
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

let defaultAccount;
// web3.eth.defaultAccount = web3.eth.accounts[0];
async function defaultAccountPromise() {
    return web3 && web3.currentProvider ? (await getWeb3()).eth.getAccounts() : null;
}

let pstJsonInterfaceCache = null;
let filesJsonInterfaceCache = null;
let blogTemplatesJsonInterfaceCache = null;

function pstJsonInterface() {
    return new Promise((resolve) => {
        if(pstJsonInterfaceCache) resolve(pstJsonInterfaceCache);
        fetch("artifacts/MainPST.abi")
            .then(response => resolve(pstJsonInterfaceCache = response.json()));
    });
}

function filesJsonInterface() {
    return new Promise((resolve) => {
        if(filesJsonInterfaceCache) resolve(filesJsonInterfaceCache);
        fetch("artifacts/Files.abi")
            .then(response => resolve(filesJsonInterfaceCache = response.json()));
    });
}

function blogTemplatesJsonInterface() {
    return new Promise((resolve) => {
        if(blogTemplatesJsonInterfaceCache) resolve(blogTemplatesJsonInterfaceCache);
        fetch("artifacts/BlogTemplates.abi")
            .then(response => resolve(blogTemplatesJsonInterfaceCache = response.json()));
    });
}

function formatLink(href, title) {
    href = href.replace(/^arweave:/, "https://arweave.net/");
    return href != "" ? `<a href="${safe_attrs(href)}">${safe_tags(title)}</a>` : safe_tags(title);
}

let addressesFile = null;

function getAddressesFile() {
    return new Promise((resolve) => {
        if(addressesFile) resolve(addressesFile);

        let networkName;
        let chainId = getCookie('web3network');
        if(!chainId) chainId = '0x1';
        switch(chainId) {
            case '0x1':
                networkName = 'mainnet';
                break;
            case '0x4':
                networkName = 'rinkeby';
                break;
            default:
                alert("Unsupported Ethereum network!");
        }
        fetch(`artifacts/${networkName}.addresses`)
            .then(response => resolve(addressesFile = response.json()));
    });
}

async function getAddress(name) {
    return (await getAddressesFile())[name];
}

let myWeb3 = null;

async function getWeb3() {
    if(myWeb3) return myWeb3;

    const Web3Modal = window.Web3Modal.default;
    const providerOptions = {
        mewconnect: {
            package: MewConnect, // required
            options: {
                infuraId: "1d0c278301fc40f3a8f40f25ae3bd328" // required
            }
          }
    };
    alert(111)
        
    const web3Modal = new Web3Modal({
      network: "poa-core", // optional
      cacheProvider: true, // optional
      providerOptions // required
    });
    
    const provider = await web3Modal.connect();
    return myWeb3 = new Web3(provider);
}

function waitStart() {
    $('#wait').css('display', 'block');
}

function waitStop() {
    $('#wait').css('display', 'none');
}

function mySend(contract, method, args, sendArgs, handler) {
    sendArgs = sendArgs || {}
    return method.bind(contract)(...args).estimateGas({gas: '1000000', from: defaultAccount, ...sendArgs}).
        then((estimatedGas) => {
            const gas = String(Math.floor(estimatedGas * 1.15) + 24000);
            if(handler !== undefined)
                return method.bind(contract)(...args).send({gas, from: defaultAccount, ...sendArgs}, handler);
            else
                return method.bind(contract)(...args).send({gas, from: defaultAccount, ...sendArgs});
        });
}

async function onLoad() {
    if(window.ethereum) window.ethereum.enable();

    let choosenNetwork = getCookie('web3network');
    if(!choosenNetwork) choosenNetwork = 'poa-core';
    // if(window.web3 && window.web3.currentProvider && choosenNetwork != window.web3.currentProvider.chainId) {
    //     alert("Wrong browser/MetaMask Ethereum network choosen! Change your Ethereum network or settings.")
    // }

    // if(choosenNetwork != '0x63')
    //     $('#testModeWarnining').css('display', 'block');

    web3 = await getWeb3();
    const dap = await defaultAccountPromise();
    defaultAccount = dap ? dap[0] : null;

    $('#rootLink').attr('href', "index.html?cat=" + await getAddress('Root'));
}

//window.addEventListener('load', onLoad); // window.web3.currentProvider.chainId is sometimes undefined (https://github.com/brave/brave-browser/issues/10854)
window.addEventListener('load', onLoad);