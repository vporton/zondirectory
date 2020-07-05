usePlugin("@nomiclabs/buidler-waffle");
usePlugin('buidler-deploy');

// This is a sample Buidler task. To learn how to create your own go to
// https://buidler.dev/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.getAddress());
  }
});

task("compile", "Compiles the entire project, building all artifacts", async function(taskArguments, bre, runSuper) {
  await runSuper();
  console.log("Extracting ABIs...");
  const fs = require('fs');
  fs.mkdir('../ui/artifacts', ()=>{});
  const abi = JSON.parse(fs.readFileSync('artifacts/Files.json')).abi;
  fs.writeFileSync('../ui/artifacts/Files.abi', JSON.stringify(abi));
});


// You have to export an object to set up your config
// This object can have the following optional entries:
// defaultNetwork, networks, solc, and paths.
// Go to https://buidler.dev/config/ to learn more
module.exports = {
  // This is a sample solc configuration that specifies which version of solc to use
  solc: {
    version: "0.6.8",
  },
  networks: {
    buidlerevm: {
      accounts: [
        {
          privateKey: '0xe0bb3d8b2933d3d9284a7ba24ff0c3cf86233912cfc75a92901b74c7e9470211',
          balance: '0xf0000000000000000',
        }
      ],
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/1d0c278301fc40f3a8f40f25ae3bd328",
      accounts: [process.env.RINKEBY_PRIVATE_KEY],
    },
  },
  namedAccounts: {
    deployer: {
        default: 0, // here this will by default take the first account as deployer
        //4: '0xffffeffffff', // but for rinkeby it will be a specific address
    },
  },
}
