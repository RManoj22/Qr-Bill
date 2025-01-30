from asgiref.sync import async_to_sync
import socketio

# Initialize the Socket.IO server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins="*")

# A dictionary to store connections with their respective session IDs
session_to_sid = {}

# Connect event: Handle when a client connects
@sio.event
async def connect(sid, environ):
    print("\n\n==================== NEW CONNECTION ====================")
    print(f"Client {sid} connected")
    await sio.emit("message", {"data": "Welcome!"}, to=sid)
    print(f"Active Connections: {len(session_to_sid)}")
    print("=========================================================\n")

# Disconnect event: Handle when a client disconnects
@sio.event
async def disconnect(sid):
    print("\n\n==================== DISCONNECTION ====================")
    # Find and remove the session ID from the mapping when a client disconnects
    session_id = session_to_sid.get(sid)
    if session_id:
        print(f"Session {session_id}'s connection disconnected (SID: {sid})")
        del session_to_sid[sid]
    else:
        print(f"No session ID found for SID: {sid}")
    print(f"Active Connections: {len(session_to_sid)}")
    print("=========================================================\n")

# Register event: Handle when a new session registers
@sio.event
async def register(sid, data):
    print("\n\n==================== NEW SESSION REGISTRATION ====================")
    """
    Handle the registration of a new session.
    """
    print(f"Registering new session: {data['session_id']}")
    
    # Store the session_id and sid mapping
    session_to_sid[sid] = data['session_id']
    
    # Emit message confirming registration
    await sio.emit("message", {"data": f"Session {data['session_id']} registered!"}, to=sid)
    
    print(f"Session {data['session_id']} successfully registered!")
    print(f"Active Connections: {len(session_to_sid)}")
    print("=========================================================\n")
    
    return {"success": True, "message": f"Session {data['session_id']} registered!"}

# Custom function to send a message to a specific session
@sio.event
async def send_message_to_session(sid, message):
    print("\n\n==================== SEND MESSAGE ====================")
    # Check the type of message (text or file URL)
    print("message value from frontend:", message)
    message_type = message.get("type", "text")  # Default to 'text' if no type is provided
    session_id = message.get("session_id")

    if session_id:
        if message_type == "file":
            # Handle file URL message
            print("message type is file")
            file_url = message.get("message")
            if file_url:
                print("file url from frontend:", file_url)
                await sio.emit("message", {"data": "File uploaded", "url": file_url, "type": "file"}, to=session_id)
                print(f"Sent file URL to session {session_id}: {file_url}")
            else:
                print("No file URL provided in the message.")
        else:
            # Handle text message
            text_message = message.get("message")
            if text_message:
                await sio.emit("message", {"data": text_message}, to=session_id)
                print(f"Sent message to session {session_id}: {text_message}")
            else:
                print("No text message provided.")
    else:
        print(f"Session {session_id} not found.")
    
    print("=========================================================\n")
