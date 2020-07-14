(function( $ ) {

    async function completer(request, response) {
        let query = `{
    categoryUpdateds(first:20, orderBy:title, orderDirection:asc, where:{title_starts_with:${JSON.stringify(request.term)}}) {
        title
        categoryId
    }
}`;
        const queryResult = (await queryThegraph(query)).data;
        response(queryResult.categoryUpdateds.map(x => ({label: x.title, value: `${x.categoryId}: ${x.title}`})));
    }

    $.fn.categoryChooser = function() {
        this.autocomplete({source: completer});
    };

}( jQuery ));
