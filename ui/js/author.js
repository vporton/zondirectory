async function onLoad() {
    await defaultAccountPromise();
        let query = `{
    setItemOwners(orderBy:id, orderDirection:desc, where:{owner:"${defaultAccount}"}) {
        itemId    
    }
}`;
    let itemIds = (await queryThegraph(query)).data.setItemOwners;
    itemIds = itemIds.filter((x, i, a) => a.indexOf(x) == i); // unique values
    function itemReq(itemId) {
        return `itemUpdateds(first:1, orderBy:itemId, orderDirection:desc, where:{itemId:${itemId}}) {
            itemId
            title
            priceETH
            priceAR
        }`;
    }
    if(!itemIds.length) return;
    query = "{\n" + itemIds.map(itemId => itemReq(itemId)).join("\n") + "\n}";
    let items = (await queryThegraph(query)).data.itemUpdateds;
    for(let i in items) {
        const item = items[i];
        const link = "update.html?id=" + item.itemId;
        const row = `<tr><td><a href="${link}">${safe_tags(item.title)}</a></td><td>${item.priceETH}</td><td>${item.priceAR}</td></tr>`;
        $('#theTable').append(row);
    }
}

async function setARWallet() {
    const smartweave = require('smartweave');
    const arweave = Arweave.init();
    let key = await arweave.wallets.generate(); // FIXME: Use keyfile instead.
    arweave.wallets.jwkToAddress(key).then(async address => {
        address = prompt("Enter your AR wallet", address);
        const contractInstance = new web3.eth.Contract(await filesJsonInterface(), filesContractAddress);
        contractInstance.methods.setARWallet(defaultAccount, address)
            .send({from: defaultAccount, gas: '1000000'})
            .on('transactionHash', function(transactionHash) {
                document.getElementById('arWallet').textContent = address;
            });
    });
}

$(onLoad);