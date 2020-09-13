var ImageProcessor = require('./image-processor.min.js'),
    AWS = require('aws-sdk'),
    s3 = new AWS.S3(),
    GLOBALS = { outputs: {} },
    PROCESS_MODES,
    sizes = {
        "thumb": { width: null, height: 75 },
        "16c": { width: 1260, height: 756 },
        "7c": { width: 540, height: 320 },
        "4c": { width: 300, height: 180 },
        "3c": { width: 220, height: 132 },
        "2c": { width: 140, height: 84 }
    };

function savePageToS3(options) {
    let param = {
        ACL: 'public-read',
        Bucket: GLOBALS.BUCKET,
        Key: options.key,
        ContentType: options.content_type,
        Body: Buffer.from(options.image, 'base64')
    };

    // return s3.upload(param).promise();
    return new Promise(function (resolve, reject) {
        s3.upload(param, function (err, data) {
            if (err) {
                reject({
                    success: false,
                    mode: options.image_mode,
                    message: err
                });
            } else {
                resolve({
                    success: true,
                    data: data,
                    mode: options.image_mode,
                    width: options.width,
                    height: options.height,
                    message: "Image created successfully."
                });
            }
        });
    })
}

function imageModesToProcess(width, height) {
    var all_modes = ["16c", "7c", "4c", "3c", "2c"],
        modes_to_process = ["thumb"],
        modes_not_to_process = [];

    if (width > 1260 || height > 756) {
        modes_to_process = modes_to_process.concat(all_modes);
    } else if (width > 540 || height > 250) {
        modes_to_process = modes_to_process.concat(["7c", "4c", "3c", "2c"]);
    } else if (width > 300 || height > 180) {
        modes_to_process = modes_to_process.concat(["4c", "3c", "2c"]);
    } else if (width > 220 || height > 132) {
        modes_to_process = modes_to_process.concat(["3c", "2c"]);
    } else if (width > 140 || height > 84) {
        modes_to_process = modes_to_process.concat(["2c"]);
    } else {
        modes_to_process = modes_to_process.concat([]);
    }

    modes_not_to_process = arrayDifference(all_modes, modes_to_process);
    return {
        modes_not_to_process: modes_not_to_process,
        modes_to_process: modes_to_process
    }
}

function arrayDifference(array_1, array_2) {
    return array_1.filter(function (i) { return array_2.indexOf(i) < 0; });
}

exports.handler = (event, context, callback) => {
    // TODO implement
    process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];
    GLOBALS.BUCKET = event['bucket_name'];

    var image_blob = event['image_blob'],
        processed_image_blob = image_blob.split(","),
        options = event['options'],
        image_type = event['content_type'],
        image_blob_buffer,
        processedImage;

    processed_image_blob = processed_image_blob.length > 1 ? processed_image_blob[1] : processed_image_blob[0];
    image_blob_buffer = new Buffer(processed_image_blob, "base64");

    if (options.crop) {
        PROCESS_MODES = imageModesToProcess(options.crop.width, options.crop.height);
        var crop_options = options.crop;
        crop_options.image_type = options.image_type;
        processedImage = ImageProcessor.crop(image_blob_buffer, crop_options).then(function (image) {
            return ImageProcessor.compress(image, options);
        });
    } else {
        PROCESS_MODES = imageModesToProcess(options.image_w, options.image_h);
        processedImage = ImageProcessor.compress(image_blob_buffer, options)
    }

    processedImage.then(function (image) {
        // Based on process create promise.all
        GLOBALS.outputs["og"] = { image: new Buffer(image) };

        return ImageProcessor.getSize(GLOBALS.outputs["og"].image, options);
    }).then(function (size) {
        GLOBALS.outputs.og.width = size.width;
        GLOBALS.outputs.og.height = size.height;

        let modes_not_to_process = PROCESS_MODES.modes_not_to_process,
            modes_to_process = PROCESS_MODES.modes_to_process,
            process_modes_promises = [];

        modes_not_to_process.forEach(function (e) {
            GLOBALS.outputs[e] = {
                image: new Buffer(GLOBALS.outputs.og.image),
                width: GLOBALS.outputs.og.width,
                height: GLOBALS.outputs.og.height
            };
        });

        modes_to_process.forEach(function (e) {
            let opts = {},
                dimensions = sizes[e];

            opts.width = dimensions.width;
            opts.height = dimensions.height;
            opts.image_type = options.image_type;

            if (e === "thumb") {
                process_modes_promises.push(ImageProcessor.resize(GLOBALS.outputs.og.image, opts))
            } else {
                process_modes_promises.push(ImageProcessor.resize(GLOBALS.outputs.og.image, opts, "!"))
            }
        });

        return Promise.all(process_modes_promises);
    }).then(function (results) {
        // Compute and collect size.
        let modes_to_process = PROCESS_MODES.modes_to_process,
            keys,
            dimensions,
            save_objects = [];

        modes_to_process.forEach(function (e, i) {
            // dimensions = sizes[e];

            GLOBALS.outputs[e] = {
                image: new Buffer(results[i].buffer),
                width: results[i].size.width,
                height: results[i].size.height
            };
        });

        keys = Object.keys(GLOBALS.outputs);
        keys.forEach(function (e) {
            var params = {
                key: `images/${options.account_slug}/${options.s3_identifier}/${options.image_id}-${e}.${options.image_type}`,
                content_type: options.content_type,
                image: GLOBALS.outputs[e].image,
                image_mode: e,
                width: GLOBALS.outputs[e].width,
                height: GLOBALS.outputs[e].height
            };

            if (e === "og") {
                params["key"] = `images/${options.account_slug}/${options.s3_identifier}/${options.image_id}.${options.image_type}`
            }
            save_objects.push(savePageToS3(params));
        });

        return Promise.all(save_objects);
    }).then(function (results) {
        callback(null, { success: true, data: results })
    }).catch(function (error) {
        console.error("There was an error processing the image", error);
        callback(null, { success: false, message: error });
    });
};