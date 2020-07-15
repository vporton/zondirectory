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

    $.fn.multiVoterData = async function() {
        const contractInstance = new web3.eth.Contract(await filesJsonInterface(), addressFiles);
        return await contractInstance.methods.upvotesOwnersShare().call()
            .then(async (shareResult) => {
                const ownersShare = shareResult / 2**64;

                let cats = [];
                let amounts = [];
                let myFlags = [];
                this.find('input[name=cat]:gt(0)').each((i, c) => cats.push(c.value));
                this.find('input[name=amount]').each((i, c) => amounts.push(c.value));
                this.find('input[type=checkbox]').each((i, c) => myFlags.push(c.checked));
                let result = [];
                let sum = 0;
                for(var i in cats) {
                    const cat = cats[i].replace(/^([0-9]*).*/, '$1');
                    if(!cat) continue;
                    if(!/^[0-9]+(\.[0-9]+)?$/.test(amounts[i])) continue;
                    const amount = amounts[i];
                    if(!myFlags[i]) {
                        sum += amount;
                    }
                    result.push(cat);
                    result.push(web3.utils.toWei(amount));
                }
                return {
                    votes: result,
                    sum: web3.utils.toWei(String(sum * ownersShare * 1.0000001)), // with reserve
                };
            })
            .catch(alert);
    }

}( jQuery ));
