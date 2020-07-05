"strict";

// let itemEvents;

function sellInETHToggle(event) {
    document.getElementById('priceETH').disabled = event.target.checked;
}

function sellInARToggle(event) {
    document.getElementById('priceAR').disabled = event.target.checked;
}

const INFINITY = (BigInt(1) << BigInt(256)) - BigInt(1);

function getPriceETH() {
    return document.getElementById('sellInETH').checked ? INFINITY : web3.utils.toWei(document.getElementById('priceETH').value);
}

function getPriceAR() {
    return document.getElementById('sellInAR').checked ? INFINITY : web3.utils.toWei(document.getElementById('priceAR').value);
}

function setPriceETH(price) {
    if(price == INFINITY) {
        document.getElementById('sellInETH').checked = true;
        document.getElementById('priceETH').disabled = true;
    } else {
        document.getElementById('priceETH').value = web3.utils.fromWei(price);
    }
}

function setPriceAR(price) {
    if(price == INFINITY) {
        document.getElementById('sellInAR').checked = true;
        document.getElementById('priceAR').disabled = true;
    } else {
        document.getElementById('priceAR').value = web3.utils.fromWei(price);
    }
}

async function createOrUpdateItem() {
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    if(itemId)
        updateItem(itemId);
    else
        createItem();
}

async function createItem() {
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), filesContractAddress);

    const locale = document.getElementById('locale').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const license = document.getElementById('license').value;

    let transactionHash = null;
    let events = [];

//     function onEvent(error, event) {
//         //var myResults = contractInstance.ItemUpdated({}, {fromBlock:'pending', toBlock:'pending'}, function(error, logs){ console.log('logs', logs) }).get(function(error, logs){ /*console.log('logs', logs)*/ });
// //        console.log('log', myResults);
//         // events.push(log);
//         // for(let i in events) {
//         //     let event = events[i];
//         //     if(event.transactionHash == transactionHash) {
//         //         console.log('myResults', myResults);
//         //         const event = receipt.logs.ItemUpdated;
//         //         const itemId = event.returnValues.id;
//         //         open('upload.html?id=' + itemId);
//         //         filter.stopWatching();
//         //         clearInterval(intervalHandle);
//         //     }
//         // }
//     }

    // contractInstance.events.ItemUpdated({fromBlock:'pending'}, onEvent); // does not call the callback

    contractInstance.methods.createItem(title, description, getPriceETH(), getPriceAR(), locale, license)
        .send({from: defaultAccount, gas: '1000000'})
        .on('transactionHash', async function(receiptHash) {
            transactionHash = receiptHash;
            // console.log(await contractInstance.getPastEvents('ItemUpdated', {fromBlock:0, toBlock:'pending'}));
        });
}

async function updateItem(itemId) {
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), filesContractAddress);

    const locale = document.getElementById('locale').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const license = document.getElementById('license').value;

    contractInstance.methods.updateItem(itemId, title, description, getPriceETH(), getPriceAR(), locale, license)
        .send({from: defaultAccount, gas: '1000000'});
}

$(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    if(itemId) {
        $('#uploadLink').setAttribute('href', "upload.html?id="+itemId);
        $('#uploadLink').css('display', 'block');
        const query = `itemUpdateds(first:1, orderBy:itemId, orderDirection:desc, where:{itemId:${itemId}}) {
            title
            description
            license
            priceETH
            priceAR
        }`;
        let item = (await queryThegraph(query)).data.itemUpdateds[0];
        document.getElementById('title').value = item.title;
        document.getElementById('description').textContent = item.description;
        document.getElementById('license').textContent = item.license;
        setPriceETH(item.priceETH);
        setPriceAR(item.priceAR);
    }

})