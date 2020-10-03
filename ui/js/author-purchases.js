"strict";

async function onLoad() {
    if(!window.web3) return;
    await defaultAccountPromise();
    if(!defaultAccount) return;

    const query = `{
        pays(orderBy:id, orderDirection:desc, where:{payee:"${defaultAccount}"}) {
            itemId
            paid
            price
            toAuthor
            shippingInfo
        }
    }`;
    let pays = (await queryThegraph(query)).data.pays;
    if(!pays.length) return;
    for(payment of pays) {
        const row = `<tr>
            <td><a href="download.html?id=${payment.itemId}">${payment.itemId}</a></td>
            <td>${web3.utils.fromWei(payment.paid)}</td>
            <td>${web3.utils.fromWei(payment.toAuthor)}</td>
            <td>${web3.utils.fromWei(payment.paid) / web3.utils.fromWei(payment.price)}</td>
            <td>${safe_tags(payment.shippingInfo)}</td></tr>`;
        $('#theTable').append(row);
    }
}

window.addEventListener('load', onLoad);