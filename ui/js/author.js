async function myBooks() {
    await defaultAccountPromise();
        let query = `{
    setItemOwners(orderBy:id, orderDirection:desc, where:{owner:"${defaultAccount}"}) {
        itemId    
    }
}`;
    let itemIds = (await queryThegraph(query)).data.setItemOwners;
    itemIds = itemIds.filter((x, i, a) => a.indexOf(x) == i); // unique values
    function itemReq(itemId) {
        return `itemUpdateds(first:1, orderBy:itemId, orderDirection:desc, where:{itemId:${itemId}}) {
            itemId
            title
            priceETH
            priceAR
        }`;
    }
    if(!itemIds.length) return;
    query = "{\n" + itemIds.map(itemId => itemReq(itemId)).join("\n") + "\n}";
    let items = (await queryThegraph(query)).data.itemUpdateds;
    for(let i in items) {
        const item = items[i];
        const link = "update.html?id=" + item.itemId;
        const row = `<tr><td><a href="${link}">${safe_tags(item.title)}</a></td><td>${item.priceETH}</td><td>${item.priceAR}</td></tr>`;
        $('#theTable').append(row);
    }
}

$(myBooks);