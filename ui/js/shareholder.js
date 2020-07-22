$(async function() {
    $('#filesAddressElt').text(await getAddress('Files'));
    await defaultAccountPromise();
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));
    const tokenETH = await contractInstance.methods.balanceOf(defaultAccount).call();
    $('#tokenETH').text(web3.utils.fromWei(tokenETH));
    const earnedETH = await contractInstance.methods.dividendsOwing(defaultAccount).call();
    $('#ETH').text(web3.utils.fromWei(earnedETH));
});

async function withdrawETH() {
    await defaultAccountPromise();
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));
    await contractInstance.methods.withdrawProfit().send({gas: '100000', from: defaultAccount});
}