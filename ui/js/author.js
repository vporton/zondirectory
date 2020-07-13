async function onLoad() {
    await defaultAccountPromise();
    let query = `{
        setARWallets(orderBy:id, orderDirection:desc, where:{owner:"${defaultAccount}"}) {
            arWallet
        }
    }`;
    const queryResult = (await queryThegraph(query)).data;
    if(queryResult.setARWallets[0]) {
        const arWallet = queryResult.setARWallets[0].arWallet;
        document.getElementById('arWallet').textContent = arWallet;
    }
    query = `{
        setItemOwners(orderBy:id, orderDirection:desc, where:{owner:"${defaultAccount}"}) {
            itemId    
        }
    }`;
    let itemIds = (await queryThegraph(query)).data.setItemOwners;
    itemIds = itemIds.filter((x, i, a) => a.indexOf(x) == i); // unique values
    if(!itemIds.length) return;
    const itemIdsFlat = itemIds.map(i => i.itemId);
    function subquery(itemId) {
        return `item${itemId}: itemUpdateds(first:1, orderBy:id, orderDirection:desc, where:{itemId:${itemId}}) {
    itemId
    title
    priceETH
    priceAR
}`
    }
    query = "{\n" + itemIdsFlat.map(i => subquery(i)).join("\n") + "\n}";
    let items = (await queryThegraph(query)).data;
    const arweave = Arweave.init();
    for(let i in items) {
        const item = items[i][0];
        if(!item) continue;
        const link = "description.html?id=" + item.itemId;
        const row = `<tr><td><a href="${link}">${safe_tags(item.title)}</a></td><td>${formatPriceETH(item.priceETH)}</td><td>${formatPriceAR(item.priceAR)}</td></tr>`;
        $('#theTable').append(row);
    }
}

async function doSetARWallet(address) {
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), addressFiles);
    contractInstance.methods.setARWallet(defaultAccount, address)
        .send({from: defaultAccount, gas: '1000000'})
        .on('transactionHash', function(transactionHash) {
            document.getElementById('arWallet').textContent = address;
        });
}

async function setARWallet() {
    const address = prompt("Enter your AR wallet");
    if(address) doSetARWallet(address);
}

function setARWalletFromkeyFile(event) {
    const fileReader = new FileReader();
    fileReader.onload = async (e) => {
        const key = JSON.parse(e.target.result);
        const arweave = Arweave.init();
        arweave.wallets.jwkToAddress(key).then(async address => {
            doSetARWallet(address);
        });
    }
    fileReader.readAsText(event.target.files[0]);
}

$(onLoad);