"strict";

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
        //$('#ownedSubcategoriesDiv').css('display', 'none');
        $('#spamScoreTH').css('display', 'none');
        $('#addItem').css('display', 'none');
    }
    await defaultAccountPromise();
    // TODO: pagination
    let query;
    if(catId) {
        query = `{
    categoryUpdateds(first:1, orderBy:id, orderDirection:desc, where:{categoryId:${catId}}) {
        title
    }
    ownedCategoryUpdateds(first:1, orderBy:id, orderDirection:desc, where:{categoryId:${catId}}) {
        title
        shortDescription
        description
    }
}`;
        queryResult0 = (await queryThegraph(query)).data;
        const isOwned = queryResult0.ownedCategoryUpdateds.length != 0;
        if(isOwned) {
            $('#showDescription').css('display', 'block');
            $('#description').text(queryResult0.ownedCategoryUpdateds[0].description);
            $('head').append(`<meta name="description" content="Category: ${safe_attrs(queryResult0.ownedCategoryUpdateds[0].shortDescription)}"/>`);
        } else {
            $('head').append(`<meta name="description" content="Category of news, files, items for sale - earn money at this site"/>`);
        }
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
        if(!parentsA.has(entry.parent) || parentsA.get(entry.parent).id > entry.id)
            parentsA.set(entry.parent, {id: entry.id, parent: entry.parent, value: entry.value})
    }
    for(let i in queryResult.parentsB) {
        const entry = queryResult.parentsB[i];
        if(!parentsB.has(entry.parent) || parentsB.get(entry.parent).id > entry.id)
            parentsB.set(entry.parent, {id: entry.id, parent: entry.parent, value: entry.value})
    }
    let childs = new Map();
    for(let i in queryResult.childs) {
        const entry = queryResult.childs[i];
        if(!childs.has(entry.child) || childs.get(entry.child).id > entry.id)
            childs.set(entry.child, {id: entry.id, child: entry.child, value: entry.value})
    }
    const parentIDsA = Array.from(parentsA.values()).sort((a, b) => a.value - b.value).map(e => e.parent);
    const parentIDsB = Array.from(parentsB.values()).sort((a, b) => a.value - b.value).map(e => e.parent);
    const parentIDs = parentIDsA.concat(parentIDsB);
    const childIDs = Array.from(childs.values()).sort((a, b) => a.value - b.value).map(e => e.child);

    if(queryResult0 && queryResult0.categoryUpdateds && queryResult0.categoryUpdateds[0]) {
        const categoryTitle = queryResult0.categoryUpdateds[0].title;
        $('#catTitle').text(categoryTitle);
    }
    if(queryResult0 && queryResult0.ownedCategoryUpdateds && queryResult0.ownedCategoryUpdateds[0]) {
        const categoryTitle = queryResult0.ownedCategoryUpdateds[0].title;
        $('#catTitle').text(categoryTitle);
    }
    const itemIds = queryResult['itemCreateds'] ? queryResult['itemCreateds'] : [];
    const entryIdsFlat = catId ? parentIDs.concat(childIDs, itemIds.map(i => i.child))
                               : queryResult['itemCreateds'].map(i => i.itemId)
                                 .concat(queryResult['categoryCreateds'].map(i => i.categoryId));
    if(entryIdsFlat.length) {
        // TODO: Don't request category title if not asked for category votes.
        function subquery(itemId) {
            let query = `    item${itemId}: itemUpdateds(first:1, orderBy:id, orderDirection:desc, where:{itemId:${itemId}}) {
            itemId # TODO: Superfluous
            title
            priceETH
        }
        link${itemId}: linkUpdateds(first:1, orderBy:id, orderDirection:desc, where:{linkId:${itemId}}) {
            linkId # TODO: Superfluous
            title
            shortDescription
            link
        }
        categoryCreate${itemId}: categoryCreateds(first:1, orderBy:id, orderDirection:desc, where:{categoryId:${itemId}}) {
            author
        }
        category${itemId}: categoryUpdateds(first:1, orderBy:id, orderDirection:desc, where:{categoryId:${itemId}}) {
            categoryId # TODO: Superfluous
            title
        }
        ownedCategory${itemId}: ownedCategoryUpdateds(first:1, orderBy:id, orderDirection:desc, where:{categoryId:${itemId}}) {
            categoryId # TODO: Superfluous
            title
            shortDescription
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
                const link = "category.html?cat=" + categoryId;
                const voteStr = `<a href='vote.html?child=${catId}&parent=${categoryId}&dir=for'>👍</a>` +
                    `<a href='vote.html?child=${catId}&parent=${categoryId}&dir=against'>👎</a>`;
                $('#supercategories').append(`<li><a href="${link}">${safe_tags(category.title)}</a> (spam score: ${spamScore} ${voteStr})</li>`);
            }
            for(let i in childIDs) {
                const categoryId = childIDs[i];
                let category = items['category' + categoryId][0];
                if(!category) category = items['ownedCategory' + categoryId][0];
                if(!category) continue;
                const spamInfo = items['spam' + categoryId][0];
                const spamScore = spamInfo ? formatPriceETH(new web3.utils.BN(spamInfo.value).neg()) : 0;
                const link = "category.html?cat=" + categoryId;
                const voteStr = `<a href='vote.html?child=${categoryId}&parent=${catId}&dir=for'>👍</a>` +
                    `<a href='vote.html?child=${categoryId}&parent=${catId}&dir=against'>👎</a>`;
                if(items['ownedCategory' + categoryId][0])
                    $('#ownedSubcategories')
                        .append(`<li><a href="${link}">${safe_tags(category.title)}</a>. ${safe_tags(category.shortDescription)} (spam score: ${spamScore} ${voteStr})</li>`);
                else
                    $('#subcategories')
                        .append(`<li><a href="${link}">${safe_tags(category.title)}</a> (spam score: ${spamScore} ${voteStr})</li>`);
            }

            $('#supercategories > li:gt(0)').css('display', 'none');
            $('#subcategories > li:gt(9)').css('display', 'none');
        }
        const itemKeys = Object.keys(items).sort((a, b) => b.replace(/[^0-9]/g, "") - a.replace(/[^0-9]/g, ""));
        for(let i of itemKeys) {
            if(!/^item/.test(i)) continue;
            const item = items[i][0];
            if(!item) continue;
            const link = "download.html?id=" + item.itemId;
            const itemWidget = $('#item').clone(true);
            itemWidget.removeClass('hidden');
            itemWidget.find('.title').text(item.title);
            itemWidget.find('.link').each(function() { this.setAttribute('href', link); });
            itemWidget.find('.priceETH').text(formatPriceETH(item.priceETH));
            if(catId) {
                const spamInfo = items[i.replace(/^item/, 'spam')][0];
                const spamScore = spamInfo ? formatPriceETH(new web3.utils.BN(spamInfo.value).neg()) : 0;
                const voteStr = `<a href='vote.html?child=${i.replace(/^item/, "")}&parent=${catId}&dir=for'>👍</a>` +
                    `<a href='vote.html?child=${i.replace(/^item/, "")}&parent=${catId}&dir=against'>👎</a>`;
                itemWidget.find('.voteStr').html(`Spam score: ${spamScore} ${voteStr}`);
            }
            $('#items').append(itemWidget);
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
            const linkText = `<a href="${link}">${safe_tags(item.title)}</a>`;
            const row = `<li><strong>${linkText}.</strong> ${safe_tags(item.shortDescription)} ${spamInfo}</li>`;
            $('#links').append(row);
            const li = $('#links>*').last();
            li.append($('#audio-video>*').clone());
            li.find('video').attr('id', `item-${item.linkId}-video`);
            li.find('audio').attr('id', `item-${item.linkId}-audio`);
            displayVideo(`item-${item.linkId}-`, item.link);
        }
        if(!catId) {
            for(let i of itemKeys) {
                if(!/^category[0-9]+/.test(i)) continue;
                const item = items[i][0];
                if(!item) continue;
                const link = "category.html?cat=" + item.categoryId;
                $('#categories').append(`<li><a href="${link}">${safe_tags(item.title)}</a></li>`);
            }
            for(let i of itemKeys) {
                if(!/^ownedCategory[0-9]+/.test(i)) continue;
                const item = items[i][0];
                if(!item) continue;
                const link = "category.html?cat=" + item.categoryId;
                $('#ownedSubcategories').append(`<li><a href="${link}">${safe_tags(item.title)}</a></li>`);
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

window.addEventListener('load', onLoad); // FIXME