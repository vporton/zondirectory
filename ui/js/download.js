"strict";

const INFINITY = (BigInt(1) << BigInt(256)) - BigInt(1);

function formatPrice(price) {
    return price == INFINITY ? "-" : web3.utils.fromWei(price);
}

async function showFiles(withLinks) {
    let query = `itemFilesUpdateds(first:1, orderBy:version, orderDirection:desc, where:{itemId:${itemId}}) {
    version
}`;
    let version = (await queryThegraph(query)).data.itemFilesUpdateds[0].version;
    const fileFields = withLinks ? 'format hash' : 'format';
    query = `itemFilesUpdateds(orderBy:id, orderDirection:asc, where:{itemId:${itemId}, version:${version}}) {
    ${fileFields}
}`;
    const files = (await queryThegraph(query)).data.itemFilesUpdateds;
    for(let i in files) {
        const file = files[i];
        const link = withLinks ? `<li><a href="https://arweave.net/${file.hash}">${safe_tags(file.format)}</a></li>`
                               : `<li>${safe_tags(file.format)}</li>`;
        $(formats).append(link);
    }
}

$(async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    if(itemId) {
        const query = `itemUpdateds(first:1, orderBy:id, orderDirection:desc, where:{itemId:${itemId}}) {
    title
    description
    license
    priceETH
    priceAR
}`;
        let item = (await queryThegraph(query)).data.itemUpdateds[0];
        document.getElementById('title').textContent = item.title;
        document.getElementById('description').textContent = item.description;
        document.getElementById('license').textContent = item.license;
        document.getElementById('priceETH').textContent = formatPrice(item.priceETH);
        document.getElementById('priceAR').textContent = formatPrice(item.priceAR);
        showFiles(item.priceETH == 0 || item.priceAR == 0);
    }
})