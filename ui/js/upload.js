async function upload() {
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    if(!itemId) return; // just to be sure

    const fileReader = new FileReader();
    fileReader.onload = async (e) => {
        const key = JSON.parse(e.target.result);

        const arweave = Arweave.init();
        let transaction = await arweave.createTransaction({
            data: 'x' // FIXME: Upload the actual file.
        }, key);
        await arweave.transactions.sign(transaction, key);
        const response = await arweave.transactions.post(transaction);
        if(response.status != 200) {
            alert("Failed ArWeave transaction.");
            return;
        }

        const contractInstance = new web3.eth.Contract(await filesJsonInterface(), filesContractAddress);
        console.log(transaction.id);
        contractInstance.methods.uploadFile(itemId,
                                            document.getElementById('version').value,
                                            document.getElementById('format').value,
                                            transaction.id)
            .send({from: defaultAccount, gas: '1000000'})
            .then(() => open('description.html?id=' + itemId));
    }
    fileReader.readAsText(document.getElementById('arWalletKeyFile').files[0]);
}