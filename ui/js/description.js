"strict";

async function createNewItem() {
    const contract = web3.eth.contract(await categoriesJsonInterface());
    const contractInstance = contract.at(categoriesContractAddress);
    const title = document.getElementById('title').value;
    const short = document.getElementById('short').value;
    const long = document.getElementById('long').value;
    contractInstance.createItem(title, short, long, {gas: '5000000'}, receipt => {
        const event = receipt.events.ItemUpdated;
        const itemId = event.returnValues.id;
        open('upload.html?id=' + itemId);
    });
}