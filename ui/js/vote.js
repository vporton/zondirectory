async function vote() {
    const amount = prompt("Vote amount (in ETH):", '0.1');
    if(!amount) return;

    const child = $('#child').val();
    const parent = $('#parent').val().replace(/:.*/, "");
    const yes = $('[name=dir][value=for]').is(":checked");

    await defaultAccountPromise();
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), addressFiles);
    await contractInstance.methods.voteChildParent(child, parent, yes)
        .send({from: defaultAccount, value: web3.utils.toWei(amount), gas: '10000000'}, (error, result) => {
            if(error) return;
            alert("You voted " + $('[name=dir][value=for]').val());
        });
}

function onLoad() {
    const urlParams = new URLSearchParams(window.location.search);
    const child = urlParams.get('child');
    const parent = urlParams.get('parent');
    const dir = urlParams.get('dir');
    $('#child').val(child);
    $('#parent').val(parent);
    $(`[name=dir][value=${dir}]`).prop('checked', true);
    $('.category').categoryChooser();
}

$(onLoad);