function myBooks() {
    defaultAccountPromise()
        .then(() => {
            query = `{
    setItemOwners(orderBy:id, orderDirection:desc, where:{owner:"${defaultAccount}"}) {
        itemId    
    }
}`;
            query = query.replace(/\\/g, '\\').replace(/"/g, '\\"').replace(/\n/g, "\\n");
            $.post("https://api.thegraph.com/subgraphs/name/vporton/cryptozonrinkeby3", `{ "query": "${query}" }`, function(data) {
                alert(JSON.stringify(data));
            });
        });
}

$(myBooks);