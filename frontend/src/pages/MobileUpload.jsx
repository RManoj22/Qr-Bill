import React from "react";

const MobileUpload = () => {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log("Selected file:", file);
      // You can now upload or process the image
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
      <h2 className="text-xl font-semibold">Upload Your Bill</h2>
      
      {/* Button to Capture Image from Camera */}
      <label className="px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer">
        Capture with Camera
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>

      {/* Button to Select from Gallery */}
      <label className="px-4 py-2 bg-green-500 text-white rounded-lg cursor-pointer">
        Upload from Gallery
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};

export default MobileUpload;
