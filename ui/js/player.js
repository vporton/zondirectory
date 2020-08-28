function displayVideo(id, link) {
    $.ajax(link, {method: 'HEAD'})
        .then(function(data, textStatus, xhr) {
            const type = xhr.getResponseHeader("content-type") || "";
            if(type.startsWith('video/')) {
                const source = $(id + 'video > source');
                source.attr('src', link);
                source.attr('type', type);
                $(id + 'video').css('display', 'block');
            } else if(type.startsWith('audio/') || type == 'application/x-mpegURL') {
                const source = $(id + 'audio > source');
                source.attr('src', link);
                source.attr('type', type);
                $(id + 'audio').css('display', 'block');
            }
        })
}