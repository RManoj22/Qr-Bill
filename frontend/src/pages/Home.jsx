import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [qrUrl, setQrUrl] = useState("");
  const [socket, setSocket] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [uploadedFrom, setUploadedFrom] = useState(null);
  const navigate = useNavigate();

  const openModal = () => {
    setIsModalOpen(true);
    const newSocket = io("http://localhost:8000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      const sessionID = newSocket.id;
      setSessionId(sessionID);
      newSocket.emit("register", { session_id: sessionID }, (response) => {
        if (response.success) {
          console.log("Session registered successfully.");
        } else {
          console.error("Failed to register session:", response.message);
        }
      });
      setConnected(true);
    });

    newSocket.on("message", (data) => {
      if (data.type === "file" && data.url && data.session_id) {
        console.log("File URL received:", data.url);
        setFileUrl(data.url);
        setUploadedFrom(data.uploaded_from);
        setIsModalOpen(false);
      }
    });

    newSocket.on("disconnect", () => {
      setConnected(false);
    });

    return () => {
      newSocket.close();
    };
  };

  useEffect(() => {
    if (sessionId) {
      fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/bill/generate-qr/${sessionId}/`)
        .then((response) => response.blob())
        .then((imageBlob) => {
          const imageUrl = URL.createObjectURL(imageBlob);
          setQrUrl(imageUrl);
        })
        .catch((error) => {
          console.error("Error fetching QR code:", error);
        });
    }
  }, [sessionId]);

  const handleConfirm = () => {
    console.log("File confirmed:", fileUrl);
  };

  const handleCancel = () => {
    setFileUrl(null);
    setUploadedFrom(null);
    if (socket) {
      socket.close();
      setSocket(null);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-600">
      {!fileUrl && (
        <button
          onClick={openModal}
          className="px-6 py-3 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
        >
          Upload Bill
        </button>
      )}

      {!fileUrl && isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-2/3 max-w-3xl h-auto p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
            >
              <X size={24} />
            </button>
            <div className="flex">
              <div className="w-1/2 flex flex-col items-center justify-center p-6 border-r border-gray-300">
                <h3 className="text-lg font-semibold mb-2">Upload from Computer</h3>
                <label
                  htmlFor="file-upload"
                  className="w-full h-40 border-2 border-dashed border-gray-400 flex items-center justify-center rounded-lg cursor-pointer hover:bg-gray-100"
                >
                  <span className="text-gray-600">Drag & Drop or Click to Upload</span>
                  <input type="file" id="file-upload" className="hidden" />
                </label>
              </div>
              <div className="w-1/2 flex flex-col items-center justify-center p-6">
                <h3 className="text-lg font-semibold mb-2">Scan QR Code</h3>
                <div className="w-32 h-32 bg-gray-300 flex items-center justify-center rounded-lg">
                  {qrUrl ? (
                    <img
                      src={qrUrl}
                      alt="QR Code"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-gray-600">Loading QR Code...</span>
                  )}
                </div>
                <p className="mt-2 text-sm">{connected ? "Connected" : "Not Connected"}</p>
                <p className="mt-2 text-sm">{sessionId ? sessionId : "Fetching SessionID"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {fileUrl && (
        <div className="fixed inset-0 flex">
          <div className="w-2/3 h-full flex items-center justify-center bg-white">
            <div className="w-full h-full flex items-center justify-center">
              <img src={fileUrl} alt="Uploaded File" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="w-1/3 h-full flex flex-col items-center justify-center bg-gray-100 p-6">
            <button
              onClick={handleConfirm}
              className="px-6 py-3 text-white bg-green-500 rounded-lg hover:bg-green-600"
            >
              Confirm
            </button>
            {uploadedFrom !== "mobile" && (
              <button
                onClick={openModal}
                className="mt-4 px-6 py-3 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
              >
                Re-Upload
              </button>
            )}
            <button
              onClick={handleCancel}
              className="mt-4 px-6 py-3 text-white bg-red-500 rounded-lg hover:bg-red-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
