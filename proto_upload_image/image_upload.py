from boto3 import client as boto3_client
import boto3
import json
import base64

def lambda_handler(event, context):

    bucket = event["bucket"]
    s3_identifier = event['s3Identifier']
    image_blob = event['imageBlob']
    thumbnail_blob = event['thumbnailBlob']
    id = event['id']
    account_slug = event['accountSlug']

    # identifier = binascii.b2a_hex(os.urandom(10)).decode('utf-8')
    # parent_identifier = identifier
    # print(event)
    # base_64_image_blob = event['imageBlob']

    content_type = event['contentType']

    # image_width = event['imageWidth']
    # image_height = event['imageHeight']
    # file_name = event['name']

    s3 = boto3.resource("s3")
    bucket = s3.Bucket(bucket)
    image_extension = event['contentType'].split('/')[1]

    # tags = event['tags'] if event.get('tags', False) else []

    # images/accoutn_slug:/:image_s3_identifier/:id.[ext]
    key = "images/%s/%s/%s.%s" % (account_slug, s3_identifier, id, image_extension)
    dec = base64.b64decode(image_blob)
    obj = bucket.put_object(Key=key, ACL='public-read', Body=dec, ContentType=content_type, CacheControl="max-age=31536000")
    ss3 = boto3.client('s3')
    image_s3_url = '%s/%s/%s' % (ss3.meta.endpoint_url, bucket.name, obj.key)

    if thumbnail_blob:
        key = "images/%s/%s/thumb_%s.%s" % (account_slug, s3_identifier, id, image_extension)
        dec = base64.b64decode(thumbnail_blob)
        obj = bucket.put_object(Key=key, ACL='public-read', Body=dec, ContentType=content_type, CacheControl="max-age=31536000")
        ss3 = boto3.client('s3')
        thumb_image_s3_url = '%s/%s/%s' % (ss3.meta.endpoint_url, bucket.name, obj.key)
        return {
            "status":200,
            "success": True,
            "message": "Image added successfully.",
            "data": {
                "image_url": image_s3_url,
                "thumbnail_url": thumb_image_s3_url,
                "image_key": "images/%s/%s/%s.%s" % (account_slug, s3_identifier, id, image_extension),
                "thumbnail_key": "images/%s/%s/thumb_%s.%s" % (account_slug, s3_identifier, id, image_extension)
            }
        }
    else:
        return {
            "status":200,
            "success": True,
            "message": "Image added successfully.",
            "data": {
                "image_url": image_s3_url,
                "image_key": "images/%s/%s/%s.%s" % (account_slug, s3_identifier, id, image_extension)
            }
        }

    # row = table.put_item(
    #     Item = {
    #         "id": identifier,
    #         "url": s3_url,
    #         "image_name": file_name,
    #         "content_type": event['contentType'],
    #         "image_width": image_width,
    #         "image_height": image_height,
    #         "tags": tags,
    #         "versions": []
    #     }
    # )

    # if row['ResponseMetadata']['HTTPStatusCode'] == 200:
    #     return {"status":200, "success": True, "message": "Image added successfully.", "s3_url": s3_url }
    # else:
    #     return {"status": 422, "success": False, "message": "Image cannot be added to database.", "s3_url": s3_url }