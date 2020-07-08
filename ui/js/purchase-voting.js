async function onLoad() {
    await defaultAccountPromise();
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), addressFiles);    
    contractInstance.methods.balanceOf(defaultAccount).call({from: defaultAccount, gas: '10000000'}, function(error, result){
        $('#value').html(result == 0 ? '<strong>zero</strong>' : formatPriceETH(result));
    });
}

async function buyVotingRight() {
    const amount = prompt("Enter amount in ETH:", '0.1');
    if(!amount) return;

    await defaultAccountPromise();
    //const contractInstance = new web3.eth.Contract(await filesJsonInterface(), addressFiles);
    web3.eth.sendTransaction({to: addressFiles, from: defaultAccount, value: web3.utils.toWei(amount)}, (error, result) => {
        alert("Thank you for your purchase!")
    });

}

$(onLoad);