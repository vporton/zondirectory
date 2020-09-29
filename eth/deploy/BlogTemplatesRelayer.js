const buidler = require("@nomiclabs/buidler");
const fs = require('fs');

const {deployIfDifferent, log} = deployments;

function templatesJsonInterface() {
    const text = fs.readFileSync("artifacts/BlogTemplates.json");
    return JSON.parse(text).abi;
}

module.exports = async ({getNamedAccounts, deployments}) => {
    const namedAccounts = await getNamedAccounts();
    const {deploy} = deployments;
    const {deployer} = namedAccounts;
    const Actual = await deployments.get("BlogTemplates");
    log(`Deploying BlogTemplatesRelayer...`);
    const deployResult = await deploy('BlogTemplatesRelayer', {from: deployer, args: [Actual.address, process.env.PROGRAMMER_ADDRESS]});
    if (deployResult.newlyDeployed) {
        log(`contract BlogTemplatesRelayer deployed at ${deployResult.address} in block ${deployResult.receipt.blockNumber} using ${deployResult.receipt.gasUsed} gas`);
        const FilesRelayer = await deployments.get('FilesRelayer');
        const contractInstance = new web3.eth.Contract(templatesJsonInterface(), deployResult.address);
        contractInstance.methods.initialize(FilesRelayer.address)
            .send({from: deployer, gas: '1000000'})
            .on('error', (error) => log(`Error initializing BlogTemplates: ` + error))
            .catch((error) => log(`Error initializing BlogTemplates: ` + error));
        log(`...initialized`);
    }
    const mydeploy = require('../lib/mydeploy');
    mydeploy.updateAddress('BlogTemplates', deployResult.address, buidler.network.name); // or ethers.getContractAt
    mydeploy.updateAddress('BlogTemplatesBlock', deployResult.receipt.blockNumber, buidler.network.name); // or ethers.getContractAt
}
module.exports.tags = ['BlogTemplatesRelayer'];
module.exports.dependencies = ['BlogTemplates', 'FilesRelayer'];
