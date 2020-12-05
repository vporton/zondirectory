"strict";

function networkChange() {
    const network = $('[name=web3network]:checked').val();
    console.log(network)
    //const path = location.pathname.replace(/[^/\\]*$/, "");
    document.cookie = `web3network=${network}; SameSite=Strict; Expires=Fri, 31 Dec 9999 23:59:59 GMT`;
    reconnectWeb3();
}

function onLoad() {
    let network = getCookie('web3network');
    if(!network) network = '0x1';
    $(`[name=web3network][value=${network}]`).prop('checked', true);
}

window.addEventListener('load', onLoad);