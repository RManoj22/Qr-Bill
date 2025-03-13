import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom"; // Hook to access query params
import { io } from "socket.io-client";

const MobileUpload = () => {
  const [sessionId, setSessionId] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [sessionClosed, setSessionClosed] = useState(false);
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

      socket.emit("mobile_connected", {
        homeSessionId: externalSessionId, // Home page's session ID
        mobileSessionId: socket.id, // Mobile page's session ID
      });
    });

    socket.on("message", (data) => {
      console.log("Received message from server:", data); // Log received messages
    });

    socket.on("session_closed", (data) => {
      console.log("Session closed:", data);
      setSessionClosed(true);
      setSocket(null);
      setSessionId(null);
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
    const fileType = file.type;
    console.log("fileType:", fileType);
    if (!file || !sessionId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_source", "mobile"); // Add a flag to indicate mobile upload
    setLoading(true);

    try {
      const uploadUrl = `${
        import.meta.env.VITE_BACKEND_BASE_URL
      }/api/bill/upload/${externalSessionId}/`;
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });
      if (!response.ok)
        throw new Error(`Upload failed with status ${response.status}`);

      const data = await response.json();
      setFileUrl(data.file_url);

      // Send a notification to the external session (from the URL) once the file is uploaded
      if (externalSessionId && socket && socket.connected) {
        console.log(
          "Sending WebSocket notification to external session:",
          externalSessionId
        );

        const userMessage = {
          session_id: externalSessionId,
          message: data.file_url,
          type: "file",
          file_type: fileType,
          uploaded_from: "mobile",
        };

        socket.emit("send_message_to_session", userMessage, (response) => {
          console.log("Response from server after message emission:", response);
        });
      } else {
        console.error(
          "WebSocket is not connected or external session ID is missing."
        );
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReupload = async () => {
    const isConfirmed = window.confirm(
      "Are you sure you want to re-upload the file?"
    );
    if (!isConfirmed) return;

    setLoading(true);
    if (!fileUrl || !sessionId || !socket) return;

    const fileName = fileUrl.split("/").pop();

    try {
      console.log("Deleting uploaded file");
      const deleteUrl = `${
        import.meta.env.VITE_BACKEND_BASE_URL
      }/api/bill/delete/${externalSessionId}/?file_name=${fileName}`;
      const response = await fetch(deleteUrl, { method: "DELETE" });

      if (!response.ok) {
        throw new Error(`Delete request failed with status ${response.status}`);
      }

      console.log("File deleted successfully");
      setFileUrl(null);

      if (externalSessionId && socket.connected) {
        const removePreviewMessage = {
          session_id: externalSessionId,
          remove_preview: true,
        };
        console.log("Sending remove file preview message");
        socket.emit("remove_file_preview", removePreviewMessage, (response) => {
          console.log(
            "Response from server after emitting remove event:",
            response
          );
        });
      } else {
        console.error(
          "WebSocket is not connected or external session ID is missing."
        );
      }
    } catch (error) {
      console.error("Failed to delete file:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
      <h2 className="text-xl font-semibold">Upload Your Bill</h2>

      {/* Show session closed message if session is closed */}
      {sessionClosed ? (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
          <h3 className="text-lg font-semibold">Session has been closed.</h3>
          <p className="mt-2">
            Please scan a new QR code to start a new session.
          </p>
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : !fileUrl ? (
        <>
          <label className="px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer">
            Capture with Camera
            <input
              type="file"
              accept="image/*, application/pdf"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          <label className="px-4 py-2 bg-green-500 text-white rounded-lg cursor-pointer">
            Upload from Gallery
            <input
              type="file"
              accept="image/*, application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </>
      ) : (
        <div className="mt-4 flex flex-col items-center">
          <h3 className="text-lg font-semibold">Upload Successful!</h3>
          <p className="mt-2 text-gray-600">
            Your file has been uploaded successfully.
          </p>
          <div className="mt-4 flex gap-4">
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-lg"
              onClick={handleReupload}
            >
              Re-upload
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileUpload;
