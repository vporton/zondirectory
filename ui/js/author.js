function myBooks() {
    defaultAccountPromise()
        .then(() => {
            query = `{
    setItemOwners(orderBy:id, orderDirection:desc, where:{owner:"${defaultAccount}"}) {
        itemId    
    }
}`;
            queryThegraph(query)
                .then((data) => alert(JSON.stringify(data)));
            //const itemOwners = 
        });
}

$(myBooks);