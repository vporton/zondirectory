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
        const contractInstance = new web3.eth.Contract(templatesJsonInterface(), deployResult.address);
        contractInstance.methods.initialize(Files.address)
            .send({from: deployer, gas: '1000000'})
            .on('error', (error) => log(`Error initializing BlogTemplates: ` + error))
            .catch((error) => log(`Error initializing BlogTemplates: ` + error));
        log(`...initialized`);
    }
}
module.exports.tags = ['BlogTemplates'];
module.exports.dependencies = ['Files'];
