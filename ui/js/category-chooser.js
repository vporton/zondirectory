(function( $ ) {

    $.fn.categoryChooser = function() {
        this.after(`<label><input type='checkbox'/> My</label>`);
        const input = this;
        async function completer(request, response) {
            const checkbox = input.next().find(':checkbox');
            const my = checkbox.is(':checked');
            await defaultAccountPromise();
            const owner = my ? defaultAccount : '0x0000000000000000000000000000000000000000';
            let query = `{
    categoryUpdateds(first:20, orderBy:title, orderDirection:asc,
            where:{title_starts_with:${JSON.stringify(request.term)} owner:"${owner}"}) {
        title
        categoryId
    }
}`;
            const queryResult = (await queryThegraph(query)).data;
            response(queryResult.categoryUpdateds.map(x => ({label: x.title, value: `${x.categoryId}: ${x.title}`})));
        }
        this.autocomplete({source: completer});
    };

    $.fn.multiVoter = function() {
        const tmpl = $('<p>');
        const input = $('<input>');
        tmpl.append(input)
        this.append(tmpl);
        tmpl.append("<input type='button' value='Delete'>");
        input.categoryChooser();
    }

}( jQuery ));
