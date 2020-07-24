async function onLoad() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if(id) {
        $('head').prepend(`<meta name="robots" content="noindex" />`);
        $("#ownedPar").css('display', 'none');
        $("#ownedInfo").css('display', 'block');

        const query = `{
    ownedCategoryUpdateds(first:1, orderBy:id, orderDirection:desc, where:{categoryId:${id}}) {
        title
        shortDescription
        description
        locale
    }
}`;
        const queryResult = (await queryThegraph(query)).data;
        const data = queryResult.ownedCategoryUpdateds[0];
        $('#title').val(data.title);
        $('#locale').val(data.title);
        $('#shortDescription').text(data.shortDescription);
        $('#description').text(data.description);
    }

    $('#multiVoter').multiVoter();
}

async function createCategory() {
    const name = $("#title").val();
    if(!name) return;
    const description = $("#description").val();
    const shortDescription = $("#shortDescription").val();
    const locale = $("#locale").val();
    if(!locale) return;
    const owned = $('#owned').is(':checked');

    await defaultAccountPromise();
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));
    let response;
    if(owned) {
        response = await contractInstance.methods.createOwnedCategory({title: name, locale, shortDescription, description}, '0x0000000000000000000000000000000000000001')
                .send({from: defaultAccount, gas: '1000000'}, (error, result) => {
            if(error) return; // FIXME
        });
    } else {
        response = await contractInstance.methods.createCategory(name, locale, '0x0000000000000000000000000000000000000001')
                .send({from: defaultAccount, gas: '1000000'}, (error, result) => {
            if(error) return; // FIXME
        });
    }
    const catId = response.events.CategoryCreated.returnValues.categoryId;
    await $('#multiVoter').doMultiVote(catId);
}

window.addEventListener('load', onLoad);