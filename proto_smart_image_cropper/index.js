var smartCrop = require("./smart-crop.min.js");

exports.handler = (event, context, callback) => {
    // TODO implement
    process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];

    var image_blob = event['image_blob'],
        processed_image_blob = image_blob.split(","),
        crop_options = event['crop_options'];

    processed_image_blob = processed_image_blob.length > 1 ? processed_image_blob[1] : processed_image_blob[0];
    var cropper = smartCrop.smartCrop(processed_image_blob, crop_options);
    cropper.then(function (result) {
        callback(null, {
            "status": 200,
            "message": "Image cropped successfully.",
            "data": result.topCrop
        });
    }).catch(function (error) {
        console.error("There was an error processing the crop", error);
    });
};