import React from "react";
import { useLocation } from "react-router-dom";

const VendorInvoice = () => {
  const location = useLocation();
  const invoiceData = location.state?.invoiceData || {};

  return (
    <div className="min-h-screen p-6 bg-gray-100 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Vendor Invoice</h1>

      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
        {/* Vendor & Date Row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 font-medium">Vendor</label>
            <input
              type="text"
              value={invoiceData["Vendor Name"] || ""}
              readOnly
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium">Date</label>
            <input
              type="date"
              value={invoiceData["Date"] ? new Date(invoiceData["Date"]).toISOString().split("T")[0] : ""}
              readOnly
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
        </div>

        {/* Item Details Table */}
        <h2 className="text-xl font-semibold my-4">Item Details</h2>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 p-2">Item Name</th>
              <th className="border border-gray-300 p-2">Quantity</th>
              <th className="border border-gray-300 p-2">Net Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData["Item Details"]?.map((item, index) => (
              <tr key={index} className="text-center">
                <td className="border border-gray-300 p-2">{item.Name}</td>
                <td className="border border-gray-300 p-2">{item.Quantity}</td>
                <td className="border border-gray-300 p-2">{item["Total Price"]}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* GST & Transport */}
        <div className="mt-4">
          <label className="block text-gray-700 font-medium">GST</label>
          <input
            type="text"
            value={invoiceData["Total Tax Amount"] || ""}
            readOnly
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <div className="mt-4">
          <label className="block text-gray-700 font-medium">Transport</label>
          <input
            type="text"
            value={invoiceData["Transport"] || ""}
            readOnly
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        {/* Discount & Rounded Off in Same Row */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-gray-700 font-medium">Discount</label>
            <input
              type="text"
              value={invoiceData["Discount"] || ""}
              readOnly
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium">Rounded Off</label>
            <input
              type="text"
              value={invoiceData["Rounded Off"] || ""}
              readOnly
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
        </div>

        {/* Total Bill Amount - Highlighted */}
        <div className="mt-6 p-4 bg-yellow-200 border-l-4 border-yellow-500">
          <label className="block text-gray-700 font-bold">Total Bill Amount</label>
          <input
            type="text"
            value={invoiceData["Total Bill Amount"] || ""}
            readOnly
            className="w-full p-2 border border-yellow-500 bg-yellow-100 rounded text-lg font-semibold"
          />
        </div>
      </div>
    </div>
  );
};

export default VendorInvoice;
