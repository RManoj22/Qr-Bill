# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("generate-qr/<str:session_id>/", views.generate_qr_code, name="generate_qr"),
    path("upload/<str:session_id>/", views.FileUploadView.as_view(), name="upload_file"),
    path("delete/<str:session_id>/", views.FileUploadView.as_view(), name="delete_file"),
]