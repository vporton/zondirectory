const buidler = require("@nomiclabs/buidler");
const fs = require('fs');

const {deployIfDifferent, log} = deployments;

function pstJsonInterface() {
    const text = fs.readFileSync("artifacts/MainPST.json");
    return JSON.parse(text).abi;
}

module.exports = async ({getNamedAccounts, deployments}) => {
    const namedAccounts = await getNamedAccounts();
    const {deploy} = deployments;
    const {deployer} = namedAccounts;
    log(`Deploying MainPST...`);
    const deployResult = await deploy('MainPST', {from: deployer});
    if (deployResult.newlyDeployed) {
        log(`contract MainPST deployed at ${deployResult.address} in block ${deployResult.receipt.blockNumber} using ${deployResult.receipt.gasUsed} gas`);
    }
}
module.exports.tags = ['MainPST'];
