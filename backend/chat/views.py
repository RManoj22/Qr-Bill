# views.py
import qrcode
from django.http import HttpResponse

def generate_qr_code(request, session_id):
    # Create a QR code with the session ID
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(f"http://localhost:5173/mobile_upload/{session_id}")
    qr.make(fit=True)

    # Convert QR code to an image
    img = qr.make_image(fill="black", back_color="white")

    # Return the image as an HTTP response
    response = HttpResponse(content_type="image/png")
    img.save(response, "PNG")
    return response


# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser

class FileUploadView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request, session_id):
        # Get the uploaded file
        uploaded_file = request.FILES.get("file")

        if not uploaded_file:
            return Response({"error": "No file uploaded"}, status=400)

        # Process the file (e.g., save it to the database or disk)
        # Example: Save the file to disk
        with open(f"uploads/{uploaded_file.name}", "wb+") as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)

        # Notify the WebSocket consumer about the successful upload
        # (You'll need to implement this part using Django Channels)

        return Response({"message": "File uploaded successfully!"})