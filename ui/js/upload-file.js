let arKeyChooser;

async function uploadFile() {
    const itemId = numParam('id');
    if(!itemId) return; // just to be sure

    if(!$('#form').valid()) return;

    const fileReader = new FileReader();
    fileReader.onload = async (e) => {
        const fileContent = new Uint8Array(e.target.result);
        const hash = await upload(fileContent, arKeyChooser, document.getElementById('file').files[0].type);

        const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));
        contractInstance.methods.uploadFile(itemId,
                                            document.getElementById('version').value,
                                            document.getElementById('format').value,
                                            Array.from(Arweave.utils.b64UrlToBuffer(hash)))
            .send({from: defaultAccount, gas: '1000000'})
            .then(() => open('description.html?id=' + itemId));
};
    fileReader.readAsArrayBuffer(document.getElementById('file').files[0]);
}

$(function() {
    arKeyChooser = $('#arWalletKeyFile').arKeyChooser({storeName: 'authorARPrivateKey'});
    $('#form').validate({
        rules: {
            version: {digits: true},
        }
    });
});