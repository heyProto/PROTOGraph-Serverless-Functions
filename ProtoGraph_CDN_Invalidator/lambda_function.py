import boto3
import time

def lambda_handler(event, context):
    invalidation_items = event['invalidation_items'];
    if event['source'] == "Akamai":
        import requests, json
        from http_calls import EdgeGridHttpCaller
        from akamai.edgegrid import EdgeGridAuth
        creds = event['credentials']

        session = requests.Session()
        debug = False
        verbose = False
        section_name = "default"


        # Set the config options
        session.auth = EdgeGridAuth(
            client_token=creds['client_token'],
            client_secret=creds['client_secret'],
            access_token=creds['access_token']
        )

        baseurl = '%s://%s/' % ('https', creds['host'])
        httpCaller = EdgeGridHttpCaller(session, debug, verbose, baseurl)


        purge_obj = {
            "objects" : invalidation_items,
            "hostname": "",
            "action": "remove",
            "type": "arl",
            "domain": "production"
        }
        purge_post_result = httpCaller.postResult('/ccu/v3/invalidate/url', json.dumps(purge_obj))
        return {"success": True, "message": purge_post_result}

    else:
        if "distribution_id" in event and "credentials" in event:
            distribution_id = event['distribution_id'];
            quantity = event['quantity'];

            creds = event['credentials'];

            if distribution_id:
                client = boto3.client('cloudfront',aws_access_key_id=creds["aws_access_key_id"], aws_secret_access_key=creds['aws_secret_access_key'])
                invalidation = client.create_invalidation(DistributionId=distribution_id,
                    InvalidationBatch={
                        'Paths': {
                            'Quantity': quantity,
                            'Items': invalidation_items
                    },
                    'CallerReference': str(time.time())
                })
        return {"success": True, "message": invalidation}