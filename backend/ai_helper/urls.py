from django.urls import path
from .views import extract_from_file

urlpatterns = [
    path("extract/", extract_from_file, name="extract_from_file"),
]
