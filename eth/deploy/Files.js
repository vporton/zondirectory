const buidler = require("@nomiclabs/buidler");
const fs = require('fs');

const {deployIfDifferent, log} = deployments;

let categories = {};

async function createCategory(address, blockNumber, name) {
    const contractInstance = new web3.eth.Contract(filesJsonInterface(), address);
    const namedAccounts = await getNamedAccounts();
    const {deployer} = namedAccounts;
    const response = await contractInstance.methods.createCategory(name, 'en', '0x0000000000000000000000000000000000000001')
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
    await contractInstance.methods.voteChildParent(child, parent, true, '0x0000000000000000000000000000000000000001').send({from: deployer, gas: '1000000', value: 1 /*wei*/})
        .on('error', (error) => log(`Error creating category: ` + error))
        .catch((error) => log(`Error adding item to category: ` + error));
}

module.exports = async ({getNamedAccounts, deployments}) => {
    const namedAccounts = await getNamedAccounts();
    const {deploy} = deployments;
    const {deployer} = namedAccounts;
    const MainPST = await deployments.get("MainPST");
    log(`Deploying Files...`);
    const deployResult = await deploy('Files', {from: deployer, proxy: true});
    if (deployResult.newlyDeployed) {
        log(`contract Files deployed at ${deployResult.address} in block ${deployResult.receipt.blockNumber} using ${deployResult.receipt.gasUsed} gas`);
        const contractInstance = await ethers.getContract("Files");
        await contractInstance.methods.initialize(process.env.PROGRAMMER_ADDRESS, MainPSTRelayer.address)
            .send({from: deployer, gas: '1000000'})
            .on('error', (error) => log(`Error initializing Files: ` + error))
            .catch((error) => log(`Error initializing Files: ` + error));
        log(`...initialized`);
    }
    const mydeploy = require('../lib/mydeploy');
    mydeploy.updateAddress('Files', deployResult.address, buidler.network.name); // or ethers.getContractAt
    mydeploy.updateAddress('FilesBlock', deployResult.receipt.blockNumber, buidler.network.name); // or ethers.getContractAt
    // if(await categories["Root"])
    //     mydeploy.updateAddress('Root', 1/*await categories["Root"]*/, buidler.network.name);
    // if(await categories["Spam"])
    //     mydeploy.updateAddress('Spam', 2/*await categories["Spam"]*/, buidler.network.name);
    // mydeploy.updateAddress('Root', 1, buidler.network.name);
    // mydeploy.updateAddress('Spam', 2, buidler.network.name);
}
module.exports.tags = ['Files'];
module.exports.dependencies = ['MainPST'];
