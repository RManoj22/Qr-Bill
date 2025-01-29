# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("generate-qr/<str:session_id>/", views.generate_qr_code, name="generate_qr"),
]