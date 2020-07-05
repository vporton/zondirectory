"strict";

const INFINITY = (BigInt(1) << BigInt(256)) - BigInt(1);

const urlParams = new URLSearchParams(window.location.search);
const itemId = urlParams.get('id');

function formatPrice(price) {
    return price == INFINITY ? "-" : price;
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
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), filesContractAddress);
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
    const fileReader = new FileReader();
    fileReader.onload = async (e) => {
        const key = JSON.parse(e.target.result);

        smartweave.readContract(arweave, AR_PST_CONTRACT_ADDRESS).then(async contractState => {
            await defaultAccountPromise();
            let query = `setARWallets(first:1, orderBy:id, orderDirection:desc, where:{owner:${defaultAccount}}) {
                arWallet
            }`;
            let arWallet = (await queryThegraph(query)).data.setARWallets[0].arWallet;
            let authorRoyalty, myRoyalty;
            // TODO: Read royalty percent from Ethereum.
            if(arWallet) {
                authorRoyalty = 0.9 * price;
                myRoyalty = 0.1 * price;
            } else {
                authorRoyalty = 0;
                myRoyalty = price;
            }

            // FIXME: check that we have enough balance before trying to pay
            // FIrst pay to me then to the author, because in the case of a failure the buyer loses less this way.
            let paymentFailure = false;
            if(myRoyalty) {
                const holder = smartweave.selectWeightedPstHolder(contractState.balances);
                const tx = await arweave.transactions.create({ target: holder, quantity: myRoyalty }, key);
                await arweave.transaction.sign(tx, key);
                await arweave.transactions.post(tx);
                if(response.status != 200) paymentFailure = true;
            }
            if(authorRoyalty) {
                const holder = smartweave.selectWeightedPstHolder(contractState.balances);
                const tx = await arweave.transactions.create({ target: atob(arWallet), quantity: authorRoyalty }, key); // FIXME: URL encoded
                await arweave.transaction.sign(tx, key);
                const response = await arweave.transactions.post(tx);
                if(response.status != 200) paymentFailure = true;
            }

            if(!paymentFailure)
                showFilesWithMessage();
            else
                alert("You didn't pay the full sum!");
        });
    }
    fileReader.readAsText(document.getElementById('arWalletKeyFile').files[0]);
}

$(async function() {
    console.log(itemId)
    if(itemId) {
        const query = `{
    itemUpdateds(first:1, orderBy:id, orderDirection:desc, where:{itemId:${itemId}}) {
        locale
        title
        description
        license
        priceETH
        priceAR
    }
}`;
        const item = (await queryThegraph(query)).data.itemUpdateds[0];
        const arweave = Arweave.init();
        document.getElementById('locale').textContent = item.locale;
        document.getElementById('title').textContent = item.title;
        document.getElementById('description').textContent = item.description;
        document.getElementById('license').textContent = item.license;
        document.getElementById('priceETH').textContent = formatPrice(web3.utils.fromWei(item.priceETH));
        document.getElementById('priceAR').textContent = formatPrice(arweave.ar.winstonToAr(item.priceAR));
        showFiles(item.priceETH == 0 || item.priceAR == 0);
    }
})