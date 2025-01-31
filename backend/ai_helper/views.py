from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from core.utils.ai_handler import process_file_from_url


@api_view(["POST"])
def extract_from_file(request):
    """
    API View to process the uploaded file URL and return extracted JSON data.
    """
    file_url = request.data.get("file_url")
    print("file url from payload", file_url)
    if not file_url:
        return Response({"error": "file_url is required"}, status=status.HTTP_400_BAD_REQUEST)

    result = process_file_from_url(file_url)

    if "error" in result:
        return Response(result, status=status.HTTP_400_BAD_REQUEST)

    return Response({"success": True, "data": result}, status=status.HTTP_200_OK)
