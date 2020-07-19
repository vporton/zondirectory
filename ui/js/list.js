const catId = numParam('cat');

async function onLoad() {
    let queryResult0; // TODO: Declare where used.
    if(catId) {
        $('#addParent').attr('href', `vote.html?child=${catId}&dir=for`);
        $('#addChild').attr('href', `vote.html?parent=${catId}&dir=for`);
        $('#addItem').attr('href', `vote.html?parent=${catId}&dir=for`);
        $('#allCategoriesDiv').css('display', 'none');
    } else {
        $('#categoryInfo').css('display', 'none');
        $('#ownedSubcategoriesDiv').css('display', 'none');
        $('#spamScoreTH').css('display', 'none');
        $('#addItem').css('display', 'none');
    }
    await defaultAccountPromise();
    // TODO: pagination
    let query;
    if(catId) {
        query = `{
    categoryUpdateds(first:1, orderBy:id, orderDirection:desc, where:{categoryId:${catId}}) {
        owner
        title
    }
}`;
        queryResult0 = (await queryThegraph(query)).data;
        const isOwned = !/^0x0+$/.test(queryResult0.categoryUpdateds[0].owner);
        query = `{
    childParentVotes(first:1000, where:{parent:${catId}}) {
        child
    }
    parentsA: childParentVotes(first:1000, orderBy:id, orderDirection:desc, where:{child:${catId} primary:false}) {
        id
        parent
        value
    }
    parentsB: childParentVotes(first:1000, orderBy:id, orderDirection:desc, where:{child:${catId} primary:true}) {
        id
        parent
        value
    }
    childs: childParentVotes(first:1000, orderBy:id, orderDirection:desc, where:{parent:${catId} primary:${isOwned}}) {
        id
        child
        value
    }
}`;
    } else {
        query = `{
    itemCreateds(first:1000, orderBy:itemId, orderDirection:desc) {
        itemId
    }
    categoryCreateds(first:1000, orderBy:categoryId, orderDirection:desc) {
        categoryId
    }
}`;
    }
    const queryResult = (await queryThegraph(query)).data;

    //const allParents = queryResult.parentsA.concat(queryResult.parentsB);
    let parentsA = new Map();
    let parentsB = new Map();
    for(let i in queryResult.parentsA) {
        const entry = queryResult.parentsA[i];
        if(!parentsA.has(i) || parentsA.get[i].id > entry.id)
            parentsA.set(i, {id: entry.id, parent: entry.parent, value: entry.value})
    }
    for(let i in queryResult.parentsB) {
        const entry = queryResult.parentsB[i];
        if(!parentsB.has(i) || parentsB.get[i].id > entry.id)
            parentsB.set(i, {id: entry.id, parent: entry.parent, value: entry.value})
    }
    let childs = new Map();
    for(let i in queryResult.childs) {
        const entry = queryResult.childs[i];
        if(!childs.has(i) || childs.get[i].id > entry.id)
            childs.set(i, {id: entry.id, child: entry.child, value: entry.value})
    }
    const parentIDsA = Array.from(parentsA.values()).sort((a, b) => b.value - a.value).map(e => e.parent);
    const parentIDsB = Array.from(parentsB.values()).sort((a, b) => b.value - a.value).map(e => e.parent);
    const parentIDs = parentIDsA.concat(parentIDsB);
    const childIDs = Array.from(childs.values()).sort((a, b) => b.value - a.value).map(e => e.child);

    if(queryResult0 && queryResult0.categoryUpdateds && queryResult0.categoryUpdateds[0]) {
        const categoryTitle = queryResult0.categoryUpdateds[0].title;
        $('#catTitle').text(categoryTitle);
    }
    const itemIds = queryResult['itemCreateds'] ? queryResult['itemCreateds'] : [];
    const entryIdsFlat = catId ? parentIDs.concat(childIDs, itemIds.map(i => i.child))
                               : queryResult['itemCreateds'].map(i => i.itemId).concat(queryResult['categoryCreateds'].map(i => i.categoryId));
    if(entryIdsFlat.length) {
        // TODO: Don't request category title if not asked for category votes.
        function subquery(itemId) {
            let query = `    item${itemId}: itemUpdateds(first:1, orderBy:id, orderDirection:desc, where:{itemId:${itemId}}) {
            itemId # TODO: Superfluous
            title
            priceETH
            priceAR
        }
        link${itemId}: linkUpdateds(first:1, orderBy:id, orderDirection:desc, where:{linkId:${itemId}}) {
            linkId # TODO: Superfluous
            title
            link
        }
        categoryCreate${itemId}: categoryCreateds(first:1, orderBy: id, orderDirection:asc, where:{categoryId:${itemId}}) {
            owner
        }
        category${itemId}: categoryUpdateds(first:1, orderBy: id, orderDirection:asc, where:{categoryId:${itemId}}) {
            categoryId # TODO: Superfluous
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
        query = "{\n" + entryIdsFlat.map(i => subquery(i)).join("\n") + "\n}"; // TODO: inefficient
        const items = (await queryThegraph(query)).data;
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
                $(/^0x0+$/.test(items['categoryCreate' + categoryId][0].owner) ? '#subcategories' : '#ownedSubcategories')
                    .append(`<li><a href="${link}">${safe_tags(category.title)}</a> (spam score: ${spamScore} ${voteStr})</li>`);
            }

            $('#supercategories > li:gt(0)').css('display', 'none');
            $('#subcategories > li:gt(9)').css('display', 'none');
        }
        // FIXME: Sort order (item2 before item10!)
        const itemKeys = Object.keys(items).sort((a, b) => a.replace(/[^0-9]/g, "") - b.replace(/[^0-9]/g, "")).reverse();
        for(let i of itemKeys) {
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
        for(let i of itemKeys) {
            if(!/^link/.test(i)) continue;
            const item = items[i][0];
            if(!item) continue;
            const link = "entry.html?id=" + item.linkId;
            let spamScore, voteStr;
            if(catId) {
                const spamInfo = items[i.replace(/^link/, 'spam')][0];
                spamScore = spamInfo ? formatPriceETH(new web3.utils.BN(spamInfo.value).neg()) : 0;
                voteStr = `<a href='vote.html?child=${i.replace(/^link/, "")}&parent=${catId}&dir=for'>👍</a>` +
                    `<a href='vote.html?child=${i.replace(/^link/, "")}&parent=${catId}&dir=against'>👎</a>`;
            }
            const spamInfo = catId ? ` (spam score: ${spamScore} ${voteStr})` : ``;
            const row = `<li><a href="${link}">${safe_tags(item.title)}</a>${spamInfo}</li>`;
            $('#links').prepend(row);
        }
        if(!catId)
            for(let i of itemKeys) {
                if(!/^category[0-9]+/.test(i)) continue;
                const item = items[i][0];
                if(!item) continue;
                const link = "index.html?cat=" + item.categoryId;
                $('#categories').append(`<li><a href="${link}">${safe_tags(item.title)}</a></li>`);
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