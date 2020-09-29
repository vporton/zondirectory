"strict";

const itemId = numParam('id');
let priceAR;

let arKeyChooser;

const fromHexString = hexString =>
  new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

async function showFiles(withLinks) {
    let query = `{
    itemFilesUpdateds(first:1, orderBy:version, orderDirection:desc, where:{itemId:${itemId}}) {
        version
    }
}`;
    const itemFilesUpdated = (await queryThegraph(query)).data.itemFilesUpdateds[0];
    if(!itemFilesUpdated) {
        $('.buy').css('display', 'none');
        return;
    }
    let version = itemFilesUpdated.version;
    const fileFields = withLinks ? 'format hash' : 'format';
    query = `{
    itemFilesUpdateds(orderBy:id, orderDirection:asc, where:{itemId:${itemId}, version:${version}}) {
        ${fileFields}
    }
}`;
    const files = (await queryThegraph(query)).data.itemFilesUpdateds;
    $(formats).html('');
    for(let i in files) {
        const file = files[i];
        const url = withLinks ? `https://arweave.net/${Arweave.utils.bufferTob64Url(fromHexString(file.hash.substring(2)))}`
                              : null;
        const link = withLinks ? `<li><a href="${url}">${safe_tags(file.format)}</a></li>`
                               : `<li>${safe_tags(file.format)}</li>`;
        $(formats).append(link);
    }
    if(!files) {
        $('#noFiles').css('display', 'block');
    }
}

function askPrice(defaultPrice) {
    let price = defaultPrice;
    do {
        price = prompt("Please pay more than the author requested, be benevolent!", price);
        if(!price) return null;
    } while(price < defaultPrice);
    return price;
}

function showFilesWithMessage() {
    showFiles(true);
    alert("Download the files from this page.");
}

async function payETH() {
    const price = askPrice(document.getElementById('priceETH').textContent);
    if(!price) return;
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));
    await defaultAccountPromise();
    await mySend(contractInstance, contractInstance.methods.pay,
                 [itemId, '0x0000000000000000000000000000000000000001'],
                 {value: web3.utils.toWei(String(price))}) // https://ethereum.stackexchange.com/q/85407/36438
        .then(showFilesWithMessage)
        .catch(err => alert("You tried to pay below the price or payment failure! " + err));
}

async function donateETH() {
    const price = prompt("Your donation amount in ETH:", '0.1');
    if(!price) return;
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));
    await defaultAccountPromise();
    await mySend(contractInstance, contractInstance.methods.donate,
                 [itemId, '0x0000000000000000000000000000000000000001'],
                 {value: web3.utils.toWei(String(price))})
        .catch(err => alert("Payment failure! " + err));
}

async function doPayAR(price, showFiles) {
    const smartweave = require('smartweave');
    const fileReader = new FileReader();

    const key = await arKeyChooser.arKeyGet();
    // if(!key) {
    //     alert("Choose an Arweave key file!");
    //     return;
    // }
    arKeyChooser.arKeyStore();

    smartweave.readContract(arweave, AR_PST_CONTRACT_ADDRESS).then(async contractState => {
        await defaultAccountPromise();
        let query = `{
    setARWallets(first:1, orderBy:id, orderDirection:desc, where:{owner:"${defaultAccount}"}) {
        arWallet
    }
}`;
        const queryResult = (await queryThegraph(query)).data;
        let arWallet = queryResult.setARWallets[0] ? queryResult.setARWallets[0].arWallet : null;
        
        arweave.wallets.jwkToAddress(key)
            .then((userAddress) => {
                return arweave.wallets.getBalance(userAddress);
            })
            .then(async balance => {
                if(Number(balance) < Number(price)) {
                    alert("Not enough money in your AR wallet!");
                    return;
                }
        
                let authorRoyalty, shareholdersRoyalty;
                await defaultAccountPromise();
                // TODO: Don't call Ethereum if no author's AR wallet.
                const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));
                contractInstance.methods.salesOwnersShare().call(async (error, result) => {
                    if(error) {
                        alert(error);
                        return;
                    }
                    const ownersShare = result / 2**64;

                    if(arWallet) {
                        authorRoyalty = Math.floor((1 - ownersShare) * price);
                        shareholdersRoyalty = Math.floor(ownersShare * price);
                    } else {
                        authorRoyalty = 0;
                        shareholdersRoyalty = Math.floor(price);
                    }

                    // First pay to me then to the author, because in the case of a failure the buyer loses less this way.
                    let paymentFailure = false;
                    if(shareholdersRoyalty) {
                        const holder = smartweave.selectWeightedPstHolder(contractState.balances);
                        const tx = await arweave.createTransaction({ target: holder, quantity: String(shareholdersRoyalty) }, key);
                        await arweave.transactions.sign(tx, key);
                        const response = await arweave.transactions.post(tx);
                        if(response.status != 200) paymentFailure = true;
                    }
                    if(!paymentFailure && authorRoyalty) {
                        const holder = smartweave.selectWeightedPstHolder(contractState.balances);
                        const tx = await arweave.createTransaction({ target: arWallet, quantity: String(authorRoyalty) }, key);
                        await arweave.transactions.sign(tx, key);
                        const response = await arweave.transactions.post(tx);
                        if(response.status != 200) paymentFailure = true;
                    }

                    if(showFiles) {
                        if(!paymentFailure)
                            showFilesWithMessage();
                        else
                            alert("You didn't pay the full sum!");
                    }
                });
            });
    });
}

