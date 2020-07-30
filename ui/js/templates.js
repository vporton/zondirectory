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
                    const settings = $(this).find('[name=settings]').val();
                    const contractInstance = new web3.eth.Contract(await blogTemplatesJsonInterface(), await getAddress('BlogTemplates'));
                    await defaultAccountPromise();
                    await contractInstance.methods.createTemplate(name, js, settings)
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

function editTemplate(event) {
    const li = $(event.target).parent();
    $('#dialog').find('[name=id]').val(li.data('id'));
    $('#dialog').find('[name=name]').val($(event.target).text());
    $('#dialog').find('[name=js]').val(li.data('js'));
    $('#dialog').find('[name=settings]').val(li.data('settings'));
    
    $('#dialog').dialog({
        title: "Edit template",
        buttons: [
            {
                text: "OK",
                click: async function() {
                    if(!$("#dialogForm").valid()) return;
                    $(this).dialog("close");
                    const id = $(this).find('[name=id]').val();
                    const name = $(this).find('[name=name]').val();
                    const js = $(this).find('[name=js]').val();
                    const settings = $(this).find('[name=settings]').val();
                    const contractInstance = new web3.eth.Contract(await blogTemplatesJsonInterface(), await getAddress('BlogTemplates'));
                    await defaultAccountPromise();
                    await contractInstance.methods.updateTemplate(id, name, js, settings)
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

async function onLoad() {
    if(!window.web3) {
        alert("Install a crypto browser to be an author!");
        return;
    }

    $("#dialogForm").validate({});

    await defaultAccountPromise();
    query = `{
    templateChangeOwners(orderBy:id, orderDirection:desc, where:{owner:"${defaultAccount}"}) {
        templateId
    }
}`;
    let templateIds = (await queryThegraph2(query)).data.templateChangeOwners;
    templateIds = templateIds.filter((x, i, a) => a.indexOf(x) == i); // unique values
    if(!templateIds.length) return;
    const templateIdsFlat = templateIds.map(i => i.templateId);
    function subquery(templateId) {
        return `    templateUpdateds${templateId}: templateUpdateds(first:1, orderBy:id, orderDirection:desc, where:{templateId:${templateId}}) {
        templateId
        name
        js
        settings
    }`
    }
    query = "{\n" + templateIdsFlat.map(i => subquery(i)).join("\n") + "\n}";
    let items = (await queryThegraph2(query)).data;
    for (let i in items) {
        const item = items[i][0];
        const settingsHtml = item.settings != "" ? `(<a target="_blank" href="${safe_attrs(item.settings)}">settings</a>)`
                                                 : "";
        const html = `
<li data-id="${item.templateId}"
    data-js="${safe_attrs(item.js)}"
    data-settings="${safe_attrs(item.settings)}">
    <a href="#" onclick="editTemplate(event); return false">${safe_tags(item.name)}</a>
    ${settingsHtml}
</li>`;
        $('#templates').append(html);
    }
}

window.addEventListener('load', onLoad);