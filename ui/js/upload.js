"strict";

async function upload(content, arKeyChooser, contentType) {
    const key = await arKeyChooser.arKeyGet();
    if(!key) {
        alert("Choose an Arweave key file!");
        return;
    }
    arKeyChooser.arKeyStore();

    return new Promise(async (resolve) => {
        const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));
        await defaultAccountPromise();
        contractInstance.methods.uploadOwnersShare().call(async (error, result) => {
            if(error) {
                alert(error);
                return;
            }
            const ownersShare = result / 2**64;

            const uploadPrice = $.get("https://arweave.net/price/" + content.length, async function(priceResponse) {
                const shareholdersRoyalty = Math.floor(ownersShare * priceResponse);
                console.log("shareholdersRoyalty:", shareholdersRoyalty)
                let paymentFailure = false;
                if(shareholdersRoyalty) {
                    const smartweave = require('smartweave');
                    smartweave.readContract(arweave, AR_PST_CONTRACT_ADDRESS).then(async contractState => {
                        const holder = smartweave.selectWeightedPstHolder(contractState.balances);
                        const tx = await arweave.createTransaction({ target: holder, quantity: String(shareholdersRoyalty) }, key);
                        await arweave.transactions.sign(tx, key);
                        const response = await arweave.transactions.post(tx);
                        if(response.status != 200) paymentFailure = true;
                    });
                }
                if(paymentFailure) {
                    alert("Can't pay for the trasaction!")
                    return;
                }

                let transaction = await arweave.createTransaction({
                    data: content,
                }, key);
                transaction.addTag('Content-Type', contentType);
                await arweave.transactions.sign(transaction, key);
                const response = await arweave.transactions.post(transaction);
                if(response.status != 200) {
                    alert("Failed ArWeave transaction.");
                    return;
                }

                resolve(transaction.id);
            });
        });
    });
}