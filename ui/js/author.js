async function onLoad() {
    if(!window.web3) {
        alert("Install a crypto browser to be an author!");
        return;
    }

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
    category${itemId}: ownedCategoryUpdateds(first:1, orderBy:id, orderDirection:desc, where:{categoryId:${itemId}}) {
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
    const itemKeys = Object.keys(items).sort((a, b) => b.replace(/[^0-9]/g, "") - a.replace(/[^0-9]/g, ""));
    for(let i of itemKeys) {
        if(!/^item/.test(i)) continue;
        const item = items[i][0];
        if(!item) continue;
        const link = "download.html?id=" + item.itemId;
        const editLink = "description.html?id=" + item.itemId;
        const row = `<tr><td><a href="${link}">${safe_tags(item.title)}</a></td><td>${formatPriceETH(item.priceETH)}</td><td>${formatPriceAR(item.priceAR)}</td><td><a href="${editLink}">Edit</a></td></tr>`;
        $('#theTable').append(row);
    }
    for(let i of itemKeys) {
        if(!/^link/.test(i)) continue;
        const item = items[i][0];
        if(!item) continue;
        const linkText = formatLink(item.link, item.title);
        const row = `<li>${linkText} (<a href="post-link.html?id=${item.linkId}">edit</a>)</li>`;
        $('#links').append(row);
    }
    for(let i of itemKeys) {
        if(!/^category/.test(i)) continue;
        const item = items[i][0];
        if(!item) continue;
        const link = "index.html?cat=" + item.categoryId;
        const editLink = "edit-category.html?id=" + item.categoryId;
        const row = `<li><a href="${link}">${safe_tags(item.title)}</a> (<a href="${editLink}">Edit</a>)</li>`;
        $('#categories').append(row);
    }
}

async function doSetARWallet(address) {
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));
    mySend(contractInstance, contractInstance.methods.setARWallet, [address])
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
        arweave.wallets.jwkToAddress(key).then(async address => {
            doSetARWallet(address);
        });
    }
    fileReader.readAsText(event.target.files[0]);
}

window.addEventListener('load', onLoad);