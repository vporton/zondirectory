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
        document.getElementById('priceAR').value = formatPriceAR(price);
    }
}

async function createOrUpdateItem() {
    $('#priceETH').removeClass('error');
    $('#priceAR').removeClass('error');
    if(!$('#form').valid()) return;

    const itemId = numParam('id');
    if(itemId)
        updateItem(itemId);
    else
        createItem();
}

async function createItem() {
    // waitStart();
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));

    const locale = document.getElementById('locale').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const shortDescription = document.getElementById('shortDescription').value;
    const license = document.getElementById('license').value;

    await defaultAccountPromise();
    const {
        cats,
        amounts,
        sum,
    } = await $('#multiVoter').multiVoterData();
    const response = await mySend(contractInstance, contractInstance.methods.createItemAndVote,
                                  [{title, shortDescription, description, priceETH: getPriceETH(), priceAR: getPriceAR(), locale, license},
                                   '0x0000000000000000000000000000000000000001', cats, amounts], {value: sum});
    // const itemId = response.events.ItemCreated.returnValues.itemId;
    // await $('#multiVoter').doMultiVote(itemId);
    // waitStop();
}

async function updateItem(itemId) {
    waitStart();
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));

    const locale = document.getElementById('locale').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const shortDescription = document.getElementById('shortDescription').value;
    const license = document.getElementById('license').value;

    await defaultAccountPromise();
    await mySend(contractInstance, contractInstance.methods.updateItem, [itemId, {title, shortDescription, description, priceETH: getPriceETH(), priceAR: getPriceAR(), locale, license}]);
    waitStop();
}

$(async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if(id) $('head').prepend(`<meta name="robots" content="noindex" />`);

    $('#multiVoter').multiVoter();

    const itemId = numParam('id');
    if(itemId) {
        $('#multiVoterDiv').css('display', 'none');
        $('#uploadLink > a').attr('href', "upload.html?id="+itemId);
        $('#uploadLink').css('display', 'block');
        const query = `{
    itemUpdateds(first:1, orderBy:itemId, orderDirection:desc, where:{itemId:${itemId}}) {
        title
        description
        shortDescription
        license
        priceETH
        priceAR
    }
}`;
        let item = (await queryThegraph(query)).data.itemUpdateds[0];
        document.getElementById('title').value = item.title;
        document.getElementById('description').textContent = item.description;
        document.getElementById('shortDescription').textContent = item.shortDescription;
        document.getElementById('license').textContent = item.license;
        setPriceETH(item.priceETH);
        setPriceAR(item.priceAR);
    }

    $('#form').validate({
        rules: {
            priceETH: {number: true},
            priceAR: {number: true}
        }
    });
})