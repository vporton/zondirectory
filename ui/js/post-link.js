"strict";

let arKeyChooser;

async function createOrUpdateItem() {
    //if(!$('#form').valid()) return; // does not work with summernote

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
    const kind = $('input[name=kind]:checked');
    const owned = true;

    let link = document.getElementById('link').value;
    if($('#tabs-blog').css('display') != 'none') {
        const text = $('#blogPost').summernote('code');
        // TODO: metatags
        const html = `<html><head><meta charset="utf-8"/><title>${safe_tags(title)}</title></head><body>${text}</body></html>`;
        link = "arweave:" + await upload(html, arKeyChooser, 'text/html');
    }

    waitStart();
    const response = await contractInstance.methods.createLink({link, title, shortDescription, description, locale, linkKind: kind}, owned, '0x0000000000000000000000000000000000000001')
        .send({from: defaultAccount, gas: '1000000'})
    const linkId = response.events.ItemCreated.returnValues.itemId;
    await $('#multiVoter').doMultiVote(linkId);
    waitStop();
}

async function updateItem(itemId) {
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));

    const locale = document.getElementById('locale').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const shortDescription = document.getElementById('shortDescription').value;
    const link = document.getElementById('link').value;
    const kind = $('input[name=kind]:checked');

    waitStart();
    await contractInstance.methods.updateLink(itemId, {link, title, shortDescription, description, locale, linkKind: kind})
        .send({from: defaultAccount, gas: '1000000'})
        .on('transactionHash', async function(receiptHash) {
            $('#ready').dialog();
        });
    await $('#multiVoter').doMultiVote(itemId);
    waitStop();
    }

$(async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if(id) $('head').prepend(`<meta name="robots" content="noindex" />`);

    $('#tabs').tabs();
    $('#multiVoter').multiVoter();
    $('#blogPost').summernote({
        toolbar: [
            // [groupName, [list of button]]
            ['style', ['bold', 'italic', 'underline', 'clear']],
            ['font', ['strikethrough', 'superscript', 'subscript']],
            ['fontsize', ['fontsize']],
            ['color', ['color']],
            ['para', ['style', 'paragraph', 'ol', 'ul']],
            ['insert', ['link', 'picture', 'video', 'table', 'hr']],
            ['view', ['fullscreen', 'undo', 'redo', 'help']],
        ]
    });

    const itemId = numParam('id');
    if(itemId) {
        const query = `{
    linkUpdateds(first:1, orderBy:id, orderDirection:desc, where:{linkId:${itemId}}) {
        link
        title
        description
        shortDescription
        locale
        linkKind
    }
}`;
        let item = (await queryThegraph(query)).data.linkUpdateds[0];
        document.getElementById('link').value = item.link;
        document.getElementById('title').value = item.title;
        document.getElementById('description').textContent = item.description;
        document.getElementById('shortDescription').textContent = item.shortDescription;
        document.getElementById('locale').textContent = item.locale;
        $(`input[name=kind][value=${item.linkKind}]`).prop('checked', true);
    }

    arKeyChooser = $('#arWalletKeyFile').arKeyChooser({storeName: 'authorARPrivateKey'});
    // FIXME: Does not work with summernote:
    // $('#form').validate({
    //     ignore: '[name=blogPost]', // Validation does not work with summernote.
    // });
});