import os
import boto3
from dotenv import load_dotenv
from botocore.exceptions import NoCredentialsError

# Load environment variables from .env file
load_dotenv()

# Get AWS credentials and S3 bucket name from the .env file
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_DEFAULT_REGION = os.getenv("AWS_DEFAULT_REGION")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

# Initialize S3 client
s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_DEFAULT_REGION
)

def upload_file_to_s3(file_path, bucket_name, object_name=None):
    """
    Upload a file to an S3 bucket and return the URL of the uploaded file.
    """
    if object_name is None:
        object_name = os.path.basename(file_path)

    try:
        # Upload the file to the S3 bucket
        s3_client.upload_file(file_path, bucket_name, object_name)
        # Get the public URL of the uploaded file
        file_url = f"https://{bucket_name}.s3.{AWS_DEFAULT_REGION}.amazonaws.com/{object_name}"
        print(f"File uploaded successfully! URL: {file_url}")
        return file_url

    except FileNotFoundError:
        print(f"File not found: {file_path}")
    except NoCredentialsError:
        print("Credentials not available.")
    except Exception as e:
        print(f"Error uploading file: {e}")
