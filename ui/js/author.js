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
        return `    item${itemId}: itemUpdateds(first:1, orderBy:id, orderDirection:desc, where:{itemId:${itemId}}) {
        itemId
        title
        priceETH
        priceAR
    }
    category${itemId}: categoryUpdateds(first:1, orderBy:id, orderDirection:desc, where:{categoryId:${itemId}}) {
        categoryId
        title
    }
    link${itemId}: linkUpdateds(first:1, orderBy:id, orderDirection:desc, where:{linkId:${itemId}}) {
        linkId
        link
        title
    }`
    }
    query = "{\n" + itemIdsFlat.map(i => subquery(i)).join("\n") + "\n}";
    let items = (await queryThegraph(query)).data;
    for(let i in items) {
        if(!/^item/.test(i)) continue;
        const item = items[i][0];
        if(!item) continue;
        const link = "description.html?id=" + item.itemId;
        const row = `<tr><td><a href="${link}">${safe_tags(item.title)}</a></td><td>${formatPriceETH(item.priceETH)}</td><td>${formatPriceAR(item.priceAR)}</td></tr>`;
        $('#theTable').append(row);
    }
    for(let i in items) {
        if(!/^link/.test(i)) continue;
        const item = items[i][0];
        if(!item) continue;
        // FIXME: proper escape in attr
        const row = `<li><a href="${safe_tags(item.link)}">${safe_tags(item.title)}</a> (<a href="post-link.html?id=${item.linkId}">edit</a>)</li>`;
        $('#links').append(row);
    }
    for(let i in items) {
        if(!/^category/.test(i)) continue;
        const item = items[i][0];
        if(!item) continue;
        const link = "index.html?cat=" + item.categoryId;
        // TODO: Edit category name.
        const row = `<li><a href="${link}">${safe_tags(item.title)}</a></li>`;
        $('#categories').append(row);
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