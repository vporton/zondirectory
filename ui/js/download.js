"strict";

const INFINITY = (BigInt(1) << BigInt(256)) - BigInt(1);

function formatPrice(price) {
    return price == INFINITY ? "-" : web3.utils.fromWei(price);
}

$(async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    if(itemId) {
        const query = `itemUpdateds(first:1, orderBy:itemId, orderDirection:desc, where:{itemId:${itemId}}) {
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
    }

})