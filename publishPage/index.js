var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var ejs = require('./ejs.min.js');
var GLOBALS = {};
var toComposeCardSSR = require('./cards/toCompose-ssr-card.min.js');
var toClusterCardSSR = require('./cards/toCluster-ssr-card.min.js');
var toStoryCardSSR = require('./cards/toStory-ssr-card.min.js');
var toVideoyoutubeCardSSR = require('./cards/toVideoyoutube-ssr-card.min.js');

exports.handler = (event, context, callback) => {
    process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];

    // TODO implement
    GLOBALS.BUCKET = event["bucket"];
    GLOBALS.PAGE_S3 = event["page_s3"];
    GLOBALS.TEMPLATE_PAGE_S3 = event["template_page_s3"];
    GLOBALS.AWS_S3_ENDPOINT = event["AWS_S3_ENDPOINT"];

    fetchPageObject(callback);
};

function fetchTemplatePage(callback) {
    var params = {
        Bucket: GLOBALS.BUCKET,
        Key: GLOBALS.TEMPLATE_PAGE_S3 + '/index.html.ejs'
    };
    s3.getObject(params, function (err, data) {
        if (err) {
            callback(err);
            console.error(err, err.stack, "ERROR FETCHING TEMPLATE PAGE"); // an error occurred
        } else {
            GLOBALS.template_page_string = new Buffer(data.Body, 'base64').toString("utf-8");
            processPage(callback);
        }
    });
}

function fetchPageObject(callback) {
    var params = {
        Bucket: GLOBALS.BUCKET,
        Key: GLOBALS.PAGE_S3 + '/page.json'
    };
    s3.getObject(params, function (err, data) {
        if (err) {
            callback(err);
            console.error(err, err.stack, "ERROR FETCHING PAGE OBJECT"); // an error occurred
        } else {
            GLOBALS.page_object = new Buffer(data.Body, 'base64').toString("utf-8");
            fetchTemplatePage(callback);
        }
    });
}

function processPage(callback) {
    var processed_page,
        page_object = JSON.parse(GLOBALS.page_object),
        page = page_object["page"],
        streams = page_object["streams"],
        site = page_object["site_attributes"],
        streams_mapping = {},
        split_string = "";

    switch (page_object.page.layout.name) {
        case "Homepage: Vertical":
            split_string = "_Section_";
            break;
        case "article":
            split_string = "_Story_";
            break;
        case "data grid":
            split_string = "_Data_";
            break;
    }


    streams.forEach(function (s) {
        var column = s["title"].split(split_string)[1];
        streams_mapping[column] = s;
    });

    processed_page = ejs.render(GLOBALS.template_page_string, {
        page: page,
        streams: streams,
        site: site,
        streams_mapping: streams_mapping,
        toComposeCardSSR: toComposeCardSSR,
        toClusterCardSSR: toClusterCardSSR,
        toStoryCardSSR: toStoryCardSSR,
        toVideoyoutubeCardSSR: toVideoyoutubeCardSSR,
        template_page_s3: GLOBALS.TEMPLATE_PAGE_S3,
        AWS_S3_ENDPOINT: GLOBALS.AWS_S3_ENDPOINT,
        vertical_header_json_url: page_object["vertical_header_json_url"],
        homepage_header_json_url: page_object["homepage_header_json_url"],
        site_header_json_url: page_object["site_header_json_url"],
        ref_category_object: page_object['ref_category_object'],
        major_stream_blockquotes: page_object['major_stream_blockquotes']
    });

    GLOBALS.processed_page = processed_page;
    savePageToS3(callback);
}

function savePageToS3(callback) {
    var page_object = JSON.parse(GLOBALS.page_object),
        param = {
            ACL: 'public-read',
            Bucket: GLOBALS.BUCKET,
            Key: GLOBALS.PAGE_S3 + `/${page_object.page.html_key}.html`,
            ContentType: 'text/html',
            Body: GLOBALS.processed_page
        };

    s3.upload(param, function (err, data) {
        if (err) {
            callback(err);
            console.error(err, err.stack, "ERROR SAVING PAGE TO S3");
        } else {
            callback(null, {
                "status": 200,
                "message": "Page creation/updation successful.",
                "page_url": `${s3.endpoint.href}${GLOBALS.BUCKET}/${GLOBALS.PAGE_S3}/${page_object.page.html_key}.html`
            });
        }
    });
}