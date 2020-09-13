import json
import boto3
import base64


print('Loading function')


def upload_file(event, context):
    bucket_name = event['bucket-name']
    base_64_file = event['body-json']['binary_file']
    key = event['body-json']['key']
    s3 = boto3.resource("s3")
    print("Publishing to prod")
    bucket = s3.Bucket(bucket_name)
    content_type = event['body-json']['content_type']
    dec = base64.b64decode(base_64_file)
    obj = bucket.put_object(Key=key, ACL='public-read', Body=dec, ContentType=content_type)
    ss3 = boto3.client('s3')
    return [{"s3_endpoint": '%s/%s/%s' % (ss3.meta.endpoint_url, bucket.name, obj.key)}]  # Echo back the first key value
    #raise Exception('Something went wrong')
    
    
