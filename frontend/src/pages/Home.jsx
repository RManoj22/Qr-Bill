import React from "react";
import { useNavigate } from "react-router";

const Home = () => {
    const navigate = useNavigate()
    
    const handleUploadButtonClick = () =>{
        navigate("/upload-bill")
    }
    return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gray-600">
        <button 
        onClick={handleUploadButtonClick}
        className="px-6 py-3 text-white bg-blue-500 rounded-lg hover:bg-blue-600">
          Upload Bill
        </button>
      </div>
    </>
  );
};

export default Home;
