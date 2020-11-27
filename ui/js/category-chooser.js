"strict";

(function( $ ) {

    $.fn.categoryChooser = function() {
        this.attr('placeholder', "Start typing (case sensitive)")
        this.after(`<label><input type='checkbox'/> My</label>`);
        const input = this;
        async function completer(request, response) {
            const checkbox = input.next().find(':checkbox');
            const my = checkbox.is(':checked');
            await defaultAccountPromise();
            const name = my ? 'ownedCategoryUpdateds' : 'categoryUpdateds';
            let query = `{
        categoryUpdateds: ${name}(first:20, orderBy:title, orderDirection:asc,
            where:{title_starts_with:${JSON.stringify(request.term)}}) {
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
            p.append(" | Vote amount in MATIC: <input name='amount'> ");
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
        let sum = new web3.utils.BN('0');
        let cats0 = [];
        let amounts0 = [];
        let myFlags0 = [];
        this.find('input[name=cat]:gt(0)').each((i, c) => cats0.push(c.value.replace(/^([0-9]*).*/, '$1')));
        this.find('input[name=amount]').each((i, c) => amounts0.push(c.value ? web3.utils.toWei(c.value) : ''));
        this.find('input[type=checkbox]').each((i, c) => myFlags0.push(c.checked));

        let cats = [];
        let amounts = [];
        let myFlags = [];
        for(let i in cats0) {
            if(cats0[i] && amounts0[i]) {
                cats.push(cats0[i]);
                amounts.push(amounts0[i]);
                myFlags.push(myFlags0[i]);
            }
        }

        const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));
        // TODO: Do processing in parallel.
        for(let i in cats) {
            const parent = cats[i];
            const amount = amounts[i];
            await contractInstance.methods.itemOwners(parent).call()
                .then(async (owner) => {
                    if(owner != defaultAccount)
                        sum = sum.add(new web3.utils.BN(amount));
                });
        }

        return {
            cats,
            amounts,
            myFlags,
            sum,
        };
    }

    // TODO: This function is wrong (but never called)
    $.fn.doMultiVote = async function(itemId) {
        const {
            cats,
            amounts,
            sum,
        } = await $('#multiVoter').multiVoterData();

        await defaultAccountPromise();
        const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));
        for(var i in cats) {
            if(!cats[i] || !amounts[i]) continue;

            const parent = cats[i];
            const amount = amounts[i];
            await contractInstance.methods.itemOwners(parent).call()
                .then(async (owner) => {
                    if(owner == defaultAccount) {
                        await mySend(contractInstance, contractInstance.methods.setMyChildParent, [itemId, parent, amount, 0])
                            .catch(err => alert);
                    } else {
                        await mySend(contractInstance, contractInstance.methods.voteChildParent, [itemId, parent, true, affiliateAddress()], {value: sum})
                            .catch(err => alert);
                    }
                })
                .catch(err => alert);
        }
    }

}( jQuery ));
