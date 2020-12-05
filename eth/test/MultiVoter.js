const { expect, assert } = require("chai");
// const Files = artifacts.require("Files");

async function extractEvent(response, eventName) {
  const receipt = await((await response).wait());
  return receipt.events.filter(log => log.event == eventName)[0].args
}

function myToWei(n) {
  return ethers.utils.parseEther(String(n));
}

// function testApproxEq(a, b, msg) {
//   const epsilon = 10 ** -10;
//   assert(a/b > 1 - epsilon && a/b < 1 + epsilon, `${a} ~ ${b}: ${msg}`);
// }

describe("MultiVoter", function() {
  it("Categories", async function() {
    const {deploy} = deployments;
    const [deployer, founder, partner, seller, seller2, buyer, buyer2, affiliate] = await ethers.getSigners();

    // const PARTNER_PERCENT = 30;
    // const FIRST_PURCHASE = 3.535;
    // const SECOND_PURCHASE = 2.335;
    // const OWNED_VOTE_AMOUNT = 1.22;
    // const UNOWNED_VOTE_AMOUNT = 1.97;
    // const MYOWN_VOTE_AMOUNT = 2.11;

    await deploy("contracts/Files.sol:Files", {from: await founder.getAddress()});
    const files = await ethers.getContract("contracts/Files.sol:Files");

    const ownedCategoryId = (await extractEvent(files.connect(seller).createOwnedCategory({title: "Owned category", locale: "en", shortDescription: "", description: ""}, '0x0000000000000000000000000000000000000001'), 'CategoryCreated')).categoryId;
    const unownedCategoryId = (await extractEvent(files.connect(seller).createCategory("Unowned category", "en", '0x0000000000000000000000000000000000000001'), 'CategoryCreated')).categoryId;
    await files.connect(seller).createOwnedCategoryAndVote({title: "XXX", locale: "en", shortDescription: "", description: ""}, '0x0000000000000000000000000000000000000001', [ownedCategoryId, unownedCategoryId], [myToWei(0.1), myToWei(0.1)], {value: myToWei(0.2)});
  });
});
