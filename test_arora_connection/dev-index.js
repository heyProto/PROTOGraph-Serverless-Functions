const { Client, types } = require('pg');
types.setTypeParser(20, function (val) {
    return parseInt(val)
});

const siteTableOID = 33536,
    pageTableOID = 33465,
    templatePageOID = 33598;

const params = {
    host: "localhost",
    port: 5432,
    database: 'pykih_publishing_dev2',
    user: 'developer',
    password: 'developer'
};
const client = new Client(params);
var event = {}
// exports.handler = (event, context, callback) => {

    var page_id = event['page_id'] || 7;

    client.connect()
        .then(success => { console.log("Connected to DB") })
        .catch(error => {
            console.log("Error Connecting to DB", error)
            // callback(null, { success: false, message: "Failed to connect to the data." });
        });

    let page_site_query = `select * from pages as p inner join sites as s on p.site_id = s.id inner join template_pages as tp on p.template_page_id = tp.id where p.id = ${page_id}`,
        stream_query = `select * from page_objects where page_id = ${page_id}`;

    Promise.all([client.query(page_site_query), client.query(stream_query)])
        .then((results) => {
            let page_site_result = results[0],
                stream_result = results[1],
                page_site_fields = page_site_result.fields,
                page_site_data = page_site_result.rows,
                stream_data = stream_result.rows,
                page_fields = page_site_fields.filter(e => e.tableID === pageTableOID),
                site_fields = page_site_fields.filter(e => e.tableID === siteTableOID),
                template_page_field = page_site_fields.filter(e => e.tableID === templatePageOID),
                template_page_data = {},
                site_data = {},
                page_data = {},
                split_string,
                streams_mapping = {};

            page_fields.forEach(d => {
                page_data[d.name] = page_site_data[0][d.name];
            });
            site_fields.forEach(d => {
                site_data[d.name] = page_site_data[0][d.name];
            });
            template_page_field.forEach(d => {
                template_page_data[d.name] = page_site_data[0][d.name];
            });

            switch (template_page_data.name) {
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

            // callback(null, { success: true, data: [page_site_query, stream_result] });
            client.end();
        }).catch(error => {
            console.log("ERROR", error);
            // callback(null, { success: false, message: "Failed to execute the query", error: error });
            client.end();
        });
// };