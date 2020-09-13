import json
from jsonschema import validate
import boto3
import botocore


def handler(event, context):
    
    print(event)
    
    json_data = {}
    
    # TODO - Catch JSONdecode Exception.
    try:
        inner_json = json.loads(event["body-json"])
        json_data = json.loads(inner_json["json_data"])
    except Exception as e:
        response = { "status":400, "Error":str(e)}
        raise Exception(json.dumps(response))
    
    
    
    json_schema_url = inner_json["json_schema_url"]
    
    bucket_name = event["bucket-name"] 
    
    
    s3 = boto3.resource('s3')
    bucket = s3.Bucket(bucket_name) 
    bucket_key = json_schema_url.split(bucket_name+"/")[1]
    obj = bucket.Object(bucket_key)
    
    #TODO: check if file exists
    json_schema = json.loads(obj.get()['Body'].read())
    

    
    valid = "ValidJson"
    try:
        validate(json_data, json_schema)
    except Exception as e:
        #print("Invalid Json")
        response = { "status":400, "Error":str(e)}
        raise Exception(json.dumps(response))
    
    
    return {
        "valid": "Yes",
        "matchedAgainst": bucket_name+"/"+bucket_key
    }