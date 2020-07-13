const { expect } = require("chai");
// const Files = artifacts.require("Files");

describe("Files", function() {
  it("Dividends", async function() {
    const Files = await ethers.getContractFactory("Files");
    const files = await Files.deploy(process.env.PROGRAMMER_ADDRESS, 10000000);
    
    await files.deployed();
  });
});
