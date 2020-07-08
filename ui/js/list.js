async function onLoad() {
    await defaultAccountPromise();
    // TODO: pagination
    query = `{
        itemCreateds(first:1000) {
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
}
spam${itemId}: votes(first:1, orderBy:id, orderDirection:desc, where:{child:${itemId}, parent:${addressSpam}}) {
    value
}`
    }
    query = "{\n" + itemIdsFlat.map(i => subquery(i)).join("\n") + "\n}";
    let items = (await queryThegraph(query)).data;
    // TODO: Sort on spam score.
    for(let i in items) {
        if(!/^item/.test(i)) continue;
        const item = items[i][0];
        const spamInfo = items[i.replace(/^item/, 'spam')][0];
        const spamScore = spamInfo ? formatPriceETH(spamInfo.value) : 0;
        const link = "download.html?id=" + item.itemId;
        const row = `<tr><td><a href="${link}">${safe_tags(item.title)}</a></td><td>${formatPriceETH(item.priceETH)}</td><td>${formatPriceAR(item.priceAR)}</td><td>${spamScore}</tr>`;
        $('#theTable').prepend(row);
    }
}

$(onLoad);