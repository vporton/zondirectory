const { expect, assert } = require("chai");
// const Files = artifacts.require("Files");

async function extractEvent(response, eventName) {
  const receipt = await((await response).wait());
  return receipt.events.filter(log => log.event == eventName)[0].args
}

function myToWei(n) {
  return ethers.utils.parseEther(String(n));
}

function testApproxEq(a, b, msg) {
  const epsilon = 1 ** -10;
  assert(a/b > 1 - epsilon && a/b < 1 + epsilon, msg);
}

describe("Files", function() {
  it("Dividends", async function() {
    const [deployer, founder, partner, seller, buyer] = await ethers.getSigners();

    const PARTNER_PERCENT = 30;
    const FIRST_PURCHASE = 3.535;
    const SECOND_PURCHASE = 2.335;
    const OWNED_VOTE_AMOUNT = 1.22;
    const UNOWNED_VOTE_AMOUNT = 1.97;

    const Files = await ethers.getContractFactory("Files");
    const files = await Files.deploy(await founder.getAddress(), myToWei(100));
    await files.deployed();

    files.connect(founder).transfer(await partner.getAddress(), myToWei(PARTNER_PERCENT));

    const ownedCategoryId = (await extractEvent(files.connect(seller).createCategory("Owned category", "en", true), 'CategoryCreated')).categoryId;
    const unownedCategoryId = (await extractEvent(files.connect(seller).createCategory("Unowned category", "en", false), 'CategoryCreated')).categoryId;
    const itemId = (await extractEvent(files.connect(seller)
      .createItem("Item 1",
                  "xxx",
                  myToWei(2.0),
                  1, // ignore it
                  'en',
                  'commercial'), 'ItemCreated')).itemId;
    await files.connect(buyer).pay(itemId, {value: myToWei(FIRST_PURCHASE)});
    await files.connect(buyer).voteChildParent(itemId, ownedCategoryId, true, {value: myToWei(OWNED_VOTE_AMOUNT)});
    await files.connect(buyer).voteChildParent(unownedCategoryId, ownedCategoryId, true, {value: myToWei(UNOWNED_VOTE_AMOUNT)});

    // TODO: Test setting fees.
    const totalDividend1 = FIRST_PURCHASE * 0.1 + OWNED_VOTE_AMOUNT * 0.5 + UNOWNED_VOTE_AMOUNT;
    const founderDividend1 = await files.dividendsOwing(await founder.getAddress());
    const expectedFounderDividend1 = totalDividend1 * (100 - PARTNER_PERCENT) / 100;
    testApproxEq(ethers.utils.formatEther(founderDividend1), expectedFounderDividend1, "founder dividend 1");
    await files.connect(founder).withdrawProfit();

    await files.connect(buyer).donate(itemId, {value: myToWei(SECOND_PURCHASE)});
    const totalDividend2 = SECOND_PURCHASE * 0.1;
    const founderDividend2 = await files.dividendsOwing(await founder.getAddress());
    const partnerDividend2 = await files.dividendsOwing(await partner.getAddress());
    const expectedFounderDividend2 = totalDividend2 * (100 - PARTNER_PERCENT) / 100;
    const expectedPartnerDividend2 = (totalDividend1 + totalDividend2) * PARTNER_PERCENT / 100;
    testApproxEq(ethers.utils.formatEther(founderDividend2), expectedFounderDividend2, "founder dividend 2");
    testApproxEq(ethers.utils.formatEther(partnerDividend2), expectedPartnerDividend2, "patner dividend 2");

    await files.connect(founder).withdrawProfit();
    await files.connect(partner).withdrawProfit();
    testApproxEq(await files.dividendsOwing(await founder.getAddress()), 0, "zero dividend");
    testApproxEq(await files.dividendsOwing(await partner.getAddress()), 0, "zero dividend");
  });
});