async function payAR() {
    const key = await arKeyChooser.arKeyGet();
    if(!key) {
        alert("Choose an Arweave key file!");
        return;
    }

    let price = askPrice(priceAR);
    if(!price) return;

    price = arweave.ar.arToWinston(price);
    await doPayAR(price, true);
}

async function donateAR() {
    const key = await arKeyChooser.arKeyGet();
    if(!key) {
        alert("Choose an Arweave key file!");
        return;
    }

    let price = prompt("Your donation amount in AR:", '10.0');
    if(!price) return;

    price = arweave.ar.arToWinston(price);
    await doPayAR(price, false);
}

function moreParents() {
    $('#categories > li:hidden:lt(10)').css('display', 'list-item');
}

async function onLoad() {
    if(itemId) {
        $('#addParent').attr('href', `vote.html?child=${itemId}&dir=for`);

        // TODO: pagination
        const query = `{
    parentsA: childParentVotes(first:1000, orderBy:id, orderDirection:desc, where:{child:${itemId} primary:false}) {
        id
        parent
        value
    }
    parentsB: childParentVotes(first:1000, orderBy:id, orderDirection:desc, where:{child:${itemId} primary:true}) {
        id
        parent
        value
    }
    itemUpdateds(first:1, orderBy:id, orderDirection:desc, where:{itemId:${itemId}}) {
        locale
        title
        description
        license
        priceETH
    }
}`;
        const queryResult = (await queryThegraph(query)).data;

        let parentsA = new Map();
        let parentsB = new Map();
        for(let i in queryResult.parentsA) {
            const entry = queryResult.parentsA[i];
            if(!parentsA.has(i) || parentsA.get[i].id > entry.id)
                parentsA.set(i, {id: entry.id, parent: entry.parent, value: entry.value})
        }
        for(let i in queryResult.parentsB) {
            const entry = queryResult.parentsB[i];
            if(!parentsB.has(i) || parentsB.get[i].id > entry.id)
                parentsB.set(i, {id: entry.id, parent: entry.parent, value: entry.value})
        }
        const parentIDsA = Array.from(parentsA.values()).sort((a, b) => b.value - a.value).map(e => e.parent);
        const parentIDsB = Array.from(parentsB.values()).sort((a, b) => b.value - a.value).map(e => e.parent);
        const parentIDs = parentIDsA.concat(parentIDsB);

        if(parentIDs) {
            function subquery(catId) {
                let query = `
            category${catId}: categoryUpdateds(first:1, orderBy:id, orderDirection:asc, where:{categoryId:${catId}}) {
                title
            }`
                query += `
            spam${catId}: childParentVotes(first:1, orderBy:id, orderDirection:desc, where:{child:${itemId}, parent:${catId}}) {
                value
            }`;
                return query;
            }
            const query2 = "{\n" + parentIDs.map(i => subquery(i)).join("\n") + "\n}";
            let items = parentIDs.length ? (await queryThegraph(query2)).data : [];

            for(let i in parentIDs) {
                const categoryId = parentIDs[i];
                const category = items['category' + categoryId][0];
                if(!category) continue;
                const spamInfo = items['spam' + categoryId][0];
                const spamScore = spamInfo ? formatPriceETH(new web3.utils.BN(spamInfo.value).neg()) : 0;
                const link = "index.html?cat=" + categoryId;
                const voteStr = `<a href='vote.html?child=${itemId}&parent=${categoryId}&dir=for'>👍</a>` +
                    `<a href='vote.html?child=${itemId}&parent=${categoryId}&dir=against'>👎</a>`;
                $('#categories').append(`<li><a href="${link}">${safe_tags(category.title)}</a> (spam score: ${spamScore} ${voteStr})</li>`);
            }
        }
        $('#categories > li:gt(0)').css('display', 'none');

        const item = queryResult.itemUpdateds[0];
        document.getElementById('locale').textContent = item.locale;
        document.getElementById('title').textContent = item.title;
        document.getElementById('description').textContent = item.description;
        document.getElementById('license').textContent = item.license;
        const [[arInUSD, ethInUSD], arCoefficient] = await Promise.all([calculateARRate(), fetchARCoefficient()]);
        priceAR = arweave.ar.arToWinston(formatPriceETH(item.priceETH) * ethInUSD / arInUSD * arCoefficient);
        const arDiscount = ((1 - arCoefficient) * 100).toPrecision(2);
        document.getElementById('priceUSD').textContent = formatPriceETH(item.priceETH) * ethInUSD;
        document.getElementById('priceUSDAR').textContent = formatPriceAR(priceAR) * arInUSD;
        document.getElementById('priceETH').textContent = formatPriceETH(item.priceETH);
        document.getElementById('priceAR').textContent = formatPriceAR(priceAR);
        document.getElementById('arDiscount').textContent = arDiscount;
        if(item.priceETH == INFINITY) {
            $('#buyETH').css('display', 'none');
            $('#buyAR').css('display', 'none');
        }
        showFiles(item.priceETH == 0);
    }

    arKeyChooser = $('#arWalletKeyFile').arKeyChooser({storeName: 'authorARPrivateKey'});
}

async function fetchARCoefficient() {
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));
    return (await contractInstance.methods.arToETHCoefficient().call()) / 2**64;
}

async function calculateARRate() {
    return await fetch('https://api.coingecko.com/api/v3/simple/price?ids=arweave%2Cethereum&vs_currencies=usd')
        .then(response => response.json())
        .then(data => [data.arweave.usd, data.ethereum.usd]);
}

window.addEventListener('load', onLoad);