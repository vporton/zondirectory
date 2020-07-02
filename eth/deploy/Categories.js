module.exports = async ({getNamedAccounts, deployments}) => {
    const {deployIfDifferent, log} = deployments;
    const namedAccounts = await getNamedAccounts();
    const {deploy} = deployments;
    const {deployer} = namedAccounts;
    const deployResult = await deploy('Categories', {from: deployer});
    if (deployResult.newlyDeployed) {
        const fs = require('fs');
        fs.writeFileSync('../ui/artifacts/addresses.js', "const categoriesContractAddress = '" + deployResult.address + "';");
        log(`contract Categories deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
    }
}
module.exports.tags = ['Categories'];
