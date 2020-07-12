"strict";

// let itemEvents;

async function createOrUpdateItem() {
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    if(itemId)
        updateItem(itemId);
    else
        createItem();
}

async function createItem() {
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), addressFiles);

    const locale = document.getElementById('locale').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const link = document.getElementById('link').value;
    const kind = $('input[name=kind]:checked');
    const owned = true;

    let transactionHash = null;
    let events = [];

    contractInstance.methods.createLink(link, title, description, locale, kind, owned)
        .send({from: defaultAccount, gas: '1000000'})
        .on('transactionHash', async function(receiptHash) {
            transactionHash = receiptHash;
            // console.log(await contractInstance.getPastEvents('ItemUpdated', {fromBlock:0, toBlock:'pending'}));
            alert("Link created. Add it to some categories.");
        });
}

async function updateItem(itemId) {
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), addressFiles);

    const locale = document.getElementById('locale').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const link = document.getElementById('link').value;
    const kind = $('input[name=kind]:checked');

    contractInstance.methods.updateItem(itemId, link, title, description, locale, kind)
        .send({from: defaultAccount, gas: '1000000'})
        .on('transactionHash', async function(receiptHash) {
            alert("Item updated.");
        });
}

$(async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    if(itemId) {
        const query = `{
    linkUpdateds(first:1, orderBy:itemId, orderDirection:desc, where:{itemId:${itemId}}) {
        link
        title
        description
        locale
    }
}`;
        let item = (await queryThegraph(query)).data.linkUpdateds[0];
        document.getElementById('link').value = item.link;
        document.getElementById('title').value = item.title;
        document.getElementById('description').textContent = item.description;
        document.getElementById('locale').textContent = item.locale;
        $(`input[name=kind][value=${item.kind}]`).prop('checked', true);
    }

})