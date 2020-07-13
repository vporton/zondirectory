const { expect } = require("chai");
// const Files = artifacts.require("Files");

describe("Files", function() {
  it("Dividends", async function() {
    const Files = await ethers.getContractFactory("Files");
    const files = await Files.deploy(process.env.PROGRAMMER_ADDRESS, 10000000);

    await files.deployed();

    await files.createCategory("Owned category", "en", true);
    await files.createCategory("Unowned category", "en", false);
    await files.createItem("Item 1",
                           "xxx",
                           web3.utils.toWei('2.0'),
                           1, // ignore it
                           'en',
                           'commercial');
  });
});
