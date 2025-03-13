import React, { useState, useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const Home = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [mobileSessionId, setMobileSessionId] = useState(null);
  const [qrUrl, setQrUrl] = useState("");
  const [socket, setSocket] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFrom, setUploadedFrom] = useState(null);
  const [loading, setLoading] = useState(false);
  const memoizedFileUrl = useMemo(() => fileUrl, [fileUrl]);
  const navigate = useNavigate();

  const openModal = () => {
    setIsModalOpen(true);
    const newSocket = io(import.meta.env.VITE_BACKEND_BASE_URL);
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

    newSocket.on("mobile_connected", (data) => {
      console.log("Mobile session ID received:", data.mobile_session_id);
      setMobileSessionId(data.mobile_session_id);
    });

    newSocket.on("message", (data) => {
      if (data.type === "file" && data.url && data.session_id) {
        console.log("File URL received:", data.url);
        console.log("File type received:", data.file_type);
        setFileUrl(data.url);
        setFileType(data.file_type);
        setUploadedFrom(data.uploaded_from);
        setIsModalOpen(false);
      }
    });

    newSocket.on("remove_file_preview", (data) => {
      console.log("Received remove file event:", data);

      if (data.remove_preview) {
        setFileUrl(null);
        setUploadedFrom(null);
        console.log("Removed file preview");
        setIsModalOpen(true);
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
    let imageUrl = null;

    if (sessionId) {
      fetch(
        `${
          import.meta.env.VITE_BACKEND_BASE_URL
        }/api/bill/generate-qr/${sessionId}/`
      )
        .then((response) => response.blob())
        .then((imageBlob) => {
          imageUrl = URL.createObjectURL(imageBlob);
          setQrUrl(imageUrl);
        })
        .catch((error) => {
          console.error("Error fetching QR code:", error);
        });
    }

    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [sessionId]);

  const handleConfirm = async () => {
    if (!fileUrl) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("session_id", sessionId);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/bill/extract/`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      if (response.ok) {
        console.log("Extracted Data:", data);
        navigate("/vendor-invoice", { state: { invoiceData: data.data } });
      } else {
        console.error("Extraction failed:", data.error);
      }
    } catch (error) {
      console.error("Error confirming bill:", error);
    }

    setLoading(false);
  };

  const handleFileChange = (event) => {
    console.log("File change event:", event);
    const file = event.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setFileUrl(previewUrl);
    setSelectedFile(file);
    setUploadedFrom("computer");

    if (socket && socket.connected) {
      console.log("Sending WebSocket notification to external session");

      const userMessage = {
        session_id: sessionId,
        message: previewUrl,
        file_type: file.type,
        type: "file",
        uploaded_from: "computer",
      };

      socket.emit("send_message_to_session", userMessage, (response) => {
        console.log("Response from server after message emission:", response);
      });
    } else {
      console.error("WebSocket is not connected.");
    }
  };

  const handleReupload = async () => {
    if (!sessionId) return;

    try {
      setFileUrl(null);
      setUploadedFrom(null);
      console.log("Re-upload successful");

      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to delete file:", error);
    }
  };

  const handleCloseModal = () => {
    if (socket) {
      if (mobileSessionId) {
        console.log("Notifying mobile session:", mobileSessionId);
        socket.emit("session_closed", {
          mobileSessionId: mobileSessionId,
          sessionId: sessionId,
        });
      }
      socket.close();
      setSocket(null);
    }
    setIsModalOpen(false);
  };

  const handleCancel = async () => {
    setLoading(true);

    if (uploadedFrom === "mobile") {
      try {
        const fileName = fileUrl.split("/").pop();
        const deleteUrl = `${
          import.meta.env.VITE_BACKEND_BASE_URL
        }/api/bill/delete/${sessionId}/?file_name=${fileName}`;
        const response = await fetch(deleteUrl, { method: "DELETE" });

        if (!response.ok) {
          throw new Error(
            `Delete request failed with status ${response.status}`
          );
        }

        console.log("File deleted successfully");

        if (socket) {
          if (mobileSessionId) {
            console.log("Notifying mobile session:", mobileSessionId);
            socket.emit("session_closed", {
              mobileSessionId: mobileSessionId,
              sessionId: sessionId,
            });
          }
          socket.onclose = () => {
            console.log("Socket closed");
            setSocket(null);
          };
          socket.close();
        }
      } catch (error) {
        console.error("Failed to delete file:", error);
      }
    } else {
      if (socket) {
        socket.onclose = () => {
          console.log("Socket closed");
          setSocket(null);
        };
        socket.close();
      }
    }

    setFileUrl(null);
    setUploadedFrom(null);
    setIsModalOpen(false);
    setLoading(false);
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
              onClick={handleCloseModal}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
            >
              <X size={24} />
            </button>
            <div className="flex">
              <div className="w-1/2 flex flex-col items-center justify-center p-6 border-r border-gray-300">
                <h3 className="text-lg font-semibold mb-2">
                  Upload from Computer
                </h3>
                {loading ? (
                  <div className="flex justify-center items-center">
                    <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <label
                    htmlFor="file-upload"
                    className="w-full h-40 border-2 border-dashed border-gray-400 flex items-center justify-center rounded-lg cursor-pointer hover:bg-gray-100"
                  >
                    <span className="text-gray-600">
                      Drag & Drop or Click to Upload
                    </span>
                    <input
                      type="file"
                      id="file-upload"
                      accept="image/*, application/pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
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
                <p className="mt-2 text-sm">
                  {connected ? "Connected" : "Not Connected"}
                </p>
                <p className="mt-2 text-sm">
                  {sessionId ? sessionId : "Fetching SessionID"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {fileUrl && (
        <div className="fixed inset-0 flex">
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-lg font-semibold">Processing...</p>
              </div>
            </div>
          )}
          <div className="w-2/3 h-full flex items-center justify-center bg-white">
            <div className="w-full h-full flex items-center justify-center">
              {fileType === "application/pdf" ? (
                <Document
                  file={memoizedFileUrl}
                  onLoadError={(error) =>
                    console.error("Error loading PDF:", error)
                  }
                  className="w-full h-full overflow-auto"
                >
                  <Page pageNumber={1} width={600} />
                </Document>
              ) : (
                <img
                  src={fileUrl}
                  alt="Uploaded File"
                  className="w-full h-full object-contain"
                />
              )}
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
                onClick={handleReupload}
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
