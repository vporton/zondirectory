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
    const deployResult = await deploy('BlogTemplates', {from: deployer, proxy: true, gasPrice: ethers.utils.parseUnits('1', 'gwei')});
    if (deployResult.newlyDeployed) {
        log(`contract BlogTemplates deployed at ${deployResult.address} in block ${deployResult.receipt.blockNumber} using ${deployResult.receipt.gasUsed} gas`);
        const contractInstance = new web3.eth.Contract(templatesJsonInterface(), deployResult.address);
        await contractInstance.methods.initialize(Files.address)
            .send({from: deployer, gas: '1000000', gasPrice: ethers.utils.parseUnits('1', 'gwei')})
            .on('error', (error) => log(`Error initializing BlogTemplates: ` + error))
            .catch((error) => log(`Error initializing BlogTemplates: ` + error));
        log(`...initialized`);
    }
    const mydeploy = require('../lib/mydeploy');
    mydeploy.updateAddress('BlogTemplates', deployResult.address, buidler.network.name); // or ethers.getContractAt
    mydeploy.updateAddress('BlogTemplatesBlock', deployResult.receipt.blockNumber, buidler.network.name); // or ethers.getContractAt
}
module.exports.tags = ['BlogTemplates'];
module.exports.dependencies = ['Files'];
