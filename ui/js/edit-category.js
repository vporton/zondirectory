"strict";

const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get('id');

async function onLoad() {
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
        $('#locale').val(data.locale);
        $('#shortDescription').text(data.shortDescription);
        $('#description').text(data.description);
    }

    $('#multiVoter').multiVoter();
}

async function createCategory() {
    if(!$('#form').valid()) return;

    const name = $("#title").val();
    if(!name) return;
    const description = $("#description").val();
    const shortDescription = $("#shortDescription").val();
    const locale = $("#locale").val();
    if(!locale) return;
    const owned = $('#owned').is(':checked');

    waitStart();
    await defaultAccountPromise();
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));
    let response;
    let newId = id;
    if(id) {
        response = await mySend(contractInstance, contractInstance.methods.updateOwnedCategory, [id, {title: name, locale, shortDescription, description}])
    } else {
        if(owned) {
            response = await mySend(contractInstance, contractInstance.methods.createOwnedCategory, [{title: name, locale, shortDescription, description}, '0x0000000000000000000000000000000000000001']);
        } else {
            response = await mySend(contractInstance, contractInstance.methods.createCategory, [name, locale, '0x0000000000000000000000000000000000000001']);
        }
        newId = response.events.CategoryCreated.returnValues.categoryId;
    }
    await $('#multiVoter').doMultiVote(newId);
    waitStop();

    $('#form').validate({});
}

window.addEventListener('load', onLoad);