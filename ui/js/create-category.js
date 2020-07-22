async function onLoad() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if(id) $('head').prepend(`<meta name="robots" content="noindex" />`);

    $('#multiVoter').multiVoter();
    await defaultAccountPromise();
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));
    contractInstance.methods.balanceOf(defaultAccount).call({from: defaultAccount, gas: '10000000'}, function(error, result){
        console.log(error)
        $('#value').html(result == 0 ? '<strong>zero</strong>' : formatPriceETH(result));
    });
}

async function createCategory() {
    const name = $("#title").val();
    if(!name) return;
    const locale = $("#locale").val();
    if(!locale) return;
    const owned = $('#owned').is(':checked');

    await defaultAccountPromise();
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));
    const response = await contractInstance.methods.createCategory(name, locale, owned, '0x0000000000000000000000000000000000000001')
            .send({from: defaultAccount, gas: '1000000'}, (error, result) => {
        if(error) return;
    });
    const catId = response.events.CategoryCreated.returnValues.categoryId;
    await $('#multiVoter').doMultiVote(catId);
}

$(onLoad);