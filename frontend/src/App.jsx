import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import MobileUpload from "./pages/MobileUpload";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import VendorInvoice from "./pages/VendorInvoice";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mobile-upload" element={<MobileUpload />} />
        <Route path="/vendor-invoice" element={<VendorInvoice />} />
      </Routes>
    </Router>
  );
}

export default App;
