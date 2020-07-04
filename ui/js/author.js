function myBooks() {
    defaultAccountPromise()
        .then(() => {
            query = `{
    setItemOwners(orderBy:id, orderDirection:desc, where:{owner:"${defaultAccount}"}) {
        itemId    
    }
}`;
    queryThegraph(query, (data) => alert(JSON.stringify(data)));
    });
}

$(myBooks);