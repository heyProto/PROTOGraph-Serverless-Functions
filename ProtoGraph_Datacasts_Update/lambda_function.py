from boto3 import client as boto3_client
import boto3
import json
import hashlib
import datetime
import base64

lambda_client = boto3_client('lambda')
db = boto3.resource('dynamodb')
s3 = boto3.resource('s3')

def add_item(event, payload_string, payload_hash):

    r = table.update_item(
        Key={
            "api_slug" : event["api_slug"]
        },
        UpdateExpression='SET latest_data = :val1, payload = :val2, hashcode = :val3',
        ExpressionAttributeValues={
            ':val1': str(datetime.datetime.now()),
            ':val2': payload_string,
            ':val3': payload_hash
        }
    )
    print("=============")
    print(event)
    print("=============")
    if r['ResponseMetadata']['HTTPStatusCode'] == 200:
        s3bucket = s3.Bucket(event["bucket"])
        key =  event["api_slug"] + "/data.json"
        print(key)
        obj = s3bucket.put_object(
            Key=key,
            ACL='public-read',
            Body=bytes(payload_string, 'utf-8'),
            Bucket = event["bucket"],
            ContentType = 'application/json'
        )
        return 1
    else:
        return 0

def update_item(event):
    r = table.update_item(
        Key={
            "api_slug" : event["api_slug"]
        },
        UpdateExpression='SET latest_data = :val1',
        ExpressionAttributeValues={
            ':val1': str(datetime.datetime.now())
        }
    )
    print(r)
    return 1 if r['ResponseMetadata']['HTTPStatusCode'] == 200 else 0

def lambda_handler(event, context):

    print(event)

    global table
    table = db.Table(event["table"])
    print(type(event['payload']))
    print('=================')
    bucket = event["bucket"]

    ###### Validate given JSON ######
    inner_json = {
        "json_data" : event['payload'],
        "json_schema_url": event['schema_url']
    }
    msg = {
        "body-json": json.dumps(inner_json),
        "bucket-name": bucket
    }

    invoke_response = lambda_client.invoke(FunctionName="Haiku_Pub_ValidateJson",
                                           InvocationType='RequestResponse',
                                         Payload=json.dumps(msg))

    invoke_response = json.loads(invoke_response['Payload'].read())
    print(invoke_response)
    print("================")
    if 'errorMessage' in invoke_response:
        error = json.loads(invoke_response['errorMessage'])['Error']
        response = { "status":400, "Error": "Invalid JSON:"+error}
        raise Exception(json.dumps(response))
    ###### Validate JSON end ######

    payload = json.loads(event["payload"])
    schema_url = event["schema_url"]
    bucket = event["bucket"]

    ###### Calculate Hash of Payload ######
    payload_string = json.dumps(payload)
    payload_hash = hashlib.md5(payload_string.encode('utf-8')).hexdigest()
    print(payload_hash)
    ###### Calculate Hash end ######

    ###### Check if Item exists ######
    response = table.get_item(
        Key = {
            "api_slug" : event["api_slug"]
        }
    )

    if 'Item' in response:
        print("Data already exists")
        print(response["Item"])

        if response["Item"]["hashcode"] == payload_hash:
            print("Hash is also equal. Don't insert. Modify 'latest_data'")
            success = update_item(event)
            if success == 1:
                return {"message" : "Hash equal. Date modified successfully."}
            else:
                response = { "status":500, "Error": "Couldn't save given JSON"}
                raise Exception(json.dumps(response))

        else:
            print("Hash unequal. Add data. Call add_item()")

            if 'push_to_s3' in invoke_response:
                s3bucket = s3.Bucket(bucket)

                push_to_s3 = json.loads(invoke_response['push_to_s3'])
                print("Push to s3 in JSON Schema")
                for path in push_to_s3:
                    print(path)
                    path = path.split('/')
                    base64_image_string = payload
                    key = event["api_slug"]

                    path_to_image = {}
                    for i in path:
                        path_to_image = base64_image_string
                        base64_image_string = base64_image_string[i]
                        key = key + "/" + i

                    if base64_image_string[0:4] == "http":
                        print("URL")
                        continue

                    image_tokens = base64_image_string.split(';')
                    image_type = image_tokens[0].split('/')[1]
                    base64_image_string = image_tokens[-1].split(',')[1]

                    key = key + "." + image_type
                    base_s3_url = "https://s3.ap-south-1.amazonaws.com/" + bucket + "/" + key
                    path_to_image[path[-1]] = base_s3_url

                    print(key)
                    print(image_type)
                    print(base64_image_string[0:10])
                    print(path_to_image[path[-1]])
                    obj = s3bucket.put_object(
                        Key=key,
                        ACL='public-read',
                        Body= base64.b64decode(base64_image_string),
                        Bucket = event["bucket"],
                        ContentType = 'image/'+image_type
                    )


                print("Changed base64 strings to URL's. Calculate new hash")
                payload_string = json.dumps(payload)
                payload_hash = hashlib.md5(payload_string.encode('utf-8')).hexdigest()

            success = add_item(event, payload_string, payload_hash)
            if success == 1:
                return {"message" : "Hash unequal. Data Added successfully."}
            else:
                response = { "status":500, "Error": "Couldn't save given JSON"}
                raise Exception(json.dumps(response))

    else:
        response = { "status":404, "Error": "Data not found"}
        raise Exception(json.dumps(response))

    ###### Check If Item exists end #####

