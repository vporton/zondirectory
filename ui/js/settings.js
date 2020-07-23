"strict";

function networkChange() {
    const network = $('#web3network').val();
    document.cookie = `web3network=${network}; expires=Fri, 31 Dec 9999 23:59:59 GMT`;
}

function onLoad() {
    $('#web3network').val(getCookie('web3network'));
}

window.addEventListener('load', onLoad);