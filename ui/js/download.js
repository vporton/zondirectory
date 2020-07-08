"strict";

const urlParams = new URLSearchParams(window.location.search);
const itemId = urlParams.get('id');

async function showFiles(withLinks) {
    let query = `{
    itemFilesUpdateds(first:1, orderBy:version, orderDirection:desc, where:{itemId:${itemId}}) {
        version
    }
}`;
    let version = (await queryThegraph(query)).data.itemFilesUpdateds[0].version;
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
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), addressFiles);
    await defaultAccountPromise();
    // FIXME: The transaction can be canceled after the files are already revealed!
    // 'confirmation' event is not fired: https://github.com/ethereum/web3.js/issues/2104#issuecomment-654899409
    contractInstance.methods.pay(itemId).send({from: defaultAccount, value: web3.utils.toWei(String(price*1.0000001)), gas: '1000000'},
                                              function(error, transactionHash) {
        if(error) {
            alert("You tried to pay below the price or payment failure! " + err);
        } else {
            showFilesWithMessage();
        }
    });
}

async function payAR() {
    if(!document.getElementById('arWalletKeyFile').files[0]) {
        alert("Select your AR wallet key file to pay!");
        return;
    }

    let price = askPrice(document.getElementById('priceAR').textContent);
    if(!price) return;

    const arweave = Arweave.init();
    price = arweave.ar.arToWinston(price);

    const smartweave = require('smartweave');
    const fileReader = new FileReader();
    fileReader.onload = async (e) => {
        const key = JSON.parse(e.target.result);

        smartweave.readContract(arweave, AR_PST_CONTRACT_ADDRESS).then(async contractState => {
            await defaultAccountPromise();
            let query = `{
    setARWallets(first:1, orderBy:id, orderDirection:desc, where:{owner:"${defaultAccount}"}) {
        arWallet
    }
}`;
            let arWallet = (await queryThegraph(query)).data.setARWallets[0].arWallet;
            let authorRoyalty, shareholdersRoyalty;
            const contractInstance = new web3.eth.Contract(await filesJsonInterface(), addressFiles);
            await defaultAccountPromise();
            // TODO: Don't call Ethereum if no author's AR wallet.
            contractInstance.methods.ownersShare().call(async (error, result) => {
                if(error) {
                    alert(error);
                    return;
                }
                const ownersShare = result / 2**64;

                if(arWallet) {
                    authorRoyalty = (1 - ownersShare) * price;
                    shareholdersRoyalty = ownersShare * price;
                } else {
                    authorRoyalty = 0;
                    shareholdersRoyalty = price;
                }

                // FIXME: check that we have enough balance before trying to pay
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

                if(!paymentFailure)
                    showFilesWithMessage();
                else
                    alert("You didn't pay the full sum!");
            });
        });
    }
    fileReader.readAsText(document.getElementById('arWalletKeyFile').files[0]);
}

$(async function() {
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
        document.getElementById('priceETH').textContent = formatPriceETH(item.priceETH);
        document.getElementById('priceAR').textContent = formatPriceAR(item.priceAR);
        showFiles(item.priceETH == 0 || item.priceAR == 0);
    }
})