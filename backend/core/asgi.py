import os
import django
from django.core.asgi import get_asgi_application
import socketio
from chat.sockets import sio  # Import your event handlers

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

django_asgi_app = get_asgi_application()
application = socketio.ASGIApp(sio, django_asgi_app)
