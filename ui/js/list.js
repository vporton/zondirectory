async function onLoad() {
    await defaultAccountPromise();
    // TODO: pagination
    const query = `{
    itemUpdateds(first:1000, orderBy:itemId, orderDirection:desc}) {
        itemId
        title
        priceETH
        priceAR
    }
}`;
    let items = (await queryThegraph(query)).data.itemUpdateds;
    for(let i in items) {
        const item = items[i];
        const link = "download.html?id=" + item.itemId;
        const row = `<tr><td><a href="${link}">${safe_tags(item.title)}</a></td><td>${item.priceETH}</td><td>${item.priceAR}</td></tr>`;
        $('#theTable').append(row);
    }
}

$(onLoad);