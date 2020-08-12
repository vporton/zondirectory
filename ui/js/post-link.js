"strict";

let arKeyChooser;

function randomUint256() {
    return web3.utils.toHex(new web3.utils.BN(web3.utils.randomHex(32)));
}

const itemId = numParam('id');

async function createOrUpdateItem() {
    //if(!$('#form').valid()) return; // does not work with summernote

    if(itemId)
        updateItem(itemId);
    else
        createItem();
}

// TODO: Avoid global variables.
let templateIdCreated = null;
let postIdCreated = null;

async function uploadBlog(link, title, shortDescription) {
    const contractInstance2 = new web3.eth.Contract(await blogTemplatesJsonInterface(), await getAddress('BlogTemplates'));

    if($('#tabs-blog').css('display') != 'none') {
        const text = $('#blogPost').summernote('code');
        templateIdCreated = $('#template').val();
        let jsCode = "";
        if(templateIdCreated) {
            const jsLink = await contractInstance2.methods.templatesJavaScript(templateIdCreated).call();
            const jsBase = jsLink.replace(/[^\/\\]*$/, "");
            if(!postIdCreated) postIdCreated = randomUint256();
            jsCode = `<script src="${jsLink}"></script><script>zonDirectory_template(${JSON.stringify(jsBase)}, "${web3.utils.toHex(postIdCreated)}");</script>`;
        }
        const html = `<html lang="${locale}">
    <head>
        <meta charset="utf-8"/>
        ${jsCode}
        <title>${safe_tags(title)}</title>
        <meta name="description" content="${safe_attrs(shortDescription)}"/>
    </head>
    <body>${text}</body></html>`;
        const arHash = await upload(html, arKeyChooser, 'text/html');
        link = "arweave:" + arHash;
        console.log(`Uploaded https://arweave.net/${arHash}`);
    }

    return link;
}

async function createItem() {
    const locale = document.getElementById('locale').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const shortDescription = document.getElementById('shortDescription').value;
    const kind = $('input[name=kind]:checked').val();
    const owned = true;

    let link = document.getElementById('link').value;

    waitStart();
    
    await defaultAccountPromise();

    link = await uploadBlog(link, title, shortDescription);

    const {
        cats,
        amounts,
        sum,
    } = await $('#multiVoter').multiVoterData();

    if(templateIdCreated) {
        const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));
        const contractInstance2 = new web3.eth.Contract(await blogTemplatesJsonInterface(), await getAddress('BlogTemplates'));
        const response = await mySend(contractInstance, contractInstance.methods.createLinkAndVote, [{link, title, shortDescription, description, locale, linkKind: kind}, owned, '0x0000000000000000000000000000000000000001', cats, amounts], {value: sum});
        const linkId = response.events.ItemCreated.returnValues.itemId;
        mySend(contractInstance2, contractInstance2.methods.createPost, [templateIdCreated, postIdCreated, linkId])
            .then(() => {});
    } else {
        const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));
        mySend(contractInstance, contractInstance.methods.createLinkAndVote, [{link, title, shortDescription, description, locale, linkKind: kind}, owned, '0x0000000000000000000000000000000000000001', cats, amounts], {value: sum})
            .then(() => {});
   }

    waitStop();
}

async function updateItem(itemId) {
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));

    const locale = document.getElementById('locale').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const shortDescription = document.getElementById('shortDescription').value;
    let link = document.getElementById('link').value;
    const kind = $('input[name=kind]:checked').val();

    waitStart();
    link = await uploadBlog(link, title, shortDescription);
    if(templateIdCreated) {
        const contractInstance2 = new web3.eth.Contract(await blogTemplatesJsonInterface(), await getAddress('BlogTemplates'));
        await mySend(contractInstance2, contractInstance.methods.updatePostFull, [itemId, {link, title, shortDescription, description, locale, linkKind: kind}, templateIdCreated]);
    } else {
        await mySend(contractInstance, contractInstance.methods.updateLink, [itemId, {link, title, shortDescription, description, locale, linkKind: kind}]);
    }
    // await $('#multiVoter').doMultiVote(itemId);
    waitStop();
}

async function onLoad() {
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
    let item;
    if(itemId) {
        $('#multiVoterDiv').css('display', 'none');
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
        item = (await queryThegraph(query)).data.linkUpdateds[0];
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

    await defaultAccountPromise();
    query = `{
    templateChangeOwners(orderBy:id, orderDirection:desc, where:{owner:"${defaultAccount}"}) {
        templateId
    }
    postCreateds(where:{itemId:${itemId}}) {
        postId
    }
}`;
    const data1 = (await queryThegraph2(query)).data;
    const postId = data1.postCreateds.length ? data1.postCreateds[0].postId : null;
    if(postId) postIdCreated = postId;
    let templateIds = data1.templateChangeOwners;
    templateIds = templateIds.filter((x, i, a) => a.indexOf(x) == i); // unique values
    if(!templateIds.length) return;
    const templateIdsFlat = templateIds.map(i => i.templateId);
    function subquery(templateId) {
        return `    templateUpdateds${templateId}: templateUpdateds(first:1, orderBy:id, orderDirection:desc, where:{templateId:${templateId}}) {
    templateId
    name
}`
    }
    if(postId)
        query = `{ postUpdateds(where:{postId:"${postId}"}) { templateId }` +
            templateIdsFlat.map(i => subquery(i)).join("\n") + "\n}";
    else
        query = "{\n" + templateIdsFlat.map(i => subquery(i)).join("\n") + "\n}";
    let items = (await queryThegraph2(query)).data;
    const templateId = items.postUpdateds && items.postUpdateds.length ? items.postUpdateds[0].templateId : null;
    for (let i in items) {
        if(!/^templateUpdateds[0-9]+/.test(i)) continue;
        const itemx = items[i][0];
        const html = `<option value="${itemx.templateId}">${safe_tags(itemx.name)}</option>`;
        $('#template').append(html);
    }
    if(data1.postCreateds.length) { // It is a blog post.
        $("#tabs").tabs({ active: 1 });
        $('#template').val(templateId);
        const url = item.link.replace(/^arweave:/, "https://arweave.net/");
        const html = await (await fetch(url)).text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        $("#blogPost").summernote("code", doc.body.innerHTML);        
    }
}

window.addEventListener('load', onLoad);