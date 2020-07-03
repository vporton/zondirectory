"strict";

// let itemEvents;

async function createOrUpdateItem() {
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    if(itemId)
        updateItem(itemId);
    else
        createItem();
}

async function createItem() {
    const contractInstance = new web3.eth.Contract(await categoriesJsonInterface(), categoriesContractAddress);

    const title = document.getElementById('title').value;
    const short = document.getElementById('short').value;
    const long = document.getElementById('long').value;

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

    contractInstance.methods.createItem(title, short, long).send({from: defaultAccount, gas: '1000000'}) //, (error, receiptHash) => {
        .on('transactionHash', async function(receiptHash) {
            transactionHash = receiptHash;
            // console.log(await contractInstance.getPastEvents('ItemUpdated', {fromBlock:0, toBlock:'pending'}));
        });
}

async function updateItem(itemId) {
    const contractInstance = new web3.eth.Contract(await categoriesJsonInterface(), categoriesContractAddress);

    const title = document.getElementById('title').value;
    const short = document.getElementById('short').value;
    const long = document.getElementById('long').value;

    contractInstance.methods.updateItem(itemId, title, short, long).send({from: defaultAccount, gas: '1000000'});
}