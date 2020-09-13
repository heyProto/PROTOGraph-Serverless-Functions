// Create a upload package(ZIP File) and dont select edit code inline on AWS LAMBDA
// This changes the file permissions on the executable in lambda
// and will give you an EACCES error. You dont want to go there.

const lambdaAudio = require('lambda-audio');
const fs = require('fs');
const AWS = require('aws-sdk');
var BUCKET_NAME;
// // Event contents
// event = {
  // "startTime": int,
  // "endTime": int,
  // "audioVariationId": int,
  // "s3Identifier": str,
  // "accountSlug": str,
  // "bucket": str,
  // "audioBlob": base64 string
// }

// Body mapping template
 // { 
 // "s3Identifier": $input.json('$.s3Identifier'),
 // "accountSlug": $input.json('$.accountSlug'),
 // "bucket": "$stageVariables.bucket",
 // "audioVariationId": $input.json('$.audioVariationId'),
 // "startTime": $input.json('$.startTime'),
 // "endTime": $input.json('$.endTime'),
 // "audioBlob": $input.json('$.audioBlob')
 // }

//----------- Taken from renderScreenshotToPng -----------//
var save_to_s3 = function(payload, path, context) {
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
      ContentType: "audio/mpeg"
  };

  s3.upload(param, function(err, data) {
    if (err) {
        console.log(err, err.stack);
    } else {
        console.log("Written on: " + data.Location);
        context.succeed({
            "status":200,
            "success": true,
            "message": "Audio added successfully.",
            "data": {
                "audio_key": data.Key
            }});
    }
  });
};


//
//------------- Main -------------//

exports.handler = function(event, context, callback) {
    // Set the path as described here: https://aws.amazon.com/blogs/compute/running-executables-in-aws-lambda/
    process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];
    // Initialize variables
    var key = `audios/${event.accountSlug}/${event.s3Identifier}/${event.audioVariationId}.mp3`;
    BUCKET_NAME = event.bucket;

    var tempFile = "/tmp/temp.mp3";
    var tempFileChanged = "/tmp/temp-changed.mp3";

    // Create buffer from base64 string
    // This will be written to temp file on /tmp
    var audioBuffer = Buffer.from(event.audioBlob, 'base64');
    console.log("Variables Initialized");
    // Writes file to temp synchronously
    fs.writeFileSync(tempFile, audioBuffer);
    console.log("File written to tmp");
    // Trim audio
    if (event.startTime === null && event.endTime === null){
        // If original file. Push to S3 directly
        console.log("Original file being written");
        var data = fs.readFileSync(tempFile);
        console.log("no errors in original file");
        var base64data = new Buffer(data, 'base64');
        save_to_s3(base64data, key, context);

        // delete temp file
        fs.unlink(tempFile, function(err, data){
            if (err) {throw err;}
            console.log('Deleted old file');
        });
  

    } else {
        // If startTime and endTime is present. Trim and push to S3
        lambdaAudio.sox([tempFile, tempFileChanged, 'trim', event.startTime, event.endTime])
            .then(response => {

                // Push file to S3
                var data = fs.readFileSync(tempFileChanged);
                var base64data = new Buffer(data, 'base64');
                save_to_s3(base64data, key, context);

                // Delete temp file changed
                fs.unlink(tempFileChanged, function(err, data){
                    if (err) {throw err;}
                    console.log('Deleted old file');
                });
                // delete temp file
                fs.unlink(tempFile, function(err, data){
                    if (err) {throw err;}
                    console.log('Deleted old file');
                });
                console.log('File was trimmed successfully');
            })
            .catch(errorResponse => {
                console.log('Error from the sox command:', errorResponse);
                context.fail({"error": "Audio Trimming failed"});
            })
    }
};
