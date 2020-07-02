"strict";

async function createNewItem() {
    const contract = web3.eth.contract(await categoriesJsonInterface());
    const contractInstance = contract.at(categoriesContractAddress);
    const title = document.getElementById('title');
    const short = document.getElementById('short');
    const long = document.getElementById('long');
    contractInstance.createItem.call(title, short, long, { from: web3.eth.accounts[0]})
        .then(receipt => {
            const event = receipt.events.ItemUpdated;
            const itemId = event.returnValues.id;
            open('upload.html?id=' + itemId);
        });
}