"strict";

let itemEvents;

async function createNewItem() {
    const contractInstance = new web3.eth.Contract(await categoriesJsonInterface(), categoriesContractAddress);

    const title = document.getElementById('title').value;
    const short = document.getElementById('short').value;
    const long = document.getElementById('long').value;

    let transactionHash = null;
    let events = [];

    function onEvent(error, log) {
        var myResults = contractInstance.ItemUpdated({}, {fromBlock:'pending', toBlock:'pending'}, function(error, logs){ console.log('logs', logs) }).get(function(error, logs){ /*console.log('logs', logs)*/ });
//        console.log('log', myResults);
        // events.push(log);
        // for(let i in events) {
        //     let event = events[i];
        //     if(event.transactionHash == transactionHash) {
        //         console.log('myResults', myResults);
        //         filter.stopWatching();
        //         clearInterval(intervalHandle);
        //     }
        // }
    }

    // const filter = web3.eth.filter({fromBlock:'pending', toBlock:'pending'});
    // filter.watch(onEvent); // in unknown reason does not call the callback

    contractInstance.methods.createItem(title, short, long).send({from: defaultAccount, gas: '1000000'}); //, (error, receiptHash) => {
        // transactionHash = receiptHash;
        // web3.eth.getTransactionReceipt(receiptHash, (error, receipt) => {
        //     const event = receipt.logs.ItemUpdated;
        //     const itemId = event.returnValues.id;
        //     open('upload.html?id=' + itemId);
        // });
    // });
}