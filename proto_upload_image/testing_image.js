var ImageProcessor = require('./dist/image-processor.min.js');
const gm = require('gm').subClass({ imageMagick: true });
var fs = require('fs');
var event = require('./actual-test-event.json');
var image_blob = event['image_blob'],
    processed_image_blob = image_blob.split(","),
    options = event['options'],
    image_type = event['content_type'],
    image_blob_buffer,
    processedImage;

var smartCrop = require('./smart-crop.min.js');

processed_image_blob = processed_image_blob.length > 1 ? processed_image_blob[1] : processed_image_blob[0];
image_blob_buffer = new Buffer(processed_image_blob, "base64");

gm(image_blob_buffer, options.image_type).write('./og.jpeg', function (err, data) {
    if (err) console.log("ERROR", err);
    console.log("DATA", data);
});

console.log(options.crop.width, options.crop.height, options.crop.x, options.crop.y, "CROP PARAMS");
gm(image_blob_buffer, options.image_type).crop(options.crop.width, options.crop.height, options.crop.x, options.crop.y).write('./cropped_image.jpeg', function (err, data) {
    if (err) console.log("ERROR", err);
    console.log("DATA", data);
});
// event['crop_image_json']
smartCrop.smartCrop(image_blob, { width: 1260, height: 756 }).then(function (result) {
    console.log(result, "RESULT....................");
    var crop_params = result.topCrop;
    gm(image_blob_buffer, options.image_type).crop(crop_params.width, crop_params.height, crop_params.x, crop_params.y).write('./cropped_image.jpeg', function (err, data) {
        if (err) console.log("ERROR", err);
        console.log("DATA", data);
    });
}).catch(function (err) { console.log(err, "?????"); });



var gifImage = fs.readFileSync('./test.gif').toString('base64');

smartCrop.smartCrop(gifImage, { width: 1260, height: 756 }).then((result) => {
    console.log(result, "GIF RESULT....................");
    var crop_params = result.topCrop,
        crop_image = new Buffer(gifImage, 'base64');

    gm(crop_image, options.image_type).crop(crop_params.width, crop_params.height, crop_params.x, crop_params.y).write('./cropped-gif-image.jpeg', function (err, data) {
        if (err) console.log("ERROR", err);
        console.log("DATA", data);
    });
}).catch(function (err) { console.log(err, "?????"); });