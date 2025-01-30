# views.py
import os
import boto3
import qrcode
from dotenv import load_dotenv
from django.http import HttpResponse
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser

load_dotenv()

frontend_url = os.getenv("FRONTEND_URL")


def generate_qr_code(request, session_id):
    # Create a QR code with sessionId as a query parameter
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    # Use query param instead
    qr.add_data(f"{frontend_url}/mobile_upload?sessionId={session_id}")
    qr.make(fit=True)

    img = qr.make_image(fill="black", back_color="white")

    response = HttpResponse(content_type="image/png")
    img.save(response, "PNG")
    return response


# AWS S3 credentials from environment variables
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_DEFAULT_REGION = os.getenv("AWS_DEFAULT_REGION")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

# Initialize the S3 client
s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_DEFAULT_REGION
)


class FileUploadView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request, session_id):
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return JsonResponse({"error": "No file uploaded"}, status=400)

        try:
            # Create a unique file name
            file_name = f"{session_id}/{uploaded_file.name}"

            # Upload to S3 with public access
            s3_client.upload_fileobj(
                uploaded_file,
                S3_BUCKET_NAME,
                file_name
            )

            # Construct the file URL
            file_url = f"https://{S3_BUCKET_NAME}.s3.{AWS_DEFAULT_REGION}.amazonaws.com/{file_name}"

            return JsonResponse({"message": "File uploaded successfully!", "file_url": file_url})

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    def delete(self, request, session_id):
        file_name = request.GET.get("file_name")
        if not file_name:
            return JsonResponse({"error": "Missing file_name parameter"}, status=400)

        try:
            object_key = f"{session_id}/{file_name}"
            
            s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=object_key)
            

            return JsonResponse({"message": "File deleted successfully!"})

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
