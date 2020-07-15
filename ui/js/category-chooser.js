(function( $ ) {

    $.fn.categoryChooser = function() {
        this.attr('placeholder', "Start typing (case sensitive)")
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
        function _multiVoterAdd() {
            const p = $('#multiVoterTmpl').clone(false);
            p.css('display', 'block');
            const input = p.find('input');
            p.append(" | Vote amount in ETH: <input name='amount'> ");
            p.append(`<input type='button' value='Delete' onclick='$(event.target).closest("p").remove()'>`);
            input.categoryChooser();
            $('#multiVoter').append(p);
        }
        const tmpl = $('<p id="multiVoterTmpl" style="display:none">');
        const input = $('<input name="cat">');
        tmpl.append(input)
        this.append(tmpl);
        const add = $('<input type="button" value="Add">');
        this.after(add)
        add.click(_multiVoterAdd);
        _multiVoterAdd();
    }

    $.fn.multiVoterData = function() {
        let cats = [];
        let amounts = [];
        this.find('input[name=cat]:gt(0)').each(c => cats.push(c.val()));
        this.find('input[name=amount]').each(c => amounts.push(c.val()));
        let result;
        for(var i in cats) {
            result.push(cats[i]);
            result.push(web3.utils.toWei(amounts[i]));
        }
        return result;
    }

}( jQuery ));
