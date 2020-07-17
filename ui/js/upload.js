async function upload() {
    const itemId = numParam('id');
    if(!itemId) return; // just to be sure

    const keyFileReader = new FileReader();
    keyFileReader.onload = async (e) => {
        const key = JSON.parse(e.target.result); // TODO: If not a key file.

        const arweave = Arweave.init();
        const fileReader = new FileReader();
        fileReader.onload = async (e) => {
            const fileContent = new Uint8Array(e.target.result);

            const contractInstance = new web3.eth.Contract(await filesJsonInterface(), addressFiles);
            await defaultAccountPromise();
            contractInstance.methods.uploadOwnersShare().call(async (error, result) => {
                if(error) {
                    alert(error);
                    return;
                }
                const ownersShare = result / 2**64;

                const uploadPrice = $.get("https://arweave.net/price/" + fileContent.length, async function(priceResponse) {
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
                        data: fileContent,
                    }, key);
                    transaction.addTag('Content-Type', document.getElementById('file').files[0].type);
                    await arweave.transactions.sign(transaction, key);
                    const response = await arweave.transactions.post(transaction);
                    if(response.status != 200) {
                        alert("Failed ArWeave transaction.");
                        return;
                    }

                    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), addressFiles);
                    console.log(transaction.id);
                    contractInstance.methods.uploadFile(itemId,
                                                        document.getElementById('version').value,
                                                        document.getElementById('format').value,
                                                        Arweave.utils.b64UrlToBuffer(transaction.id))
                        .send({from: defaultAccount, gas: '1000000'})
                        .then(() => open('description.html?id=' + itemId));
                });
            });
        };
        fileReader.readAsArrayBuffer(document.getElementById('file').files[0]);
    }
    keyFileReader.readAsText(document.getElementById('arWalletKeyFile').files[0]);
}