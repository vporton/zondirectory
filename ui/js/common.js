const web3 = new Web3(window.web3.currentProvider);

let defaultAccount;
// web3.eth.defaultAccount = web3.eth.accounts[0];
web3.eth.getAccounts().then( function (result) { return defaultAccount = result[0] });

function categoriesJsonInterface() {
    return new Promise((resolve) => {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200)
                resolve(JSON.parse(xhttp.responseText));
        };
        xhttp.open("GET", "artifacts/Categories.abi", true);
        xhttp.send();
    });
}