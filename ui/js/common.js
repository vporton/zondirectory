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