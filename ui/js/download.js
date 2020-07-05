"strict";

const INFINITY = (BigInt(1) << BigInt(256)) - BigInt(1);

const urlParams = new URLSearchParams(window.location.search);
const itemId = urlParams.get('id');

function formatPrice(price) {
    return price == INFINITY ? "-" : web3.utils.fromWei(price);
}

async function showFiles(withLinks) {
    let query = `itemFilesUpdateds(first:1, orderBy:version, orderDirection:desc, where:{itemId:${itemId}}) {
    version
}`;
    let version = (await queryThegraph(query)).data.itemFilesUpdateds[0].version;
    const fileFields = withLinks ? 'format hash' : 'format';
    query = `itemFilesUpdateds(orderBy:id, orderDirection:asc, where:{itemId:${itemId}, version:${version}}) {
    ${fileFields}
}`;
    const files = (await queryThegraph(query)).data.itemFilesUpdateds;
    for(let i in files) {
        const file = files[i];
        const link = withLinks ? `<li><a href="https://arweave.net/${file.hash}">${safe_tags(file.format)}</a></li>`
                               : `<li>${safe_tags(file.format)}</li>`;
        $(formats).append(link);
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
    const contractInstance = new web3.eth.Contract(await categoriesJsonInterface(), categoriesContractAddress);
    await defaultAccountPromise();
    contractInstance.methods.pay(itemId).send({from: defaultAccount, gas: '1000000'})
        .then(() => showFilesWithMessage())
        .catch(() => alert("You tried to pay below the price or payment failure!"));
}

async function payAR() {
    const price = askPrice(document.getElementById('priceAR').textContent);
    if(!price) return;

    const smartweave = require('smartweave');
    const arweave = Arweave.init();
    let key = await arweave.wallets.generate();
    smartweave.readContract(arweave, AR_PST_CONTRACT_ADDRESS).then(contractState => {
        // TODO: Read royalty percent from Ethereum.
        const holder = smartweave.selectWeightedPstHolder(contractState.balances);
        const tx = await arweave.transactions.create({ target: holder, quantity: price*0.1 }, jwk);
        await arweave.transaction.sign(tx, jwk);
        await arweave.transactions.post(tx);
        // TODO: Pay royalty to the author.
    });
      
}

$(async function() {
    if(itemId) {
        const query = `itemUpdateds(first:1, orderBy:id, orderDirection:desc, where:{itemId:${itemId}}) {
    title
    description
    license
    priceETH
    priceAR
}`;
        let item = (await queryThegraph(query)).data.itemUpdateds[0];
        document.getElementById('title').textContent = item.title;
        document.getElementById('description').textContent = item.description;
        document.getElementById('license').textContent = item.license;
        document.getElementById('priceETH').textContent = formatPrice(item.priceETH);
        document.getElementById('priceAR').textContent = formatPrice(item.priceAR);
        showFiles(item.priceETH == 0 || item.priceAR == 0);
    }
})