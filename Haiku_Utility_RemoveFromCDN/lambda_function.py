import json
import boto3
import botocore
import base64

print('Loading function')


def delete_file(event, context):
    
    s3 = boto3.resource("s3")
    
    bucket_name = event['bucket-name']
    inner_json = json.loads(event['body-json'])
    
    file_url = inner_json['file_url']
    file_key = file_url.split(bucket_name+"/")[1]
    
    exists = ""
    try:
        s3.Object(bucket_name, file_key).load()
    except botocore.exceptions.ClientError as e:
        exists = False
    else:
        exists = True
    
    if exists == False:
        response = { "status":404, "ErrorMessage":"File ("+bucket_name+"/"+file_key+") Not Found"}
        raise Exception(json.dumps(response))
    
    bucket = s3.Bucket(bucket_name)
    obj = bucket.Object(file_key)
    
    print(bucket_name + " " + file_key)
    
    objects_to_delete = []
    objects_to_delete.append({"Key":obj.key})
    
    bucket.delete_objects(
        Delete={
            'Objects':objects_to_delete
            }
        )
    return {"Result": "Deleted %s/%s" % (bucket_name, file_key)} 
    #raise Exception('Something went wrong')
    
    
