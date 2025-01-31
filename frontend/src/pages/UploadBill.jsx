import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const UploadBill = () => {
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(false); // Added loading state
  const [extractedData, setExtractedData] = useState(null); // To store extracted data

  useEffect(() => {
    const socket = io("http://localhost:8000");
    console.log("import.meta.env.VITE_BACKEND_BASE_URL", import.meta.env.VITE_BACKEND_BASE_URL)
    // const socket = io(import.meta.env.VITE_BACKEND_BASE_URL);

    socket.on("connect", () => {
      const sessionID = socket.id;
      setSessionId(sessionID);

      socket.emit("register", { session_id: sessionID }, (response) => {
        if (response.success) {
          console.log("Successfully registered the new session");
        } else {
          console.error("Failed to register session:", response.message);
        }
      });

      setConnected(true);
    });

    socket.on("message", (data) => {
      if (data.type === "file" && data.url) {
        setFileUrl(data.url); // Update fileUrl state
      } else {
        setMessage(data.url || "No file URL received");
      }
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    if (sessionId && !fileUrl) {
      // fetch(`http://localhost:8000/chat/generate-qr/${sessionId}/`)
      fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/chat/generate-qr/${sessionId}/`)
        .then((response) => response.blob())
        .then((imageBlob) => {
          const imageUrl = URL.createObjectURL(imageBlob);
          setQrUrl(imageUrl);
        })
        .catch((error) => {
          console.error("Error fetching QR code:", error);
        });
    }
  }, [sessionId, fileUrl]);

  const handleConfirm = async () => {
    if (!fileUrl) return;

    setLoading(true); // Start loading spinner

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/ai/extract/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_url: fileUrl }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log("Extracted Data:", data);
        setExtractedData(data.data); // Store extracted data
      } else {
        console.error("Extraction failed:", data.error);
      }
    } catch (error) {
      console.error("Error confirming bill:", error);
    }

    setLoading(false); // Stop loading spinner
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-600">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl mb-4">Upload Bill</h2>
        <p>Status: {connected ? "Connected" : "Not Connected"}</p>
        <p>Session ID: {sessionId}</p>

        {/* Display QR Code and File Upload section */}
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
            <p className="mt-2 text-gray-600">Your file has been uploaded successfully.</p>
            <div className="mt-4">
              <img src={fileUrl} alt="Uploaded file preview" className="max-w-full h-auto" />
            </div>
            <div className="mt-4">
              <button
                className={`px-4 py-2 rounded-lg transition ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"} text-white`}
                onClick={handleConfirm}
                disabled={loading} // Disable button during loading
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      ></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Display Extracted Data */}
        {extractedData && (
          <div className="mt-6 bg-gray-100 p-4 rounded-lg">
            <h3 className="text-lg font-semibold">Extracted Data:</h3>
            <pre className="text-sm text-gray-800 overflow-x-auto">
              {JSON.stringify(extractedData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadBill;
