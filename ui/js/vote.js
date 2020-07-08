async function vote() {
    const amount = prompt("Vote amount (in ETH):", '0.1');
    if(!amount) return;

    const child = $('#child').val();
    const parent = $('#parent').val();
    const yes = $('[name=dir][value=for]').is(":checked");

    await defaultAccountPromise();
    const contractInstance = new web3.eth.Contract(await filesJsonInterface(), addressFiles);
    await contractInstance.methods.voteChildParent(child, parent, yes).send({from: defaultAccount, value: amount, gas: '10000000'}, (error, result) => {
        if(error) return;
        alert("You voted " + $('[name=dir][value=for]').val());
    });
}