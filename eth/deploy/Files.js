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
    await contractInstance.methods.createCategory(name, 'en').send({from: deployer, gas: '1000000'})
        .on('error', (error) => log(`Error creating category: ` + error))
        .catch((error) => log(`Error creating category: ` + error));
    log(`created category "${name}"...`);
    // It does not work on Infura Rinkeby as of 10 Jul 2020:
    // categories[name] = await getCategoryId(address, blockNumber, name, contractInstance);
    // log(`category ID ${await categories[name]}`);
}

function getCategoryId(address, blockNumber, name, contractInstance) {
    return new Promise((resolve, errorHandler) => {
        // Error: The current provider doesn't support subscriptions: Web3HTTPProviderAdapter
        // contractInstance.once('CategoryCreated', {
        //     filter: {title: name, locale: 'en'}, // Using an array means OR: e.g. 20 or 23
        //     fromBlock: 0
        // }, function(event) {
        //     log(event)
        //     resolve(event.returnValues.categoryId);
        // })
        // .on('error', (error) => log(`Error getting category ID: ` + error))
        // .catch((error) => log(`Error getting category ID: ` + error));
        const readEvents = function() {
            contractInstance.getPastEvents('CategoryCreated', {
                filter: {/*title: name, locale: 'en'*/},
                fromBlock: blockNumber,
                toBlock: 'pending',
            })
                .then(function(events) {
                    log(events)
                    for(let i in events) {
                        const event = events[i];
                        if(event.event == 'CategoryCreated') {
                            resolve(event.returnValues.categoryId);
                            return;
                        }
                    }
                    setTimeout(readEvents, 10000);
                })
                .catch((error) => errorHandler(`Error getting category ID: ` + error));
        }
        readEvents();
    });
}

async function addItemToCategory(parent, child) {
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
        // It does not work on Infura, see above:
        // var categoryNames = Object.keys(categories);
        // var allCategories = categoryNames.map(v => categories[v]);
        // Promise.all(allCategories);
        // //console.log(await Promise.all(categoryNames.map(async v => await categories[v])));
        // log(`created ${allCategories.length} categories`);

        // log(`Creating category relations...`)
        // addItemToCategory(await categories["Root"], await categories["E-books"]);
        // addItemToCategory(await categories["Root"], await categories["Videos"]);
        // addItemToCategory(await categories["Root"], await categories["Software"]);
        // addItemToCategory(await categories["Software"], await categories["Binaries"]);
        // addItemToCategory(await categories["Software"], await categories["Sources"]);
        // log(`created base category structure`);
    }
    const mydeploy = require('../lib/mydeploy');
    mydeploy.updateAddress('Files', deployResult.address, buidler.network.name); // or ethers.getContractAt
    mydeploy.updateAddress('FilesBlock', deployResult.receipt.blockNumber, buidler.network.name); // or ethers.getContractAt
    // if(await categories["Root"])
    //     mydeploy.updateAddress('Root', await categories["Root"], buidler.network.name);
    // if(await categories["Spam"])
    //     mydeploy.updateAddress('Spam', await categories["Spam"], buidler.network.name);
    mydeploy.updateAddress('Root', 1, buidler.network.name);
    mydeploy.updateAddress('Spam', 2, buidler.network.name);
}
module.exports.tags = ['Files'];
