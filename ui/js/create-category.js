async function onLoad() {
    $('#multiVoter').multiVoter();
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
    const contractInstance = new web3.eth.Contract(await filesPlusJsonInterface(), addressFilesPlus);
    const { votes: votingData, sum: amount } = await $('#multiVoter').multiVoterData();
    // TODO: Wait for a confirmation, open('vote.html?id=...') page.
    await contractInstance.methods.createCategory(name, locale, owned, votingData)
            .send({from: defaultAccount, value: amount, gas: '10000000'}, (error, result) => {
        if(error) return;
        $("#ready").dialog();
    });
}

$(onLoad);