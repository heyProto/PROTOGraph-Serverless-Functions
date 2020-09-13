const RequireFromURL = require('require-from-url/sync');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const ejs = require('./ejs.min.js');
const { Client, types } = require('pg');
const ssr_card_code = RequireFromURL('https://cdn.protograph.pykih.com/lib/ssr-cards.min.js');
const minify = require('html-minifier').minify;
const minify_options = { collapseWhitespace: true, removeComments: true };
const request = require('request');
const zlib = require('zlib');

const params = {
    host: "protoprod-ap-south-1b.c3w3jnyclfzv.ap-south-1.rds.amazonaws.com",
    port: 5432,
    database: "protograph_prod",
    user: "ProtoDBUser",
    password: "91484e32e11d50f43764cf53279ac9ed"
};

types.setTypeParser(20, function (val) {
    return parseInt(val);
});
let GLOBALS = {};

function getObjectS3(params) {
    return new Promise((resolve, reject) => {
        s3.getObject(params, (error, file) => {
            if (error) reject(error);
            resolve(file);
        });
    });
}

function dbQuery(query, client) {
    return new Promise((resolve, reject) => {
        client.query(query, (error, data) => {
            if (error) reject(error);
            resolve(data);
        });
    });
}

function promisedRequest(url) {
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (error) reject(error);
            resolve(body);
        });
    });
}

