const { expect } = require("chai");
// const Files = artifacts.require("Files");

async function extractEvent(response, eventName) {
  const receipt = await((await response).wait());
  return receipt.events.filter(log => log.event == eventName)[0].args
}

describe("Files", function() {
  it("Dividends", async function() {
    const [deployer, founder, partner, seller, buyer] = await ethers.getSigners();

    const Files = await ethers.getContractFactory("Files");
    const files = await Files.deploy(process.env.PROGRAMMER_ADDRESS, 10000000);
    await files.deployed();

    const ownedCategoryId = (await extractEvent(files.connect(seller).createCategory("Owned category", "en", true), 'CategoryCreated')).categoryId;
    const unownedCategoryId = (await extractEvent(files.connect(seller).createCategory("Unowned category", "en", false), 'CategoryCreated')).categoryId;
    const itemId = (await extractEvent(files.connect(seller)
      .createItem("Item 1",
                  "xxx",
                  web3.utils.toWei('2.0'),
                  1, // ignore it
                  'en',
                  'commercial'), 'ItemCreated')).itemId;
    await files.connect(buyer).pay(itemId, {value: web3.utils.toWei('3.0')})
  });
});
