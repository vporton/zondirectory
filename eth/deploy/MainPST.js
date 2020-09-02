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
        const contractInstance = new web3.eth.Contract(pstJsonInterface(), deployResult.address);
        contractInstance.methods.initialize(process.env.PROGRAMMER_ADDRESS, web3.utils.toWei('10000'))
            .send({from: deployer, gas: '1000000'})
            .on('error', (error) => log(`Error initializing: ` + error))
            .catch((error) => log(`Error initializing: ` + error));
        log(`...initialized`);
    }
    const mydeploy = require('../lib/mydeploy');
    mydeploy.updateAddress('MainPST', deployResult.address, buidler.network.name); // or ethers.getContractAt
    mydeploy.updateAddress('MainPSTBlock', deployResult.receipt.blockNumber, buidler.network.name); // or ethers.getContractAt
}
module.exports.tags = ['MainPST'];
