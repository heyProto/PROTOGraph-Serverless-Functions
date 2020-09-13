import boto3
import urllib.request
from io import BytesIO
import os
import pydub
from pydub import AudioSegment

FFMPEG_PATH = "./ffmpeg"
s3 = boto3.resource('s3')


def push_to_s3(file_object, bucket_name, key):
    """
    http://boto3.readthedocs.io/en/latest/reference/services/s3.html#S3.Bucket.upload_file
    """
    s3bucket = s3.Bucket(bucket_name)
    s3bucket.upload_fileobj(file_object, key)


def lambda_handler(event, context):

    """
    Takes the url of an audio file and returns
    a clipped version depending on start_time
    and end_time
    """
    # event = {
    #   "original_filename": str,
    #   "start_time": int,
    #   "end_time": int,
    #   "audio_id": int,
    #   "audio_variation_id": int,
    #   "api_slug": str,
    #   "file_url": str,
    # }

    # Set the path as described here:
    # https://aws.amazon.com/blogs/compute/running-executables-in-aws-lambda/

    os.environ["PATH"] = os.environ["PATH"] + \
                         ":" + os.environ["LAMBDA_TASK_ROOT"]

    pydub.AudioSegment.ffmpeg = FFMPEG_PATH
    original_filename = event["original_filename"]
    file_url = event["file_url"]

    try:
        file_bytes = urllib.request.urlopen(file_url).read()
        file_object = BytesIO(file_bytes)
    except Exception as e:
        print(e)
        raise

    # Time indices
    start_time = event["start_time"] * 1000
    end_time = event["end_time"] * 1000

    filename, file_extension = os.path.splitext(original_filename)
    file_extension = file_extension.strip(".")

    # Library has native functions for mp3 and wav
    if file_extension == "mp3":
        audio = AudioSegment.from_mp3(file_object)
    elif file_extension == "wav":
        audio = AudioSegment.from_wav(file_object)
    else:
        audio = AudioSegment.from_file(file_object, file_extension)

    cropped_audio = audio[start_time:end_time]

    end_filename = filename + "-changed" + "." + file_extension
    key = "audios" + "/testing/" + end_filename
    m = cropped_audio.export("/tmp/{}".format(end_filename),
                             format=file_extension)

    push_to_s3(m, event["bucket"], key)
    os.remove(m.name)
