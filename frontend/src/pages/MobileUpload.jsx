import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";

const MobileUpload = () => {
  const [sessionId, setSessionId] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [sessionClosed, setSessionClosed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [externalSessionId, setExternalSessionId] = useState(null);
  const [searchParams] = useSearchParams();

  const hasCheckedSession = useRef(false);

  useEffect(() => {
    const externalSessionId = searchParams.get("sessionId");
    console.log("Session ID from URL:", externalSessionId);
    setExternalSessionId(externalSessionId);

    if (!externalSessionId) {
      console.log(
        "No session ID provided in the URL. Aborting WebSocket connection."
      );
      return;
    }

    if (hasCheckedSession.current) {
      console.log(
        "Session status check already performed. Skipping duplicate call."
      );
      return;
    }
    hasCheckedSession.current = true;

    const checkSessionActive = async () => {
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_BACKEND_BASE_URL
          }/api/bill/session/status/${externalSessionId}/`
        );

        if (!response.ok) throw new Error("Failed to check session status");

        const data = await response.json();
        if (!data.is_active) {
          console.log(
            "Session is inactive. WebSocket connection will not be established."
          );
          setSessionClosed(true);
          return;
        }

        console.log(
          "Session is active. Proceeding with WebSocket connection..."
        );

        const socket = io(import.meta.env.VITE_BACKEND_BASE_URL);
        socket.on("connect", () => {
          console.log("WebSocket connected successfully!");
          console.log("New WebSocket connection SID:", socket.id);
          setSessionId(socket.id);

          socket.emit("mobile_connected", {
            homeSessionId: externalSessionId,
            mobileSessionId: socket.id,
          });
        });

        socket.on("message", (data) => {
          console.log("Received message from server:", data);
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
      } catch (error) {
        console.error("Error checking session status:", error);
      }
    };

    checkSessionActive();

    return () => {
      if (socket) {
        console.log("Closing WebSocket connection...");
        socket.close();
      }
    };
  }, [searchParams]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    const fileType = file.type;
    console.log("fileType:", fileType);
    if (!file || !sessionId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_source", "mobile");
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
