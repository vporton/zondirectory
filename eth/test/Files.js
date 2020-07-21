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
  assert(a/b > 1 - epsilon && a/b < 1 + epsilon, `${a} ~ ${b}: ${msg}`);
}

describe("Files", function() {
  it("Dividends", async function() {
    const [deployer, founder, partner, seller, seller2, buyer, buyer2, affiliate] = await ethers.getSigners();

    const PARTNER_PERCENT = 30;
    const FIRST_PURCHASE = 3.535;
    const SECOND_PURCHASE = 2.335;
    const OWNED_VOTE_AMOUNT = 1.22;
    const UNOWNED_VOTE_AMOUNT = 1.97;
    const MYOWN_VOTE_AMOUNT = 2.11;

    const Files = await ethers.getContractFactory("Files");
    const files = await Files.deploy(await founder.getAddress(), myToWei(100));
    await files.deployed();

    files.connect(founder).transfer(await partner.getAddress(), myToWei(PARTNER_PERCENT));

    const ownedCategoryId = (await extractEvent(files.connect(seller).createCategory("Owned category", "en", true, '0x0000000000000000000000000000000000000000'), 'CategoryCreated')).categoryId;
    const unownedCategoryId = (await extractEvent(files.connect(seller).createCategory("Unowned category", "en", false, '0x0000000000000000000000000000000000000000'), 'CategoryCreated')).categoryId;
    const itemId = (await extractEvent(files.connect(seller)
      .createItem(["Item 1",
                   "xxx",
                   myToWei(2.0),
                   1, // ignore it
                   'en',
                   'commercial'],
                  '0x0000000000000000000000000000000000000000'), 'ItemCreated')).itemId;
    await files.connect(buyer).pay(itemId, '0x0000000000000000000000000000000000000000', {value: myToWei(FIRST_PURCHASE)});
    await files.connect(buyer).voteChildParent(itemId, ownedCategoryId, true, '0x0000000000000000000000000000000000000000', {value: myToWei(OWNED_VOTE_AMOUNT)});
    await files.connect(buyer).voteChildParent(unownedCategoryId, ownedCategoryId, true, '0x0000000000000000000000000000000000000000', {value: myToWei(UNOWNED_VOTE_AMOUNT)});

    const salesOwnersShare = await files.salesOwnersShare() / 2**64;
    const upvotesOwnersShare = await files.upvotesOwnersShare() / 2**64;
    const buyerAffiliateShare = await files.buyerAffiliateShare() / 2**64;
    const sellerAffiliateShare = await files.sellerAffiliateShare() / 2**64;

    // TODO: Test setting fees.
    const totalDividend1 = FIRST_PURCHASE * salesOwnersShare + OWNED_VOTE_AMOUNT * upvotesOwnersShare + UNOWNED_VOTE_AMOUNT;
    const founderDividend1 = await files.dividendsOwing(await founder.getAddress());
    const expectedFounderDividend1 = totalDividend1 * (100 - PARTNER_PERCENT) / 100;
    testApproxEq(ethers.utils.formatEther(founderDividend1), expectedFounderDividend1, "founder dividend 1");
    await files.connect(founder).withdrawProfit();

    await files.connect(buyer).donate(itemId, '0x0000000000000000000000000000000000000000', {value: myToWei(SECOND_PURCHASE)});
    const totalDividend2 = SECOND_PURCHASE * salesOwnersShare + totalDividend1 * PARTNER_PERCENT / 100;
    const founderDividend2 = await files.dividendsOwing(await founder.getAddress());
    const partnerDividend2 = await files.dividendsOwing(await partner.getAddress());
    const expectedFounderDividend2 = totalDividend2 * (100 - PARTNER_PERCENT) / 100;
    const expectedPartnerDividend2 = (totalDividend1 + totalDividend2) * PARTNER_PERCENT / 100;
    testApproxEq(ethers.utils.formatEther(founderDividend2), expectedFounderDividend2, "founder dividend 2");
    testApproxEq(ethers.utils.formatEther(partnerDividend2), expectedPartnerDividend2, "patner dividend 2");

    await files.connect(founder).withdrawProfit();
    await files.connect(partner).withdrawProfit();
    expect(await files.dividendsOwing(await founder.getAddress())).to.equal(0);
    expect(await files.dividendsOwing(await partner.getAddress())).to.equal(0);

    // More voting tests:
    await files.connect(seller).voteForOwnChild(itemId, ownedCategoryId, {value: myToWei(MYOWN_VOTE_AMOUNT)});
    const amountVoted = await files.getChildParentVotes(itemId, ownedCategoryId);
    testApproxEq(ethers.utils.formatEther(amountVoted), OWNED_VOTE_AMOUNT + MYOWN_VOTE_AMOUNT * 2.0);

    await files.connect(founder).withdrawProfit();
    await files.connect(partner).withdrawProfit();

    // Test affiliates
    const itemId2 = (await extractEvent(files.connect(seller2)
      .createItem(["Item 2",
                   "xxx",
                   myToWei(2.0),
                   1, // ignore it
                   'en',
                   'commercial'],
                   await affiliate.getAddress()), 'ItemCreated')).itemId;
    await files.connect(buyer2).pay(itemId2, await affiliate.getAddress(), {value: myToWei(FIRST_PURCHASE)});
    await files.connect(buyer2).donate(itemId2, '0x0000000000000000000000000000000000000000', {value: myToWei(SECOND_PURCHASE)});
    const expectedPartnerDividentWithoutAffiliate =
      (FIRST_PURCHASE + SECOND_PURCHASE) * salesOwnersShare * (1 - buyerAffiliateShare - sellerAffiliateShare) * PARTNER_PERCENT / 100;
    const partnerDividentWithoutAffiliate = await files.dividendsOwing(await partner.getAddress());
    testApproxEq(ethers.utils.formatEther(partnerDividentWithoutAffiliate), expectedPartnerDividentWithoutAffiliate, "divident minus affiliate");
  });
});
