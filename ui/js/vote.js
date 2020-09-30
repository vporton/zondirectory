"strict";

async function vote() {
    if(!$('#form').valid()) return;

    const amount = prompt("Vote amount (in ETH):", '0.1');
    if(!amount) return;

    const child = $('#child').val();
    const parent = $('#parent').val().replace(/:.*/, "");
    const yes = $('[name=dir][value=for]').is(":checked");

    await defaultAccountPromise();
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), await getAddress('Files'));
    await mySend(contractInstance, contractInstance.methods.voteChildParent, [child, parent, yes, affiliateAddress()],
        {value: web3.utils.toWei(amount)}, (error, result) => {
            if(error) return;
            ga('send', 'event', 'Votes', 'voted', yes ? 'for' : 'against', web3.utils.toWei(amount));
        alert("You voted " + $('[name=dir][value=for]').val());
        });
}

function onLoad() {
    const child = numParam('child');
    const parent = numParam('parent');
    const urlParams = new URLSearchParams(window.location.search);
    const dir = urlParams.get('dir');
    if(child) $('#child').val(child);
    if(parent) $('#parent').val(parent);
    $(`[name=dir][value=${dir}]`).prop('checked', true);
    $('.category').categoryChooser();

    $('#form').validate({});
}

window.addEventListener('load', onLoad);