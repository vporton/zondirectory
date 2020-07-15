const buidler = require("@nomiclabs/buidler");
//const fs = require('fs');

const {deployIfDifferent, log} = deployments;

function filesJsonInterface() {
    const text = fs.readFileSync("artifacts/Files.json");
    return JSON.parse(text).abi;
}

module.exports = async ({getNamedAccounts, deployments}) => {
    const namedAccounts = await getNamedAccounts();
    const {deploy} = deployments;
    const {deployer} = namedAccounts;
    const Files = await deployments.get('Files');
    log(`Deploying FilesPlus...`);
    const deployResult = await deploy('FilesPlus', {from: deployer, args: [Files.address]});
    if (deployResult.newlyDeployed) {
        log(`contract FilesPlus deployed at ${deployResult.address} in block ${deployResult.receipt.blockNumber} using ${deployResult.receipt.gasUsed} gas`);
    }
    const mydeploy = require('../lib/mydeploy');
    mydeploy.updateAddress('FilesPlus', deployResult.address, buidler.network.name); // or ethers.getContractAt
    mydeploy.updateAddress('FilesPlusBlock', deployResult.receipt.blockNumber, buidler.network.name); // or ethers.getContractAt
}
module.exports.tags = ['FilesPlus'];
module.exports.dependencies = ['Files'];
