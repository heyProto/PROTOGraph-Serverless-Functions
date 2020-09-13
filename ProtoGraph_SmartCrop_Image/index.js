var exec = require("child_process");
var https = require('https');
var gm = require("gm").subClass({imageMagick: true});;
var smartcrop = require('smartcrop-gm');
var fs = require('fs');
var AWS = require('aws-sdk');
var request = require("request");
var BUCKET_NAME;

// // test event
// {
//     "originalImageLink": "https://s3.ap-south-1.amazonaws.com/dev.cdn.protograph/images/testing-123/3c2ilhqwtvjz.png",
//     "imageVariationId": 1,
//     "s3Identifier": "80085",
//     "accountSlug": "testing-123",
//     "bucket": "dev.cdn.protograph"
// }

// // body mapping template for /images/smartcrop-post
// { 
//   "s3Identifier": $input.json('$.s3Identifier'),
//   "accountSlug": $input.json('$.accountSlug'),
//   "bucket": "$stageVariables.bucket",
//   "imageVariationId": $input.json('$.imageVariationId'),
//   "originalImageLink": $input.json('$.originalImageLink')
// }


// Takes a URL from event. Runs smartcrop and passes width, height, x and y
// to imageMagick and pushes to S3


var save_to_s3 = function(payload, path, callback) {
    var fileName = path.split("/").pop()
    var s3 = new AWS.S3();
    console.log("Transfering to s3\n");
    var param = {
        ACL: 'public-read',
        Bucket: BUCKET_NAME,
        Key: path,
        Body: payload,
        // ContentDisposition is used to open image
        //in new tab and not show as a download link
        ContentDisposition: "inline;filename=" + '"' + fileName + '"',
        ContentType: "image/jpeg"
    };

    s3.upload(param, function(err, data) {
        if (err) {
            console.log("Error from upload_to_s3: " + err);
        } else {
            console.log("Written on: " + data.Location);
            if (callback && typeof(callback) === "function") {
                callback(data.Key);
            }
        }
    });
};

// SmartCrop with gm
function applySmartCrop(src, dest, width, height, callback) {
    request(src, {encoding: null}, function process(error, response, body){
        if (error) return console.error("Error reading image file: " + error);
        console.log("No error reading file in applySmartCrop");
        smartcrop.crop(body, {width: width, height: height}).then(function(result) {
            console.log("Inside smartcrop.crop");
            var crop = result.topCrop;
            gm(body)
                .crop(crop.width, crop.height, crop.x, crop.y)
                .resize(width, height)
                .write(dest, function(error){
                    if (error) {
                        console.error("Error from gm: " + error);
                    } else {
                        if (callback && typeof(callback) === "function") {
                            callback();
                        }
                    }
                });
        });
    });
}

exports.handler = function(event, context, callback) {
    // Set the path as described here: https://aws.amazon.com/blogs/compute/running-executables-in-aws-lambda/
    process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];
    // Initialize variables
    var key = `images/${event.accountSlug}/${event.s3Identifier}/${event.imageVariationId}.jpg`;
    BUCKET_NAME = event.bucket;

    var tempFileCropped = "/tmp/temp-cropped.jpg";
    console.log("Variables initialized");

    applySmartCrop(event.originalImageLink, tempFileCropped, 500, 500, function(){
        var data = fs.readFileSync(tempFileCropped);
        console.log("Read temp file");
        var base64data = new Buffer(data, 'base64');
        save_to_s3(base64data, key, function(dataKey){
            context.succeed({
                "status":200,
                "success": true,
                "message": "Image added successfully.",
                "data": {
                    "image_key": dataKey
                }});
        });
    })
    
};
