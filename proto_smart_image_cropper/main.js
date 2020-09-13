var smartcrop = require('smartcrop-gm');

var smartCrop =  function (image_blob, options) {
    var image_buffer = new Buffer(image_blob, "base64");
    return smartcrop.crop(image_buffer, options);
}

module.exports = {
    smartCrop: smartCrop
}