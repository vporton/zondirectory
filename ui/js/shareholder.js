"strict";

async function onLoad() {
    $('#filesAddressElt').text(await getAddress('Files'));
    await defaultAccountPromise();
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));
    const tokenETH = await contractInstance.methods.balanceOf(defaultAccount).call();
    $('#tokenETH').text(web3.utils.fromWei(tokenETH));
    const earnedETH = await contractInstance.methods.dividendsOwing(defaultAccount).call();
    $('#ETH').text(web3.utils.fromWei(earnedETH));

    let query = `{
    setARWallets(orderBy:id, orderDirection:desc, where:{owner:"${defaultAccount}"}) {
        arWallet
    }
}`;
    const queryResult = (await queryThegraph(query)).data;
    if(queryResult.setARWallets[0]) {
        const arWallet = queryResult.setARWallets[0].arWallet;
        document.getElementById('arWallet').textContent = arWallet;
        const smartweave = require('smartweave');
        smartweave.readContract(arweave, AR_PST_CONTRACT_ADDRESS).then(contractState => {
            $('#tokenAR').text(contractState.balances[arWallet]);
        });
    }
}

async function withdrawETH() {
    await defaultAccountPromise();
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));
    await mySend(contractInstance, contractInstance.methods.withdrawProfit, []);
}

window.addEventListener('load', onLoad);