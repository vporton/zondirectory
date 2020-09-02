const buidler = require("@nomiclabs/buidler");
const fs = require('fs');

const {deployIfDifferent, log} = deployments;

module.exports = async ({getNamedAccounts, deployments}) => {
    const namedAccounts = await getNamedAccounts();
    const {deploy} = deployments;
    const {deployer} = namedAccounts;
    const Actual = await deployments.get("MainPST");
    log(`Deploying MainPSTRelayer...`);
    const deployResult = await deploy('MainPSTRelayer', {from: deployer, args: [Actual.address]});
    if (deployResult.newlyDeployed) {
        log(`contract MainPSTRelayer deployed at ${deployResult.address} in block ${deployResult.receipt.blockNumber} using ${deployResult.receipt.gasUsed} gas`);
    }
    const mydeploy = require('../lib/mydeploy');
    mydeploy.updateAddress('MainPST', deployResult.address, buidler.network.name); // or ethers.getContractAt
    mydeploy.updateAddress('MainPSTBlock', deployResult.receipt.blockNumber, buidler.network.name); // or ethers.getContractAt
}
module.exports.tags = ['MainPSTRelayer'];
module.exports.dependencies = ['MainPST'];
