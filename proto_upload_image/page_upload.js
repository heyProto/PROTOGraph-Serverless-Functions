var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var ejs = require('./ejs.min.js');
var GLOBALS = {};

exports.handler = (event, context, callback) => {
    process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];

    // TODO implement
    GLOBALS.BUCKET = event["bucket"];
    GLOBALS.PAGE_S3 = event["page_s3"];
    GLOBALS.TEMPLATE_PAGE_S3 = event["template_page_s3"];
    GLOBALS.AWS_S3_ENDPOINT = event["AWS_S3_ENDPOINT"];
    GLOBALS.TEMPLATE_PAGE_BUCKET = event['template_page_bucket'];
    fetchPageObject(callback);
};

function fetchTemplatePage(callback) {
    var params = {
        Bucket: GLOBALS.TEMPLATE_PAGE_BUCKET ,//Change this to production
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

    console.log(params);
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
        default:
            split_string = "_Data_";
            break;
    }

    streams.forEach(function (s) {
        let column = s["title"].split(split_string)[1];
        streams_mapping[column] = s;
    });

    processed_page = ejs.render(GLOBALS.template_page_string, {
        page: page,
        streams: streams,
        site: site,
        streams_mapping: streams_mapping,
        template_page_s3: GLOBALS.TEMPLATE_PAGE_S3,
        AWS_S3_ENDPOINT: GLOBALS.AWS_S3_ENDPOINT,
        vertical_header_json_url: page_object["vertical_header_json_url"],
        homepage_header_json_url: page_object["homepage_header_json_url"],
        site_header_json_url: page_object["site_header_json_url"],
        ref_category_object: page_object['ref_category_object'],
        navigation_json: page_object['navigation_json'],
        major_stream_blockquotes: page_object['major_stream_blockquotes'],
        more_in_the_series: page_object['more_in_the_series'],
        more_in_the_intersection: page_object['more_in_the_intersection'],
        more_in_the_sub_intersection: page_object['more_in_the_sub_intersection']
    });

    GLOBALS.processed_page = processed_page;
    savePageToS3(callback);
}

function savePageToS3(callback) {
    var page_object = JSON.parse(GLOBALS.page_object),
        param = {
            ACL: 'public-read',
            Bucket: GLOBALS.BUCKET,
            Key: `${page_object.page.html_key}.html`,
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
                "page_url": `${s3.endpoint.href}${GLOBALS.BUCKET}/${page_object.page.html_key}.html`
            });
        }
    });
}