const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const ejs = require('./ejs.min.js');
const { Client, types } = require('pg');
const params = {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: process.env.PG_DB,
    user: process.env.PG_DB_USER,
    password: process.env.PG_DB_PASSWORD
};
types.setTypeParser(20, function (val) {
    return parseInt(val)
});
let GLOBALS = {};
const client = new Client(params);


exports.handler = (event, context, callback) => {
    var r = event.Records[0].cf.request,
        r_bucket,
        r_path,
        res = event.Records[0].cf.response;

    r_bucket = r.origin.s3.domainName.split('.s3.amazonaws.com')[0];
    r_path = r.uri.substring(1, r.uri.length);

    s3.getObject({ "Bucket": r_bucket, "Key": r_path }, (error, file) => {
        if (error) callback(error);

        if (file.ContentType === 'application/json') {
            var page_object = JSON.parse(file.Body.toString('utf-8')),
                page = page_object.page;
            GLOBALS.page_object = page_object;
            if (page.layout.template_page_endpoint && page.layout.template_page_bucket) {
                fetchStreamData()
            }
        } else {
            callback(null, file);
        }
    });

    function fetchStreamData() {
        let stream_query = `select * from page_objects where page_id = ${GLOBALS.page_object.page.id}`;
        client.query(stream_query, (error, data) => {
            if (error) callback(error);
            let stream_data = data.rows,
                split_string,
                streams_mapping = {};

            switch (GLOBALS.page_object.layout.name) {
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

            stream_data.forEach(s => {
                var column = s["title"].split(split_string)[1];
                if (streams_mapping[column] && streams_mapping[column].constructor === Array) {
                    streams_mapping[column].push(s);
                } else {
                    streams_mapping[column] = [s];
                }
            });

            GLOBALS.stream_data = stream_data;
            GLOBALS.streams_mapping = streams_mapping;

            fetchTemplatePage();
        });
    }

    function fetchTemplatePage() {
        let params = {
            Bucket: GLOBALS.page_object.page.layout.template_page_bucket,
            Key: GLOBALS.page_object.page.layout.template_page_endpoint
        };

        s3.getObject(params, (error, file) => {
            if (error) callback(error);
            let ejs_string = new Buffer(file.Body, 'base64').toString("utf-8"),
                page_object = GLOBALS.page_object,
                page = page_object.page,
                processed_page;

            processed_page = ejs.render(ejs_string, {
                page: page,
                streams: GLOBALS.stream_data,
                site: GLOBALS.page_object.site_attributes,
                streams_mapping: GLOBALS.streams_mapping,
                AWS_S3_ENDPOINT: "https://cdn.protograph.pykih.com",
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

            var response = {
                status: '200',
                statusDescription: 'OK',
                headers: {
                    'cache-control': [{
                        key: 'Cache-Control',
                        value: 'max-age=100'
                    }],
                    'content-type': [{
                        key: 'Content-Type',
                        value: 'text/html'
                    }],
                    'content-encoding': [{
                        key: 'Content-Encoding',
                        value: 'UTF-8'
                    }],
                },
                body: processed_page
            };

            callback(null, response);
        });
    }
};