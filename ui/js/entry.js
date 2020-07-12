"strict";

const urlParams = new URLSearchParams(window.location.search);
const itemId = urlParams.get('id');

function moreParents() {
    $('#categories > li:hidden:lt(10)').css('display', 'list-item');
}

$(async function() {
    if(itemId) {
        $('#addParent').attr('href', `vote.html?child=${itemId}&dir=for`);

        // TODO: pagination
        const query = `{
    parents: childParentVotes(first:1000, orderDirection:desc, where:{child:${itemId}}) {
        id
        parent
        value
    }
    linkUpdateds(first:1, orderBy:id, orderDirection:desc, where:{linkId:${itemId}}) {
        locale
        title
        description
        link
    }
}`;
        const queryResult = (await queryThegraph(query)).data;

        let parents = new Map();
        for(let i in queryResult.parents) {
            const entry = queryResult.parents[i];
            if(!parents.has(i) || parents.get[i].id > entry.id)
                parents.set(i, {id: entry.id, parent: entry.parent, value: entry.value})
        }
        const parentIDs = Array.from(parents.values()).sort((a, b) => b.value - a.value).map(e => e.parent);

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
        document.getElementById('title').textContent = item.title;
        document.getElementById('description').textContent = item.description;
        document.getElementById('link').setAttribute('href', item.link);
    }
})