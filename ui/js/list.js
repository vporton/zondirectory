async function onLoad() {
    await defaultAccountPromise();
    // TODO: pagination
    query = `{
        itemCreateds {
            itemId
        }
    }`;
    let itemIds = (await queryThegraph(query)).data.itemCreateds;
    if(!itemIds.length) return;
    const itemIdsFlat = itemIds.map(i => i.itemId);
    function subquery(itemId) {
        return `item${itemId}: itemUpdateds(first:1, orderBy:id, orderDirection:desc, where:{itemId:${itemId}}) {
    itemId
    title
    priceETH
    priceAR
}`
    }
    query = "{\n" + itemIdsFlat.map(i => subquery(i)).join("\n") + "\n}";
    let items = (await queryThegraph(query)).data;
    const arweave = Arweave.init();
    console.log(items)
    for(let i in items) {
        const item = items[i][0];
        const link = "download.html?id=" + item.itemId;
        const row = `<tr><td><a href="${link}">${safe_tags(item.title)}</a></td><td>${web3.utils.fromWei(item.priceETH)}</td><td>${arweave.ar.winstonToAr(item.priceAR)}</td></tr>`;
        $('#theTable').prepend(row);
    }
}

$(onLoad);