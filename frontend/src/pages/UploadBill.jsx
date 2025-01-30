import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const UploadBill = () => {
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [qrUrl, setQrUrl] = useState(""); // Store the QR code URL

  useEffect(() => {
    console.log("useEffect triggered");

    // Establish a new socket connection
    const socket = io("http://localhost:8000");

    socket.on("connect", () => {
      console.log("WebSocket connected!");

      // Set the session ID received from the server
      const sessionID = socket.id; // Socket.IO gives us the session ID automatically
      setSessionId(sessionID);

      // Emit register event to the backend with the session ID
      socket.emit("register", { session_id: sessionID }, (response) => {
        if (response.success) {
          console.log("Successfully registered the new session");
        } else {
          console.error("Failed to register session:", response.message);
        }
      });

      setConnected(true);
    });

    // Listen for the 'message' event (this will handle the message from 'send_message_to_session')
    socket.on("message", (data) => {
      console.log("Message from another session:", data);

      // Check if the message type is 'file' before displaying
      if (data.type === "file") {
        // If data contains the message you want to display, ensure you handle it correctly
        // For example, if `data` is an object with a `message` key:
        setMessage(data.url || "No file URL received"); // Display the file URL
      }
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected!");
      setConnected(false);
    });

    return () => {
      console.log("Closing socket connection");
      socket.close();
    };
  }, []);

  useEffect(() => {
    if (sessionId) {
      console.log("Fetching QR code for session ID:", sessionId); // Debug log before fetching QR code

      fetch(`http://localhost:8000/chat/generate-qr/${sessionId}/`)
        .then((response) => response.blob())
        .then((imageBlob) => {
          const imageUrl = URL.createObjectURL(imageBlob);
          console.log("QR code fetched successfully:", imageUrl); // Debug log for fetched QR code URL
          setQrUrl(imageUrl);
        })
        .catch((error) => {
          console.error("Error fetching QR code:", error);
        });
    }
  }, [sessionId]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-600">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl mb-4">Upload Bill</h2>
        <p>Status: {connected ? "Connected" : "Not Connected"}</p>
        <p>Session ID: {sessionId}</p>

        {!fileUrl ? (
          <div>
            <h3 className="text-lg font-semibold">
              Scan this QR code to upload:
            </h3>
            {qrUrl ? (
              <div className="mt-4 p-4 bg-gray-300 rounded-lg">
                <img src={qrUrl} alt="QR Code" className="max-w-full h-auto" />
              </div>
            ) : (
              <p>Loading QR Code...</p>
            )}
            <p className="mt-4">Waiting for the file upload...</p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center">
            <h3 className="text-lg font-semibold">Upload Successful!</h3>
            <p className="mt-2 text-gray-600">
              Your file has been uploaded successfully.
            </p>
            <div className="mt-4">
              <img
                src={fileUrl}
                alt="Uploaded file preview"
                className="max-w-full h-auto"
              />
            </div>
            <div className="mt-4 flex gap-4">
              <button className="px-4 py-2 bg-red-500 text-white rounded-lg">
                Re-upload
              </button>
            </div>
          </div>
        )}

        {/* Display the message from the other connection */}
        {message && (
          <div className="mt-4 p-4 bg-green-200 text-black rounded-lg">
            <h4 className="font-semibold">Message from another connection:</h4>
            {/* If the message is a URL, display it as an image */}
            {message.match(/\.(jpeg|jpg|gif|png|webp)$/) ? (
              <div className="mt-2">
                <img
                  src={message}
                  alt="File Preview"
                  className="max-w-full h-auto"
                />
              </div>
            ) : (
              <p>{message}</p> // Display the message text if it's not a valid image URL
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadBill;
