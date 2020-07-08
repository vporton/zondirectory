const urlParams = new URLSearchParams(window.location.search);
const catId = urlParams.get('cat');

async function onLoad() {
    await defaultAccountPromise();
    // TODO: pagination
    let query;
    if(catId) {
        query = `{
    votes(first:1000, where: {parent: ${catId}}) {
        child
    }
}`;
    } else {
        query = `{
    itemCreateds(first:1000) {
        itemId
    }
}`;
    }
    let itemIds = (await queryThegraph(query)).data[catId ? 'votes' : 'itemCreateds'];
    if(!itemIds.length) return;
    const itemIdsFlat = catId ? itemIds.map(i => i.child) : itemIds.map(i => i.itemId);
    // TODO: Don't request category title if not asked for category votes.
    function subquery(itemId) {
        return `    item${itemId}: itemUpdateds(first:1, orderBy:id, orderDirection:desc, where:{itemId:${itemId}}) {
        itemId # TODO: Superfluous
        title
        priceETH
        priceAR
    }
    spam${itemId}: votes(first:1, orderBy:id, orderDirection:desc, where:{child:${itemId}, parent:${addressSpam}}) {
        value
    }
    category${itemId}: categoryCreateds(first:1, orderBy: id, orderDirection:asc, where:{categoryId:${itemId}}) {
        title
    }`
    }
    query = "{\n" + itemIdsFlat.map(i => subquery(i)).join("\n") + "\n}";
    let items = (await queryThegraph(query)).data;
    // TODO: Sort on spam score.
    for(let i in items) {
        if(!/^category/.test(i)) continue;
        const category = items[i][0];
        if(!category) continue;
        const spamInfo = items[i.replace(/^category/, 'spam')][0];
        const spamScore = spamInfo ? formatPriceETH(spamInfo.value) : 0;
        const link = "index.html?cat=" + i;
        $('#subcategoies').append(`<li><a href="${link}">${safe_tags(category.title)}</a> (spam score: `-spamScore`)</li>`);
    }
    for(let i in items) {
        if(!/^item/.test(i)) continue;
        const item = items[i][0];
        if(!item) continue;
        const spamInfo = items[i.replace(/^item/, 'spam')][0];
        const spamScore = spamInfo ? formatPriceETH(spamInfo.value) : 0;
        const link = "download.html?id=" + item.itemId;
        const row = `<tr><td><a href="${link}">${safe_tags(item.title)}</a></td><td>${formatPriceETH(item.priceETH)}</td><td>${formatPriceAR(item.priceAR)}</td><td>${spamScore}</tr>`;
        $('#theTable').prepend(row);
    }
}

$(onLoad);