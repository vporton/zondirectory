const buidler = require("@nomiclabs/buidler");
const fs = require('fs');

const {deployIfDifferent, log} = deployments;

function filesJsonInterface() {
    const text = fs.readFileSync("artifacts/Files.json");
    return JSON.parse(text).abi;
}

let categories = {};

async function createCategory(address, blockNumber, name) {
    const contractInstance = new web3.eth.Contract(filesJsonInterface(), address);
    const namedAccounts = await getNamedAccounts();
    const {deployer} = namedAccounts;
    const response = await contractInstance.methods.createCategory(name, 'en', false)
        .send({from: deployer, gas: '1000000'})
        .on('error', (error) => log(`Error creating category: ` + error))
        .catch((error) => log(`Error creating category: ` + error));
    categories[name] = await getCategoryId(response);
    log(`created category "${name}" (${await categories[name]})...`);
}

function getCategoryId(response) {
    const events = response.events;
    return new Promise((resolve, errorHandler) => {
        for(let i in events) {
            const event = events[i];
            if(event.event == 'CategoryCreated') {
                resolve(event.returnValues.categoryId);
                return;
            }
        }
    })
    .catch((error) => errorHandler(`Error getting category ID: ` + error));
}

async function addItemToCategory(address, parent, child) {
    log(`${parent} -> ${child}`);
    const contractInstance = new web3.eth.Contract(filesJsonInterface(), address);
    const namedAccounts = await getNamedAccounts();
    const {deployer} = namedAccounts;
    await contractInstance.methods.voteChildParent(child, parent, true).send({from: deployer, gas: '1000000', value: 1 /*wei*/})
        .on('error', (error) => log(`Error creating category: ` + error))
        .catch((error) => log(`Error adding item to category: ` + error));
}

module.exports = async ({getNamedAccounts, deployments}) => {
    const namedAccounts = await getNamedAccounts();
    const {deploy} = deployments;
    const {deployer} = namedAccounts;
    log(`Deploying Files...`);
    const deployResult = await deploy('Files', {from: deployer, args: [process.env.PROGRAMMER_ADDRESS, 10000000]});
    if (deployResult.newlyDeployed) {
        log(`contract Files deployed at ${deployResult.address} in block ${deployResult.receipt.blockNumber} using ${deployResult.receipt.gasUsed} gas`);

        log(`Creating categories...`);
        await createCategory(deployResult.address, deployResult.receipt.blockNumber, "Root");
        await createCategory(deployResult.address, deployResult.receipt.blockNumber, "Spam");
        await createCategory(deployResult.address, deployResult.receipt.blockNumber, "E-books");
        await createCategory(deployResult.address, deployResult.receipt.blockNumber, "Videos");
        await createCategory(deployResult.address, deployResult.receipt.blockNumber, "Software");
        await createCategory(deployResult.address, deployResult.receipt.blockNumber, "Binaries");
        await createCategory(deployResult.address, deployResult.receipt.blockNumber, "Sources");
        var categoryNames = Object.keys(categories);
        var allCategories = categoryNames.map(v => categories[v]);
        Promise.all(allCategories);
        //console.log(await Promise.all(categoryNames.map(async v => await categories[v])));
        log(`created ${allCategories.length} categories`);

        log(`Creating category relations...`)
        await addItemToCategory(deployResult.address, await categories["Root"], await categories["E-books"]);
        await addItemToCategory(deployResult.address, await categories["Root"], await categories["Videos"]);
        await addItemToCategory(deployResult.address, await categories["Root"], await categories["Software"]);
        await addItemToCategory(deployResult.address, await categories["Software"], await categories["Binaries"]);
        await addItemToCategory(deployResult.address, await categories["Software"], await categories["Sources"]);
        log(`created base category structure`);
    }
    const mydeploy = require('../lib/mydeploy');
    mydeploy.updateAddress('Files', deployResult.address, buidler.network.name); // or ethers.getContractAt
    mydeploy.updateAddress('FilesBlock', deployResult.receipt.blockNumber, buidler.network.name); // or ethers.getContractAt
    if(await categories["Root"])
        mydeploy.updateAddress('Root', await categories["Root"], buidler.network.name);
    if(await categories["Spam"])
        mydeploy.updateAddress('Spam', await categories["Spam"], buidler.network.name);
    // mydeploy.updateAddress('Root', 1, buidler.network.name);
    // mydeploy.updateAddress('Spam', 2, buidler.network.name);
}
module.exports.tags = ['Files'];
