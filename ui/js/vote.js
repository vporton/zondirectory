async function onLoad() {
    await defaultAccountPromise();
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), addressFiles);    
    contractInstance.methods.balanceOf(defaultAccount).call({from: defaultAccount, gas: '10000000'}, function(error, result){
        $('#value').html(result == 0 ? '<strong>zero</strong>' : formatPriceETH(result));
    });
}

async function vote() {
    const child = $('#child').val();
    const parent = $('#parent').val();
    const yes = $('[name=dir][value=for]').is(":checked");

    await defaultAccountPromise();
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), addressFiles);
    await contractInstance.methods.voteForCategory(child, parent, yes).send({from: defaultAccount, gas: '10000000'}, (error, result) => {
        if(error) return;
        alert("You voted " + $('[name=dir][value=for]').val());
    });
}

$(onLoad);