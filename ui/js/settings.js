"strict";

function networkChange() {
    const network = $('#web3network').val();
    //const path = location.pathname.replace(/[^/\\]*$/, "");
    document.cookie = `web3network=${network}; SameSite=Strict; Expires=Fri, 31 Dec 9999 23:59:59 GMT`;
}

function onLoad() {
    let network = getCookie('web3network');
    if(!network) network = '0x1';
    $('#web3network').val(network);
}

window.addEventListener('load', onLoad);