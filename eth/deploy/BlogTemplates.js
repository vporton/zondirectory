const buidler = require("hardhat");
const fs = require('fs');

const {deployIfDifferent, log} = deployments;

module.exports = async ({getNamedAccounts, deployments}) => {
    const namedAccounts = await getNamedAccounts();
    const {deploy} = deployments;
    const {deployer} = namedAccounts;
    const Files = await deployments.get("contracts/Files.sol:Files");
    log(`Deploying BlogTemplates...`);
    const deployResult = await deploy('contracts/BlogTemplates.sol:BlogTemplates', {from: deployer, proxy: true});
    if (deployResult.newlyDeployed) {
        log(`contract BlogTemplates deployed at ${deployResult.address} in block ${deployResult.receipt.blockNumber} using ${deployResult.receipt.gasUsed} gas`);
        const contractInstance = await ethers.getContract("contracts/BlogTemplates.sol:BlogTemplates");
        await contractInstance.initialize(deployResult.address);
        log(`...initialized`);
    }
    const mydeploy = require('../lib/mydeploy');
    mydeploy.updateAddress('BlogTemplates', deployResult.address, buidler.network.name); // or ethers.getContractAt
    mydeploy.updateAddress('BlogTemplatesBlock', deployResult.receipt.blockNumber, buidler.network.name); // or ethers.getContractAt
}
module.exports.tags = ['BlogTemplates'];
module.exports.dependencies = ['Files'];