exports.handler = (event, context, callback) => {
    const client = new Client(params);
    var r = event.Records[0].cf.request,
        r_bucket,
        r_path,
        res = event.Records[0].cf.response;

    r_bucket = r.origin.s3.domainName.split('.s3.amazonaws.com')[0];
    r_path = r.uri.substring(1, r.uri.length);

    let fetchPageJSON = getObjectS3({ "Bucket": r_bucket, "Key": r_path }).then(file => {
        if (file.ContentType === 'application/json') {
            var page_object = JSON.parse(file.Body.toString('utf-8')),
                page = page_object.page;
            GLOBALS.page_object = page_object;
            if(page_object.streams){
                GLOBALS.streams={};
                page_object.streams.forEach(function(stream){
                    var split_string;
                    switch(stream.title){
                        case "11_Data_Grid":
                            split_string = "Grid";
                            break;

                        case "11_Data_16c_Hero":
                            split_string = "16c_Hero";
                            break;

                        case "11_Data_credits":
                            split_string = "Credits";
                            break;

                    }
                    GLOBALS.streams[split_string] = stream;
                })
            }
            if (page && page.layout.template_page_endpoint && page.layout.template_page_bucket) {
                let stream_query = `select * from page_objects where page_id = ${GLOBALS.page_object.page.id}`,
                    all_promises = [], series_query = "", intersection_query = "", sub_intersection_query = "";
                client.connect();
                if (page.layout.name == 'article') {
                    all_promises = [
                        dbQuery(stream_query, client),
                        promisedRequest(page_object.vertical_header_json_url),
                        promisedRequest(page_object.homepage_header_json_url),
                        promisedRequest(page_object.site_header_json_url)
                    ];
                    if(page.ref_category_series_id) {
                        series_query = `select * from page_objects where view_cast_id in (Select id from view_casts where ref_category_vertical_id= ${page.ref_category_series_id}) and template_card_id = '18' limit 4`;
                        all_promises.push(dbQuery(series_query, client))
                    } else {
                        all_promises.push(Promise.resolve());
                    }
                    if(page.ref_category_intersection_id) {
                        intersection_query = `select * from page_objects where view_cast_id in (Select id from view_casts where ref_category_vertical_id= ${page.ref_category_intersection_id} and template_card_id = '18')  limit 4`;
                        all_promises.push(dbQuery(intersection_query, client))
                        all_promises.push(Promise.resolve());
                    }
                    if (page.ref_category_sub_intersection_id) {
                        sub_intersection_query = `select * from page_objects where view_cast_id in (Select id from view_casts where ref_category_vertical_id= ${page.ref_category_sub_intersection_id} and template_card_id = '18')  limit 4`;
                        all_promises.push(dbQuery(sub_intersection_query, client))
                        all_promises.push(Promise.resolve());
                    }
                } else {
                    all_promises = [
                        dbQuery(stream_query, client),
                        promisedRequest(page_object.vertical_header_json_url),
                        promisedRequest(page_object.homepage_header_json_url),
                        promisedRequest(page_object.site_header_json_url)
                    ]
                }

                return Promise.all(all_promises);
            }
            // File is a JSON file but not a page_object.json
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
                        value: 'application/json'
                    }],
                    'content-encoding': [{
                        key: 'Content-Encoding',
                        value: 'UTF-8'
                    }],
                    'access-control-allow-methods': [{
                        key: 'access-control-allow-methods',
                        value: 'GET'
                    }],
                    'access-control-allow-origin': [{
                        key: 'access-control-allow-origin',
                        value: '*'
                    }],
                    'access-control-max-age': [{
                        key: 'access-control-max-age',
                        value: '3000'
                    }]
                }
            };
            callback(null, response);
            return Promise.reject(null, true);
        } else {
            // File is not of type JSON.
            var res = {
                status: '200',
                statusDescription: 'OK',
                headers: {
                    'cache-control': [{
                        key: 'Cache-Control',
                        value: 'max-age=100'
                    }],
                    'content-type': [{
                        key: 'Content-Type',
                        value: file.ContentType
                    }],
                    'content-encoding': [{
                        key: 'Content-Encoding',
                        value: 'UTF-8'
                    }],
                    'access-control-allow-methods': [{
                        key: 'Access-Control-Allow-Methods',
                        value: 'GET'
                    }],
                    'access-control-allow-origin': [{
                        key: 'Access-Control-Allow-Origin',
                        value: '*'
                    }],
                    'access-control-max-age': [{
                        key: 'Access-Control-Max-Age',
                        value: '3000'
                    }]
                }
            };
            callback(null, res);
        }
    }).then((response) => {

        let data = response[0],
            page = GLOBALS.page_object.page,
            stream_data = data.rows,
            split_string,
            streams = [],
            streams_mapping = {};
        GLOBALS.vertical_header_json = JSON.parse(response[1]);
        GLOBALS.homepage_header_json = JSON.parse(response[2]);
        GLOBALS.site_header_json = JSON.parse(response[3]);

        switch (GLOBALS.page_object.page.layout.name) {
            case "Homepage: Vertical":
                split_string = "_Section_";
                streams = ["16c_Hero", "7c", "4c", "3c", "2c"];
                break;
            case "article":
                split_string = "_Story_";
                streams = ['Narrative', "Related"];
                break;
            default:
                split_string = "_Data_";
                streams = ["Grid", "16c_Hero", "credits", "footer"];
                break;
        }

        stream_data.forEach(s => {
            var column = s["title"].split(split_string)[1];
            if (streams_mapping[column] && streams_mapping[column].cards && streams_mapping[column].cards.length) {
                streams_mapping[column].cards.push(s);
            } else {
                streams_mapping[column] = {
                    name_of_stream: s.name_of_stream,
                    title: s.title,
                    stream_id: s.stream_id,
                    sort_order: s.sort_order,
                    cards: [s]
                };
            }
        });

        streams.forEach(e => {
            if (streams_mapping[e] === undefined) {
                streams_mapping[e] = { name_of_stream: `${page.id}_Section_${e}`, title: e, cards: [] }
            }
        })


        if (response[4] && response[4].rows) {
            let name_of_stream = 'More in Series';
            if(GLOBALS.page_object.hasOwnProperty("more_in_the_series")) {
                name_of_stream = GLOBALS.page_object['more_in_the_series']["title"]
            }
            streams_mapping['more_in_the_series'] = {title: 'More in Series', name_of_stream: name_of_stream, cards: []};
            response[4].rows.forEach(s => {streams_mapping['more_in_the_series'].cards.push(s);})

        }
        if (response[5] && response[5].rows) {
            let name_of_stream = 'More in Intersection';
            if(GLOBALS.page_object.hasOwnProperty("more_in_the_intersection")) {
                name_of_stream = GLOBALS.page_object['more_in_the_intersection']["title"]
            }
            streams_mapping['more_in_the_intersection'] = {title: 'More in Intersection', name_of_stream: name_of_stream, cards: []};
            response[5].rows.forEach(s => {streams_mapping['more_in_the_intersection'].cards.push(s);})

        }
        if (response[6] && response[6].rows) {
            let name_of_stream = 'More in Sub Intersection';
            if(GLOBALS.page_object.hasOwnProperty("more_in_the_sub_intersection")) {
                name_of_stream = GLOBALS.page_object['more_in_the_sub_intersection']["title"]
            }
            streams_mapping['more_in_the_sub_intersection'] = {title: 'More in Sub Intersection', name_of_stream: name_of_stream, cards: []};;
            response[6].rows.forEach(s => {streams_mapping['more_in_the_sub_intersection'].cards.push(s);})
        }

        GLOBALS.stream_data = stream_data;
        GLOBALS.streams_mapping = streams_mapping;

        let template_page_params = {
            Bucket: GLOBALS.page_object.page.layout.template_page_bucket,
            Key: GLOBALS.page_object.page.layout.template_page_endpoint
        };

        client.end();
        return getObjectS3(template_page_params);
    }).then(file => {
        let ejs_string = new Buffer(file.Body, 'base64').toString("utf-8"),
            page_object = GLOBALS.page_object,
            page = page_object.page,
            processed_page;

        console.log(GLOBALS.streams_mapping, "------")
        processed_page = ejs.render(ejs_string, {
            page: page,
            streams: GLOBALS.streams,
            site: GLOBALS.page_object.site_attributes,
            streams_mapping: GLOBALS.streams_mapping,
            template_page_s3: page.layout.template_page_endpoint.split('/')[0],
            ssr_card_code: ssr_card_code,
            AWS_S3_ENDPOINT: "https://cdn.protograph.pykih.com",
            vertical_header_json_url: page_object["vertical_header_json_url"],
            homepage_header_json_url: page_object["homepage_header_json_url"],
            site_header_json_url: page_object["site_header_json_url"],
            ref_category_object: page_object['ref_category_object'],
            navigation_json: page_object['navigation_json'],
            major_stream_blockquotes: page_object['major_stream_blockquotes'],
            more_in_the_series: GLOBALS.streams_mapping['more_in_the_series'],
            more_in_the_intersection: GLOBALS.streams_mapping['more_in_the_intersection'],
            more_in_the_sub_intersection: GLOBALS.streams_mapping['more_in_the_sub_intersection'],
            vertical_header_json: GLOBALS.vertical_header_json,
            homepage_header_json: GLOBALS.homepage_header_json,
            site_header_json: GLOBALS.site_header_json,
            page_url: page_object['page_url'],
            page_author: page_object['page_author'],
            page_imageurl: page_object['page_imageurl']
        });
        //processed_page = zlib.gzipSync(processed_page).toString('utf8');
        processed_page = minify(processed_page, minify_options);

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
                }]
            },
            body: processed_page
        };

        callback(null, response);
    }).catch(error => {
        if (error) {
            client.end();
            callback(error);
            console.error(error, error.stack, "Error processing the request.");
        }
    });
};