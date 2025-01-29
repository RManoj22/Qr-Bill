import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import UploadBill from "./pages/UploadBill";
import MobileUpload from "./pages/MobileUpload";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload-bill" element={<UploadBill />} />
        <Route path="/mobile_upload/:session_id" element={<MobileUpload />} />
      </Routes>
    </Router>
  );
}

export default App;
