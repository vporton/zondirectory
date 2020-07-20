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
        // const contractInstance = new web3.eth.Contract(await filesJsonInterface(), addressFiles);
        // return await contractInstance.methods.upvotesOwnersShare().call()
        //     .then(async (shareResult) => {
        //         const ownersShare = shareResult / 2**64;

        let cats = [];
        let amounts = [];
        let myFlags = [];
        this.find('input[name=cat]:gt(0)').each((i, c) => cats.push(c.value.replace(/^([0-9]*).*/, '$1')));
        this.find('input[name=amount]').each((i, c) => amounts.push(web3.utils.toWei(c.value)));
        this.find('input[type=checkbox]').each((i, c) => myFlags.push(c.checked));
        return {
            cats,
            amounts,
            myFlags,
        };
        // })
        // .catch(alert);
    }

    $.fn.doMultiVote = async function(itemId) {
        const {
            cats,
            amounts,
        } = this.multiVoterData();

        await defaultAccountPromise();
        const contractInstance = new web3.eth.Contract(await filesJsonInterface(), addressFiles);
        for(var i in cats) {
            const parent = cats[i];
            const amount = amounts[i];
            await contractInstance.methods.itemOwners(parent).call()
                .then(async (owner) => {
                    if(owner == defaultAccount) {
                        await contractInstance.methods.setMyChildParent(itemId, parent, amount, 0)
                            .send({from: defaultAccount, gas: '1000000'});
                    } else {
                        console.log(itemId, parent, true, amount)
                        await contractInstance.methods.voteChildParent(itemId, parent, true, '0x0000000000000000000000000000000000000000')
                            .send({from: defaultAccount, value: amount, gas: '1000000'});
                    }
                });
        }
    }

}( jQuery ));
