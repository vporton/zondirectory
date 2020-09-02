const buidler = require("@nomiclabs/buidler");
const fs = require('fs');

const {deployIfDifferent, log} = deployments;

module.exports = async ({getNamedAccounts, deployments}) => {
    const namedAccounts = await getNamedAccounts();
    const {deploy} = deployments;
    const {deployer} = namedAccounts;
    const MainPST = await deployments.get("MainPST");
    log(`Deploying MainPST...`);
    const deployResult = await deploy('MainPST', {from: deployer, args: [process.env.PROGRAMMER_ADDRESS, web3.utils.toWei('10000')]});
    if (deployResult.newlyDeployed) {
        log(`contract MainPST deployed at ${deployResult.address} in block ${deployResult.receipt.blockNumber} using ${deployResult.receipt.gasUsed} gas`);
    }
    const mydeploy = require('../lib/mydeploy');
    mydeploy.updateAddress('MainPST', deployResult.address, buidler.network.name); // or ethers.getContractAt
    mydeploy.updateAddress('MainPSTBlock', deployResult.receipt.blockNumber, buidler.network.name); // or ethers.getContractAt
}
module.exports.tags = ['MainPST'];
