import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import UploadBill from "./pages/UploadBill";
import MobileUpload from "./pages/MobileUpload";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload-bill" element={<UploadBill />} />
        <Route path="/mobile_upload" element={<MobileUpload />} />
      </Routes>
    </Router>
  );
}

export default App;
