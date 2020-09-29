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
    const Files = await deployments.get("Files");
    log(`Deploying BlogTemplates...`);
    const deployResult = await deploy('BlogTemplates', {from: deployer});
    if (deployResult.newlyDeployed) {
        log(`contract BlogTemplates deployed at ${deployResult.address} in block ${deployResult.receipt.blockNumber} using ${deployResult.receipt.gasUsed} gas`);
    }
}
module.exports.tags = ['BlogTemplates'];
module.exports.dependencies = ['Files'];
