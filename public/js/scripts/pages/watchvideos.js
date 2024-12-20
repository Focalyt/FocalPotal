$(document).ready(function () {
    var Youtube = (function () {
        'use strict';

        var video, results;

        var getThumb = function (url, size) {
            if (url === null) {
                return '';
            }
            size = (size === null) ? 'big' : size;
            if(url.lastIndexOf('v=')> 0) {
                results =  url.slice(url.lastIndexOf('v=') + 2)
            }else {
                results = url.slice(url.lastIndexOf('/') + 1)
            }
            
            video = (results === null ) ? url : results;

            if (size === 'small') {
                return 'http://img.youtube.com/vi/' + video + '/2.jpg';
            }
            return 'http://img.youtube.com/vi/' + video + '/0.jpg';
        };

        return {
            thumb: getThumb
        };
    }());

    $(".videolinkclass").each((i, item) => {
        let link = $(item).attr('videolink')
        if (link) {
            let image = Youtube.thumb(link)
            if (image) {
                $(item).attr('src', image)
            }
        }
    })
})