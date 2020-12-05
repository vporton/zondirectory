const buidler = require("@nomiclabs/hardhat");
const fs = require('fs');

const {deployIfDifferent, log} = deployments;

module.exports = async ({getNamedAccounts, deployments}) => {
    const namedAccounts = await getNamedAccounts();
    const {deploy} = deployments;
    const {deployer} = namedAccounts;
    const Files = await deployments.get("Files");
    log(`Deploying BlogTemplates...`);
    const deployResult = await deploy('BlogTemplates', {from: deployer, proxy: true});
    if (deployResult.newlyDeployed) {
        log(`contract BlogTemplates deployed at ${deployResult.address} in block ${deployResult.receipt.blockNumber} using ${deployResult.receipt.gasUsed} gas`);
        const contractInstance = await ethers.getContract("BlogTemplates");
        await contractInstance.methods.initialize(deployResult.address)
            .send({from: deployer, gas: '1000000'})
            .on('error', (error) => log(`Error initializing BlogTemplates: ` + error))
            .catch((error) => log(`Error initializing BlogTemplates: ` + error));
        log(`...initialized`);
    }
    const mydeploy = require('../lib/mydeploy');
    mydeploy.updateAddress('BlogTemplates', deployResult.address, buidler.network.name); // or ethers.getContractAt
    mydeploy.updateAddress('BlogTemplatesBlock', deployResult.receipt.blockNumber, buidler.network.name); // or ethers.getContractAt
}
module.exports.tags = ['BlogTemplates'];
module.exports.dependencies = ['Files'];
