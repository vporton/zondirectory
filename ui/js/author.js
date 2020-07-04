async function myBooks() {
    await defaultAccountPromise();
        query = `{
    setItemOwners(orderBy:id, orderDirection:desc, where:{owner:"${defaultAccount}"}) {
        itemId    
    }
}`;
    let itemIds = (await queryThegraph(query)).data.setItemOwners;
    console.log(itemIds)
    //itemIds = new Set(itemIds);
}

$(myBooks);