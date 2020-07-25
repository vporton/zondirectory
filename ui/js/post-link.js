"strict";

// let itemEvents;

async function createOrUpdateItem() {
    if(!$('#form').valid()) return;

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
    const shortDescription = document.getElementById('shortDescription').value;
    const link = document.getElementById('link').value;
    const kind = $('input[name=kind]:checked');
    const owned = true;

    const response = await contractInstance.methods.createLink({link, title, shortDescription, description, locale, linkKind: kind}, owned, '0x0000000000000000000000000000000000000001')
        .send({from: defaultAccount, gas: '1000000'})
    const linkId = response.events.ItemCreated.returnValues.itemId;
    await $('#multiVoter').doMultiVote(linkId);
}

async function updateItem(itemId) {
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));

    const locale = document.getElementById('locale').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const shortDescription = document.getElementById('shortDescription').value;
    const link = document.getElementById('link').value;
    const kind = $('input[name=kind]:checked');

    await contractInstance.methods.updateLink(itemId, {link, title, shortDescription, description, locale, linkKind: kind}, '0x0000000000000000000000000000000000000001')
        .send({from: defaultAccount, gas: '1000000'})
        .on('transactionHash', async function(receiptHash) {
            $('#ready').dialog();
        });
}

$(async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if(id) $('head').prepend(`<meta name="robots" content="noindex" />`);

    $('#multiVoter').multiVoter();

    const itemId = numParam('id');
    if(itemId) {
        const query = `{
    linkUpdateds(first:1, orderBy:linkId, orderDirection:desc, where:{linkId:${itemId}}) {
        link
        title
        description
        locale
        linkKind
    }
}`;
        let item = (await queryThegraph(query)).data.linkUpdateds[0];
        document.getElementById('link').value = item.link;
        document.getElementById('title').value = item.title;
        document.getElementById('description').textContent = item.description;
        document.getElementById('locale').textContent = item.locale;
        $(`input[name=kind][value=${item.linkKind}]`).prop('checked', true);
    }

    $('#form').validate({});
});