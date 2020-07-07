const buidler = require("@nomiclabs/buidler");

module.exports = async ({getNamedAccounts, deployments}) => {
    const {deployIfDifferent, log} = deployments;
    const namedAccounts = await getNamedAccounts();
    const {deploy} = deployments;
    const {deployer} = namedAccounts;
    const PST = await deployments.get('PST');
    const deployResult = await deploy('Files', {from: deployer, args: [process.env.PROGRAMMER_ADDRESS, PST.address]});
    if (deployResult.newlyDeployed) {
        const fs = require('fs');
        log(`contract Files deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
    }
    const mydeploy = require('../lib/mydeploy');
    mydeploy.updateAddress('Files', deployResult.address, buidler.network.name); // or ethers.getContractAt
}
module.exports.tags = ['Files'];
module.exports.dependencies = ['PST'];
