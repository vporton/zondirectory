"strict";

// let itemEvents;

function sellInETHToggle(event) {
    document.getElementById('priceETH').disabled = event.target.checked;
}

function sellInARToggle(event) {
    document.getElementById('priceAR').disabled = event.target.checked;
}

function getPriceETH() {
    return document.getElementById('sellInETH').checked ? INFINITY : web3.utils.toWei(document.getElementById('priceETH').value);
}

function getPriceAR() {
    const arweave = Arweave.init();
    return document.getElementById('sellInAR').checked ? INFINITY : arweave.ar.arToWinston(document.getElementById('priceAR').value);
}

function setPriceETH(price) {
    if(price == INFINITY) {
        document.getElementById('sellInETH').checked = true;
        document.getElementById('priceETH').disabled = true;
    } else {
        document.getElementById('priceETH').value = formatPriceETH(price);
    }
}

function setPriceAR(price) {
    if(price == INFINITY) {
        document.getElementById('sellInAR').checked = true;
        document.getElementById('priceAR').disabled = true;
    } else {
        const arweave = Arweave.init();
        document.getElementById('priceAR').value = formatPriceAR(price);
    }
}

async function createOrUpdateItem() {
    const itemId = numParam('id');
    if(itemId)
        updateItem(itemId);
    else
        createItem();
}

async function createItem() {
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));

    const locale = document.getElementById('locale').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const license = document.getElementById('license').value;

    const response = await contractInstance.methods.createItem({title, description, priceETH: getPriceETH(), priceAR: getPriceAR(), locale, license},
                                                               '0x0000000000000000000000000000000000000001')
        .send({from: defaultAccount, gas: '1000000'});
    const itemId = response.events.ItemCreated.returnValues.itemId;
    await $('#multiVoter').doMultiVote(itemId);
}

async function updateItem(itemId) {
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));

    const locale = document.getElementById('locale').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const license = document.getElementById('license').value;

    contractInstance.methods.updateItem(itemId, {title, description, priceETH: getPriceETH(), priceAR: getPriceAR(), locale, license})
        .send({from: defaultAccount, gas: '1000000'})
        .on('transactionHash', async function(receiptHash) {
            alert("Item updated.");
        });
}

$(async function() {
    $('#multiVoter').multiVoter();

    const itemId = numParam('id');
    if(itemId) {
        $('#uploadLink > a').attr('href', "upload.html?id="+itemId);
        $('#uploadLink').css('display', 'block');
        const query = `{
    itemUpdateds(first:1, orderBy:itemId, orderDirection:desc, where:{itemId:${itemId}}) {
        title
        description
        license
        priceETH
        priceAR
    }
}`;
        let item = (await queryThegraph(query)).data.itemUpdateds[0];
        document.getElementById('title').value = item.title;
        document.getElementById('description').textContent = item.description;
        document.getElementById('license').textContent = item.license;
        setPriceETH(item.priceETH);
        setPriceAR(item.priceAR);
    }

})