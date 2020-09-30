function recalcLink() {
    const address = $('#address').val();
    const page = $('#page').val();
    if(!web3.utils.isAddress(address)) {
        $('#link').text('');
        return;
    }
    try {
        let url = new URL(page);
        url.searchParams.set('affiliate', address);
        $('#link').text(url.toString());
    }
    catch(_) {
        $('#link').text('');
    }
}

async function onLoad() {
    await defaultAccountPromise();
    $('#address').val(defaultAccount);
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));
    const [buyerAffiliateShare, sellerAffiliateShare] = await Promise.all([
        contractInstance.methods.buyerAffiliateShare().call(),
        contractInstance.methods.sellerAffiliateShare().call(),
    ]);
    $('#sellerBonus').text(sellerAffiliateShare / (2**64) * 100);
    $('#buyerBonus').text(buyerAffiliateShare / (2**64) * 100);
}

window.addEventListener('load', onLoad);