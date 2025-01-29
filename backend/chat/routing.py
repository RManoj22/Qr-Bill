from django.urls import re_path, path
from . import consumers

websocket_urlpatterns = [ # Added ^ for exact match
    path('ws/upload/', consumers.UploadConsumer.as_asgi()),
]
