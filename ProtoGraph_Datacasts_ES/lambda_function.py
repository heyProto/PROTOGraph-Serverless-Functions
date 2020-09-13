from boto3 import client as boto3_client
import boto3
import json
import hashlib
import http.client


lambda_client = boto3_client('lambda')
s3 = boto3.resource('s3')


def add_item(event):
    # development endpoints are in the form http://ip_address:9200/developer_name-
    # to form a connection only the ip is required and not http
    if event["elasticsearch_metadata"]["rails_env"] == "development":
        elasticsearch_endpoint = "/".join(event["elasticsearch_metadata"]["endpoint"].split("/")[2:-1])
        elasticsearch_index = event["elasticsearch_metadata"]["endpoint"]. \
                              split("/")[-1] + \
                              event["elasticsearch_metadata"]["index_name"]
    else:
        elasticsearch_endpoint = "/".join(event["elasticsearch_metadata"]["endpoint"].split("/")[2:])
        elasticsearch_index = event["elasticsearch_metadata"]["index_name"]

    elasticsearch_id = event["elasticsearch_data"]["view_cast_id"]
    headers = {'Content-type': 'application/json',
               "Accept": "application/json"}
    body = json.dumps(event["elasticsearch_data"]["data"]).encode()
    # POST request to /index_name/view_cast/id
    conn = http.client.HTTPConnection(elasticsearch_endpoint)
    conn.request("POST",
                 "/{}/{}/{}".format(elasticsearch_index,
                                    "view_cast",
                                    elasticsearch_id),
                 body,
                 headers)

    response = conn.getresponse()
    data = json.loads(response.read().decode("utf-8"))

    card_data = json.dumps(event["elasticsearch_data"]["data"])
    print(card_data)
    print("Elastic search\nIndex: {}\tType: {}\tID: {}".format(elasticsearch_index, "view_cast", elasticsearch_id))
    if data["_shards"]["successful"]:
        s3bucket = s3.Bucket(event["bucket"])
        key = event["api_slug"] + "/data.json"
        print(key)
        s3bucket.put_object(
            Key=key,
            ACL='public-read',
            Body=bytes(card_data, 'utf-8'),
            Bucket=event["bucket"],
            ContentType='application/json'
        )
        return 1
    else:
        return 0


def lambda_handler(event, context):

    bucket = event["bucket"]

    ###### Validate given JSON ######
    inner_json = {
        "json_data": json.dumps(event['elasticsearch_data']["data"]),
        "json_schema_url": event['schema_url']
    }
    msg = {
        "body-json": json.dumps(inner_json),
        "bucket-name": bucket
    }

    invoke_response = lambda_client.invoke(
        FunctionName="Haiku_Pub_ValidateJson",
        InvocationType='RequestResponse',
        Payload=json.dumps(msg)
    )

    invoke_response = json.loads(invoke_response['Payload'].read())
    print(invoke_response)

    if 'errorMessage' in invoke_response:
        error = json.loads(invoke_response['errorMessage'])['Error']
        response = {"status": 400, "Error": "Invalid JSON:" + error}
        raise Exception(json.dumps(response))

    ###### Validate JSON end ######

    payload = event["elasticsearch_data"]["data"]["data"]

    print(payload)
    print("Data does not exist. Add data. Call add_item()")
    success = add_item(event)
    if success == 1:
        return {"message": "Data Added successfully."}
    else:
        response = {"status": 500, "Error": "Couldn't save given JSON"}
        raise Exception(json.dumps(response))

    ###### Check If Item exists end #####
