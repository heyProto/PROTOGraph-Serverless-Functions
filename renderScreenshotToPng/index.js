var fs = require('fs');
var childProcess = require('child_process');
var path = require('path');
var AWS = require('aws-sdk');

/********** CONFIGS **********/

var BUCKET_NAME = '';
var FILENAME_BASE = 'screenshot';
var WEBPAGE = 'http://www.google.com/';
var PHANTOM_BINARY = 'phantomjs';

/********** HELPERS **********/

var filepath = function(base) {
  var months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  var today = new Date();
  /*var path = today.getFullYear() + "/"
           + months[today.getMonth()] + "/"
           + ("0" + today.getDate()).slice(-2) + "/";*/
  var filename =   ("0" + today.getHours()).slice(-2)
               + ("0" + today.getMinutes()).slice(-2)
               + ".png";
  return filename;
}

var save_to_s3 = function(payload, path, context) {
  var s3 = new AWS.S3();
  console.log("Transfering to s3\n");
  var param = {
    ACL: 'public-read',
    Bucket: BUCKET_NAME,
    Key: path,
    ContentType: 'image/png',
    Body: payload};
  s3.upload(param, function(err, data) {
    if (err) {
      context.fail(err);
    } else {
      context.succeed({"message": "Data Added Successfully"});
    }
  });
};

/********** MAIN **********/

exports.handler = function(event, context) {
  // Set the path as described here: https://aws.amazon.com/blogs/compute/running-executables-in-aws-lambda/
  process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];

  // Set the path to the phantomjs binary
  var phantomPath = path.join(__dirname, PHANTOM_BINARY);

  BUCKET_NAME = event.bucket;
  // Arguments for the phantom script
  var processArgs = [
    path.join(__dirname, 'phantom-script.js'),
    './ready_index.html',
    event.js,
    event.css,
    event.data_url,
    event.schema_json,
    event.configuration_url,
    event.configuration_schema,
    event.initializer,
    event.mode
  ];

  var screenshotData = '';
    var screenshot = childProcess.spawn(phantomPath, processArgs);

    screenshot.stderr.on('data', function(data) {
      console.log("Error from child process "+ data +"\n");
    });

    screenshot.stdout.on('data', function(buf) {
      //console.log("Getting Data\n");
      screenshotData += buf;
    });

    screenshot.stdout.on('end', function() {
      //console.log("Got all Data\n");
      // var buffer = new Buffer(screenshotData);
      console.log("Data from child Process: \n");
      console.log(screenshotData);


      fs.readFile('/tmp/temp_screenshot.png', function (err, data) {
        if (err) { throw err; }

        var base64data = new Buffer(data, 'base64');
        save_to_s3(base64data, event.key, context);
      });

      fs.unlink('/tmp/temp_screenshot.png', function(err, data){
        console.log('Deleted old file');
      });


    });

    screenshot.on('exit', function(code) {
      if (code !== 0) {
        console.log("Code is not zero "+ code + "\n");
        context.fail(code);
      }

    });
}