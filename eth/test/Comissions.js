const { expect, assert } = require("chai");

async function extractEvent(response, eventName) {
  const receipt = await((await response).wait());
  return receipt.events.filter(log => log.event == eventName)[0].args
}

function myToWei(n) {
  return ethers.utils.parseEther(String(n));
}

function testApproxEq(a, b, msg) {
  const epsilon = 10 ** (-10);
  assert(a/b > 1 - epsilon && a/b < 1 + epsilon, `${a} ~ ${b}: ${msg}`);
}

describe("Comissions", function() {
  it("Dividends", async function() {
    const {deploy} = deployments;
    const [deployer, founder, partner, seller, seller2, buyer, buyer2, affiliate] = await ethers.getSigners();

    const PARTNER_PERCENT = 30;
    const FIRST_PURCHASE = 3.535;
    const SECOND_PURCHASE = 2.335;

    await deploy("contracts/Files.sol:Files", {from: await founder.getAddress()});
    const files = await ethers.getContract("contracts/Files.sol:Files");

    // files.connect(founder).send(await partner.getAddress(), myToWei(PARTNER_PERCENT));
    await founder.sendTransaction({to: await partner.getAddress(), value: myToWei(PARTNER_PERCENT)}); // FIXME

    const ownedCategoryId = (await extractEvent(files.connect(seller).createOwnedCategory({title: "Owned category", locale: "en", shortDescription: "", description: ""}, '0x0000000000000000000000000000000000000001'), 'CategoryCreated')).categoryId;
    const unownedCategoryId = (await extractEvent(files.connect(seller).createCategory("Unowned category", "en", '0x0000000000000000000000000000000000000001'), 'CategoryCreated')).categoryId;
    const itemId = (await extractEvent(files.connect(seller)
      .createItem({title: "Item 1",
                   shortDescription: "xxx",
                   description: "",
                   priceETH: myToWei(2.0),
                   priceAR: 1, // ignore it
                   locale: 'en',
                   license: 'commercial'},
                  '0x0000000000000000000000000000000000000001'), 'ItemCreated')).itemId;

    files.connect(founder).setBuyerAffiliateShare(0);
    files.connect(founder).setSellerAffiliateShare(0);

    const salesOwnersShare = await files.salesOwnersShare() / 2**64;
    const upvotesOwnersShare = await files.upvotesOwnersShare() / 2**64;
    const buyerAffiliateShare = await files.buyerAffiliateShare() / 2**64;
    const sellerAffiliateShare = await files.sellerAffiliateShare() / 2**64;

    // Test affiliates
    const itemId2 = (await extractEvent(files.connect(seller2)
      .createItem({title: "Item 2",
                   shortDescription: "xxx",
                   description: "",
                   priceETH: myToWei(2.0),
                   priceAR: 1, // ignore it
                   locale: 'en',
                   license: 'commercial'},
                   await affiliate.getAddress()), 'ItemCreated')).itemId;
    await files.connect(buyer2).pay(itemId2, await affiliate.getAddress(), {value: myToWei(FIRST_PURCHASE)});
    await files.connect(buyer2).donate(itemId2, '0x0000000000000000000000000000000000000001', {value: myToWei(SECOND_PURCHASE)});
    await files.connect(buyer).donate(itemId2, '0x0000000000000000000000000000000000000001', {value: myToWei(SECOND_PURCHASE)});
    const expectedPartnerDividentWithoutAffiliate =
      salesOwnersShare * (FIRST_PURCHASE + SECOND_PURCHASE * 2) * PARTNER_PERCENT / 100;
    const partnerDividentWithoutAffiliate = await files.dividendsOwing(await partner.getAddress());
    testApproxEq(ethers.utils.formatEther(partnerDividentWithoutAffiliate), expectedPartnerDividentWithoutAffiliate, "divident minus affiliate");
  });
});
