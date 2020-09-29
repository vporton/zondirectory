const buidler = require("@nomiclabs/buidler");
const fs = require('fs');

const {deployIfDifferent, log} = deployments;

module.exports = async ({getNamedAccounts, deployments}) => {
    const namedAccounts = await getNamedAccounts();
    const {deploy} = deployments;
    const {deployer} = namedAccounts;
    const Actual = await deployments.get("Files");
    log(`Deploying FilesRelayer...`);
    const deployResult = await deploy('FilesRelayer', {from: deployer, args: [Actual.address, process.env.PROGRAMMER_ADDRESS]});
    if (deployResult.newlyDeployed) {
        log(`contract FilesRelayer deployed at ${deployResult.address} in block ${deployResult.receipt.blockNumber} using ${deployResult.receipt.gasUsed} gas`);
    }
    const mydeploy = require('../lib/mydeploy');
    mydeploy.updateAddress('Files', deployResult.address, buidler.network.name); // or ethers.getContractAt
    mydeploy.updateAddress('FilesBlock', deployResult.receipt.blockNumber, buidler.network.name); // or ethers.getContractAt
}
module.exports.tags = ['FilesRelayer'];
module.exports.dependencies = ['Files'];
