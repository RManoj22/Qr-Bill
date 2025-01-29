# consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
import uuid

class UploadConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Generate a unique session ID for this WebSocket connection
        self.session_id = str(uuid.uuid4())
        await self.accept()
        print(f"WebSocket connected! Session ID: {self.session_id}")

        # Send the session ID to the frontend
        await self.send(text_data=json.dumps({
            "type": "session_id",
            "session_id": self.session_id,
        }))

    async def disconnect(self, close_code):
        print(f"WebSocket disconnected! Session ID: {self.session_id}")

    async def receive(self, text_data):
        # Handle any messages from the frontend (if needed)
        print(f"Received message: {text_data}")