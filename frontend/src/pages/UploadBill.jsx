import React, { useEffect, useState } from "react";

const UploadBill = () => {
  const [message, setMessage] = useState(""); // Message from the backend
  const [ws, setWs] = useState(null); // WebSocket instance
  const [connected, setConnected] = useState(false); // Connection status
  const [sessionId, setSessionId] = useState(null); // Session ID from the backend
  const [qrCodeUrl, setQrCodeUrl] = useState(null); // URL to the QR code image

  useEffect(() => {
    if (ws) {
      // Connection opened
      ws.onopen = () => {
        console.log("WebSocket connected!");
        setConnected(true);
      };

      // Listen for messages from the backend
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Message from server:", data);

        if (data.type === "session_id") {
          // Save the session ID and generate the QR code URL
          setSessionId(data.session_id);
          setQrCodeUrl(`http://localhost:8000/chat/generate-qr/${data.session_id}`);
        } else if (data.type === "upload_notification") {
          // Handle upload notifications
          setMessage(data.message);
          alert(data.message);
        }
      };

      // Handle WebSocket closure
      ws.onclose = () => {
        console.log("WebSocket disconnected!");
        setConnected(false);
      };

      // Handle WebSocket errors
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    }
  }, [ws]);

  const handleUploadBillClick = () => {
    // Establish WebSocket connection when "Upload Bill" is clicked
    const socket = new WebSocket("ws://127.0.0.1:8000/ws/upload/");
    setWs(socket);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-600">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl mb-4">Upload Bill</h2>
        <p>Status: {connected ? "Connected" : "Not Connected"}</p>
        <p>Message from server: {message}</p>

        {!connected && (
          <button
            onClick={handleUploadBillClick}
            className="px-6 py-3 text-white bg-green-500 rounded-lg hover:bg-green-600"
          >
            Upload Bill
          </button>
        )}

        {qrCodeUrl && (
          <div className="mt-4">
            <p>Scan this QR code to upload:</p>
            <img src={qrCodeUrl} alt="QR Code" className="mt-2" />
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadBill;