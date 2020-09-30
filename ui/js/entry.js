"strict";

const itemId = numParam('id');

function moreParents() {
    $('#categories > li:hidden:lt(10)').css('display', 'list-item');
}

$(async function() {
    if(itemId) {
        $('#addParent').attr('href', `vote.html?child=${itemId}&dir=for`);

        // TODO: pagination
        const query = `{
    parentsA: childParentVotes(first:1000, orderBy:id, orderDirection:desc, where:{child:${itemId} primary:false}) {
        id
        parent
        value
    }
    parentsB: childParentVotes(first:1000, orderBy:id, orderDirection:desc, where:{child:${itemId} primary:true}) {
        id
        parent
        value
    }
    linkUpdateds(first:1, orderBy:id, orderDirection:desc, where:{linkId:${itemId}}) {
        locale
        title
        shortDescription
        description
        link
    }
}`;
        const queryResult = (await queryThegraph(query)).data;

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
        const parentIDsA = Array.from(parentsA.values()).sort((a, b) => b.value - a.value).map(e => e.parent);
        const parentIDsB = Array.from(parentsB.values()).sort((a, b) => b.value - a.value).map(e => e.parent);
        const parentIDs = parentIDsA.concat(parentIDsB);

        if(parentIDs) {
            function subquery(catId) {
                let query = `
            category${catId}: categoryUpdateds(first:1, orderBy: id, orderDirection:asc, where:{categoryId:${catId}}) {
                title
            }`
                query += `
            spam${catId}: childParentVotes(first:1, orderBy:id, orderDirection:desc, where:{child:${itemId}, parent:${catId}}) {
                value
            }`;
                return query;
            }
            const query2 = "{\n" + parentIDs.map(i => subquery(i)).join("\n") + "\n}";
            let items = parentIDs.length ? (await queryThegraph(query2)).data : [];

            for(let i in parentIDs) {
                const categoryId = parentIDs[i];
                const category = items['category' + categoryId][0];
                if(!category) continue;
                const spamInfo = items['spam' + categoryId][0];
                const spamScore = spamInfo ? formatPriceETH(new web3.utils.BN(spamInfo.value).neg()) : 0;
                const link = "index.html?cat=" + categoryId;
                const voteStr = `<a href='vote.html?child=${itemId}&parent=${categoryId}&dir=for'>👍</a>` +
                    `<a href='vote.html?child=${itemId}&parent=${categoryId}&dir=against'>👎</a>`;
                $('#categories').append(`<li><a href="${link}">${safe_tags(category.title)}</a> (spam score: ${spamScore} ${voteStr})</li>`);
            }
        }
        $('#categories > li:gt(0)').css('display', 'none');

        const item = queryResult.linkUpdateds[0];
        document.getElementById('locale').textContent = item.locale;
        document.getElementById('description').textContent = item.description;
        $('head').append(`<meta name="description" content="${safe_attrs(item.shortDescription)}"/>`);

        $('#link').append(formatLink(item.link, item.title));
        document.getElementById('link').setAttribute('href', item.link);

        displayVideo('my-', item.link);
    }
})