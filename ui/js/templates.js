"strict";

function createTemplate() {
    $('#dialog').dialog({
        title: "Create template",
        buttons: [
            {
                text: "OK",
                click: async function() {
                    if(!$("#dialogForm").valid()) return;
                    $(this).dialog("close");
                    const name = $(this).find('[name=name]').val();
                    const js = $(this).find('[name=js]').val();
                    const contractInstance = new web3.eth.Contract(await blogTemplatesJsonInterface(), await getAddress('BlogTemplates'));
                    await defaultAccountPromise();
                    await contractInstance.methods.createTemplate(name, js)
                        .send({from: defaultAccount, gas: '100000'});            
                },
            },
            {
                text: "Cancel",
                click: function() {
                    $(this).dialog("close");
                },
            },
        ]
    });
}

$(function() {
    $("#dialogForm").validate({});
})