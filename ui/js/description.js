function createNewItem() {
    const contract = new web3.eth.Contract(jsonInterface, address)
    const title = document.getElementById('title');
    const short = document.getElementById('short');
    const long = document.getElementById('long')    ;
    contract.methods.createItem(title, short, long).send()
        .then(receipt => {
            const event = receipt.events.ItemUpdated;
            const itemId = event.returnValues.id;
            open('upload.html?id=' + itemId);
        });
}