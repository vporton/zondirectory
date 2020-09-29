const buidler = require("@nomiclabs/buidler");
const fs = require('fs');

const {deployIfDifferent, log} = deployments;

function filesJsonInterface() {
    const text = fs.readFileSync("artifacts/Files.json");
    return JSON.parse(text).abi;
}

module.exports = async ({getNamedAccounts, deployments}) => {
    const namedAccounts = await getNamedAccounts();
    const {deploy} = deployments;
    const {deployer} = namedAccounts;
    const Actual = await deployments.get("Files");
    log(`Deploying FilesRelayer...`);
    const deployResult = await deploy('FilesRelayer', {from: deployer, args: [Actual.address, process.env.PROGRAMMER_ADDRESS]});
    if (deployResult.newlyDeployed) {
        log(`contract FilesRelayer deployed at ${deployResult.address} in block ${deployResult.receipt.blockNumber} using ${deployResult.receipt.gasUsed} gas`);
        const MainPSTRelayer = await deployments.get('MainPSTRelayer');
        const contractInstance = new web3.eth.Contract(filesJsonInterface(), deployResult.address);
        await contractInstance.methods.initialize(process.env.PROGRAMMER_ADDRESS, MainPSTRelayer.address)
            .send({from: deployer, gas: '1000000'})
            .on('error', (error) => log(`Error initializing Files: ` + error))
            .catch((error) => log(`Error initializing Files: ` + error));
        log(`...initialized`);

        // "replacement transaction underpriced" (ethers and web3 incompatibility?)
        // log(`Creating categories...`);
        // await createCategory(deployResult.address, deployResult.receipt.blockNumber, "Root");
        // await createCategory(deployResult.address, deployResult.receipt.blockNumber, "Spam");
        // await createCategory(deployResult.address, deployResult.receipt.blockNumber, "E-books");
        // await createCategory(deployResult.address, deployResult.receipt.blockNumber, "Videos");
        // await createCategory(deployResult.address, deployResult.receipt.blockNumber, "Software");
        // await createCategory(deployResult.address, deployResult.receipt.blockNumber, "Binaries");
        // await createCategory(deployResult.address, deployResult.receipt.blockNumber, "Sources");
        // var categoryNames = Object.keys(categories);
        // var allCategories = categoryNames.map(v => categories[v]);
        // Promise.all(allCategories);
        // //console.log(await Promise.all(categoryNames.map(async v => await categories[v])));
        // log(`created ${allCategories.length} categories`);

        // log(`Creating category relations...`)
        // await addItemToCategory(deployResult.address, await categories["Root"], await categories["E-books"]);
        // await addItemToCategory(deployResult.address, await categories["Root"], await categories["Videos"]);
        // await addItemToCategory(deployResult.address, await categories["Root"], await categories["Software"]);
        // await addItemToCategory(deployResult.address, await categories["Software"], await categories["Binaries"]);
        // await addItemToCategory(deployResult.address, await categories["Software"], await categories["Sources"]);
        // log(`created base category structure`);
    }
    const mydeploy = require('../lib/mydeploy');
    mydeploy.updateAddress('Files', deployResult.address, buidler.network.name); // or ethers.getContractAt
    mydeploy.updateAddress('FilesBlock', deployResult.receipt.blockNumber, buidler.network.name); // or ethers.getContractAt
}
module.exports.tags = ['FilesRelayer'];
module.exports.dependencies = ['Files', 'MainPSTRelayer'];
