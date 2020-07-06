module.exports = async ({getNamedAccounts, deployments}) => {
    const {deployIfDifferent, log} = deployments;
    const namedAccounts = await getNamedAccounts();
    const {deploy} = deployments;
    const {deployer} = namedAccounts;
    const deployResult = await deploy('PST', {from: deployer, args: [process.env.PROGRAMMER_ADDRESS, 10000000]});
    if (deployResult.newlyDeployed) {
        log(`contract PST deployed at ${deployResult.address} using ${deployResult.receipt.gasUsed} gas`);
    }
}
module.exports.tags = ['PST'];
