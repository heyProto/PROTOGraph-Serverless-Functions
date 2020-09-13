const gm = require('gm').subClass({ imageMagick: true });

var compressImage = function (image, options) {
    return new Promise (function (resolve, reject) {
        let op_image = gm(image, options.image_type)
        op_image.compress(options.compression_type).toBuffer(options.image_type, function (err, buffer) {
            if (err) reject(err);
            resolve(buffer);
        });
    });
};

var resizeImage = function (image, options, mode) {
    return new Promise(function (resolve, reject) {
        let op_image = gm(image, options.image_type),
            width = options.width ? `${options.width}` : null,
            height = options.height ? `${options.height}` : null;

        op_image.resize(width, height, mode).toBuffer(options.image_type, function (err, buffer) {
            gm(buffer, options.image_type).size(function (err, size) {
                if (err) reject(err);
                resolve({buffer: buffer, size: size});
            });
        });
    });
};

var cropImage = function (image, options) {
    return new Promise(function (resolve, reject) {
        let op_image = gm(image, options.image_type)
        op_image.crop(options.width, options.height, options.x, options.y)
        .toBuffer(options.image_type, function (err, buffer) {
            if (err) reject(err);
            resolve(buffer);
        });
    });
};

var getSize = function (image, options) {
    return new Promise(function (resolve, reject) {
        let op_image = gm(image, options.image_type)
        op_image.size(function (err, size) {
            if (err) reject(err);
            resolve(size);
        });
    });
};

module.exports = {
    compress: compressImage,
    resize: resizeImage,
    crop: cropImage,
    getSize: getSize
};