import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom"; // Hook to access query params
import { io } from "socket.io-client";

const MobileUpload = () => {
  const [sessionId, setSessionId] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null); // Socket state for maintaining the socket connection
  const [externalSessionId, setExternalSessionId] = useState(null); // State for external session ID
  const [searchParams] = useSearchParams(); // Get query params from URL

  useEffect(() => {
    // Extract the sessionId from URL query parameters
    const externalSessionId = searchParams.get("sessionId"); // This will fetch ?sessionId=xyz
    console.log("Session ID from URL:", externalSessionId);

    // Store the external session ID in state
    setExternalSessionId(externalSessionId);

    // Create a new WebSocket connection, which will generate a new session ID
    // const socket = io("http://localhost:8000");
    const socket = io(import.meta.env.VITE_BACKEND_BASE_URL);

    socket.on("connect", () => {
      console.log("WebSocket connected successfully!");
      console.log("New WebSocket connection SID:", socket.id); // Log the connection SID

      // Set the session ID as the WebSocket's ID (new session for this client)
      setSessionId(socket.id);
    });

    socket.on("message", (data) => {
      console.log("Received message from server:", data); // Log received messages
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
    });

    setSocket(socket);

    // Cleanup on component unmount
    return () => {
      console.log("Closing WebSocket connection...");
      socket.close();
    };
  }, [searchParams]); // Depend on searchParams to re-run if the query param changes

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file || !sessionId) return;
  
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_source", "mobile"); // Add a flag to indicate mobile upload
    setLoading(true);
  
    try {
      const uploadUrl = `http://127.0.0.1:8000/api/bill/upload/${sessionId}/`;
      const response = await fetch(uploadUrl, { method: "POST", body: formData });
      if (!response.ok) throw new Error(`Upload failed with status ${response.status}`);
  
      const data = await response.json();
      setFileUrl(data.file_url);
  
      // Send a notification to the external session (from the URL) once the file is uploaded
      if (externalSessionId && socket && socket.connected) {
        console.log("Sending WebSocket notification to external session:", externalSessionId);
  
        const userMessage = {
          session_id: externalSessionId,
          message: data.file_url,
          type: 'file',
          uploaded_from:'mobile'
        };
  
        socket.emit("send_message_to_session", userMessage, (response) => {
          console.log("Response from server after message emission:", response);
        });
      } else {
        console.error("WebSocket is not connected or external session ID is missing.");
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleReupload = async () => {
    if (!fileUrl || !sessionId) return;

    const fileName = fileUrl.split("/").pop();

    try {
      const deleteUrl = `http://127.0.0.1:8000/api/bill/delete/${sessionId}/?file_name=${fileName}`;
      const response = await fetch(deleteUrl, { method: "DELETE" });

      if (!response.ok) {
        throw new Error(`Delete request failed with status ${response.status}`);
      }

      console.log("File deleted successfully");
      setFileUrl(null);
    } catch (error) {
      console.error("Failed to delete file:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
      <h2 className="text-xl font-semibold">Upload Your Bill</h2>
      {loading ? (
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 11-8 8z"></path>
          </svg>
          <p className="mt-2 text-gray-600">Uploading...</p>
        </div>
      ) : !fileUrl ? (
        <>
          <label className="px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer">
            Capture with Camera
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
          </label>

          <label className="px-4 py-2 bg-green-500 text-white rounded-lg cursor-pointer">
            Upload from Gallery
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </>
      ) : (
        <div className="mt-4 flex flex-col items-center">
          <h3 className="text-lg font-semibold">Upload Successful!</h3>
          <p className="mt-2 text-gray-600">Your file has been uploaded successfully.</p>
          <div className="mt-4 flex gap-4">
            <button className="px-4 py-2 bg-red-500 text-white rounded-lg" onClick={handleReupload}>
              Re-upload
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileUpload;
