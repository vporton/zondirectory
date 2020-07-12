async function onLoad() {
    await defaultAccountPromise();
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), addressFiles);    
    contractInstance.methods.balanceOf(defaultAccount).call({from: defaultAccount, gas: '10000000'}, function(error, result){
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
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), addressFiles);
    // TODO: Wait for a confirmation, open('vote.html?id=...') page.
    await contractInstance.methods.createCategory(name, locale, owned).send({from: defaultAccount, gas: '10000000'}, (error, result) => {
        if(error) return;
        alert("Now add this category as a child to another category(ies).");
    });
}

$(onLoad);