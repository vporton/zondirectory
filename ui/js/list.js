const urlParams = new URLSearchParams(window.location.search);
const catId = urlParams.get('cat');

async function onLoad() {
    if(catId) {
        $('#addParent').attr('href', `vote.html?child=${catId}&dir=for`);
        $('#addChild').attr('href', `vote.html?parent=${catId}&dir=for`);
        $('#addItem').attr('href', `vote.html?parent=${catId}&dir=for`);
    } else {
        $('#categoryInfo').css('display', 'none');
        $('#spamScoreTH').css('display', 'none');
        $('#addItem').css('display', 'none');
    }
    await defaultAccountPromise();
    // TODO: pagination
    let query;
    if(catId) {
        query = `{
    categoryCreateds(first:1, where:{categoryId:${catId}}) {
        title
    }
    childParentVotes(first:1000, where:{parent:${catId}}) {
        child
    }
    parents: childParentVotes(first:1000, orderDirection:desc, where:{child:${catId}}) {
        id
        parent
        value
    }
    childs: childParentVotes(first:1000, orderDirection:desc, where:{parent:${catId}}) {
        id
        child
        value
    }
}`;
    } else {
        query = `{
    itemCreateds(first:1000) {
        itemId
    }
}`;
    }
    const queryResult = (await queryThegraph(query)).data;

    let parents = new Map();
    for(let i in queryResult.parents) {
        const entry = queryResult.parents[i];
        if(!parents.has(i) || parents.get[i].id > entry.id)
            parents.set(i, {id: entry.id, parent: entry.parent, value: entry.value})
    }
    let childs = new Map();
    for(let i in queryResult.childs) {
        const entry = queryResult.childs[i];
        if(!childs.has(i) || childs.get[i].id > entry.id)
            childs.set(i, {id: entry.id, child: entry.child, value: entry.value})
    }
    const parentIDs = Array.from(parents.values()).sort((a, b) => b.value - a.value).map(e => e.parent);
    const childIDs = Array.from(childs.values()).sort((a, b) => b.value - a.value).map(e => e.child);

    if(queryResult.categoryCreateds) {
        const categoryTitle = queryResult.categoryCreateds[0].title;
        $('#catTitle').text(categoryTitle);
    }
    const itemIds = queryResult['itemCreateds'] ? queryResult['itemCreateds'][0] : [];
    const entryIdsFlat = catId ? parentIDs.concat(childIDs, itemIds.map(i => i.child))
                              : itemIds.map(i => i.itemId);
    if(entryIdsFlat.length) {
        // TODO: Don't request category title if not asked for category votes.
        function subquery(itemId) {
            let query = `    item${itemId}: itemUpdateds(first:1, orderBy:id, orderDirection:desc, where:{itemId:${itemId}}) {
            itemId # TODO: Superfluous
            title
            priceETH
            priceAR
        }
        category${itemId}: categoryCreateds(first:1, orderBy: id, orderDirection:asc, where:{categoryId:${itemId}}) {
            title
        }`
            if(catId) {
                // TODO: rspam seems sometimes unnecessary.
                query += `
                spam${itemId}: childParentVotes(first:1, orderBy:id, orderDirection:desc, where:{child:${itemId}, parent:${catId}}) {
                    value
                }
                rspam${itemId}: childParentVotes(first:1, orderBy:id, orderDirection:desc, where:{parent:${itemId}, child:${catId}}) {
                    value
                }`;
            }
            return query;
        }
        query = "{\n" + entryIdsFlat.map(i => subquery(i)).join("\n") + "\n}";
        let items = (await queryThegraph(query)).data;
        if(catId) {
            for(let i in parentIDs) {
                const categoryId = parentIDs[i];
                const category = items['category' + categoryId][0];
                if(!category) continue;
                const spamInfo = items['rspam' + categoryId][0];
                const spamScore = spamInfo ? formatPriceETH(new web3.utils.BN(spamInfo.value).neg()) : 0;
                const link = "index.html?cat=" + categoryId;
                const voteStr = `<a href='vote.html?child=${catId}&parent=${categoryId}&dir=for'>👍</a>` +
                    `<a href='vote.html?child=${catId}&parent=${categoryId}&dir=against'>👎</a>`;
                $('#supercategories').append(`<li><a href="${link}">${safe_tags(category.title)}</a> (spam score: ${spamScore} ${voteStr})</li>`);
            }
            for(let i in childIDs) {
                const categoryId = childIDs[i];
                const category = items['category' + categoryId][0];
                if(!category) continue;
                const spamInfo = items['spam' + categoryId][0];
                const spamScore = spamInfo ? formatPriceETH(new web3.utils.BN(spamInfo.value).neg()) : 0;
                const link = "index.html?cat=" + categoryId;
                const voteStr = `<a href='vote.html?child=${categoryId}&parent=${catId}&dir=for'>👍</a>` +
                    `<a href='vote.html?child=${categoryId}&parent=${catId}&dir=against'>👎</a>`;
                $('#subcategories').append(`<li><a href="${link}">${safe_tags(category.title)}</a> (spam score: ${spamScore} ${voteStr})</li>`);
            }
    
            $('#supercategories > li:gt(0)').css('display', 'none');
            $('#subcategories > li:gt(9)').css('display', 'none');
                }
        for(let i in items) {
            if(!/^item/.test(i)) continue;
            const item = items[i][0];
            if(!item) continue;
            const link = "download.html?id=" + item.itemId;
            if(catId) {
                const spamInfo = items[i.replace(/^item/, 'spam')][0];
                const spamScore = spamInfo ? formatPriceETH(new web3.utils.BN(spamInfo.value).neg()) : 0;
                const voteStr = `<a href='vote.html?child=${i.replace(/^item/, "")}&parent=${catId}&dir=for'>👍</a>` +
                    `<a href='vote.html?child=${i.replace(/^item/, "")}&parent=${catId}&dir=against'>👎</a>`;
                const row = `<tr><td><a href="${link}">${safe_tags(item.title)}</a></td><td>${formatPriceETH(item.priceETH)}</td><td>${formatPriceAR(item.priceAR)}</td><td>${spamScore} ${voteStr}</tr>`;
                $('#theTable').prepend(row);
            } else {
                const row = `<tr><td><a href="${link}">${safe_tags(item.title)}</a></td><td>${formatPriceETH(item.priceETH)}</td><td>${formatPriceAR(item.priceAR)}</td>`;
                $('#theTable').prepend(row);
            }
        }
    }
}

function moreParents() {
    $('#supercategories > li:hidden:lt(10)').css('display', 'list-item');
}

function moreChilds() {
    $('#subcategories > li:hidden:lt(10)').css('display', 'list-item');
}

$(onLoad);