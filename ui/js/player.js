function displayVideo(id, link) {
    link = link.replace(/^arweave:/, "https://arweave.net/");
    $.ajax(link, {method: 'HEAD'})
        .then(function(data, textStatus, xhr) {
            const type = xhr.getResponseHeader("content-type") || "";
            if(type.startsWith('video/')) {
                const source = $(`#${id}video source`);
                source.attr('src', link);
                source.attr('type', type);
                $(`#${id}video`)[0].load();
                $(`#${id}video`).css('display', 'block');
            } else if(type.startsWith('audio/') || type == 'application/x-mpegURL') {
                const source = $(`#${id}audio source`);
                source.attr('src', link);
                source.attr('type', type);
                $(`#${id}audio`)[0].load();
                $(`#${id}audio`).css('display', 'block');
            }
        })
}