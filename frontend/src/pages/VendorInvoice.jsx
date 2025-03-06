import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import MatchItemsModal from "./ItemMatchingModal";

const VendorInvoice = () => {
  const location = useLocation();
  const invoiceData = location.state?.invoiceData || {}; // Access the nested `data` object
  const [showModal, setShowModal] = useState(false);

  // Log invoiceData when it is received
  useEffect(() => {
    console.log("Invoice Data:", invoiceData);
  }, [invoiceData]);

  useEffect(() => {
    if (invoiceData.all_items_matched === false) {
      console.log("All Items Matched:", invoiceData.all_items_matched);
      setShowModal(true);
    }
  }, [invoiceData.all_items_matched]);

  // Separate matched and unmatched items
  const matchedItems =
    invoiceData["item_details"]?.filter((item) => item["match_found"]) || [];
  const unmatchedItems =
    invoiceData["item_details"]?.filter((item) => !item["match_found"]) || [];

  // Log matched and unmatched items
  useEffect(() => {
    console.log("Matched Items:", matchedItems);
    console.log("Unmatched Items:", unmatchedItems);
  }, [matchedItems, unmatchedItems]);

  // Dummy available items for matching
  const availableItems = ["Item 1", "Item 2", "Item 3"];

  // Handle match confirmation
  const handleConfirmMatches = (matches) => {
    console.log("Confirmed Matches:", matches);
    setShowModal(false);
  };

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
              value={invoiceData["vendor_name"] || ""}
              readOnly
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium">Date</label>
            <input
              type="date"
              value={
                invoiceData["date"]
                  ? new Date(invoiceData["date"]).toISOString().split("T")[0]
                  : ""
              }
              readOnly
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
        </div>

        {/* Matched Item Details Table */}
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
            {matchedItems.length > 0 ? (
              matchedItems.map((item, index) => (
                <tr key={index} className="text-center">
                  <td className="border border-gray-300 p-2">{item.name}</td>
                  <td className="border border-gray-300 p-2">
                    {item.quantity}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {item["total_price"]}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center p-2 text-gray-500">
                  No matched items
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* GST & Transport */}
        <div className="mt-4">
          <label className="block text-gray-700 font-medium">GST</label>
          <input
            type="text"
            value={invoiceData["total_tax_amount"] || ""}
            readOnly
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <div className="mt-4">
          <label className="block text-gray-700 font-medium">Transport</label>
          <input
            type="text"
            value={invoiceData["transport"] || ""}
            readOnly
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        {/* Discount & Rounded Off */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-gray-700 font-medium">Discount</label>
            <input
              type="text"
              value={invoiceData["discount"] || ""}
              readOnly
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium">
              Rounded Off
            </label>
            <input
              type="text"
              value={invoiceData["rounded_off"] || ""}
              readOnly
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
        </div>

        {/* Total Bill Amount */}
        <div className="mt-6 p-4 bg-yellow-200 border-l-4 border-yellow-500">
          <label className="block text-gray-700 font-bold">
            Total Bill Amount
          </label>
          <input
            type="text"
            value={invoiceData["total_bill_amount"] || ""}
            readOnly
            className="w-full p-2 border border-yellow-500 bg-yellow-100 rounded text-lg font-semibold"
          />
        </div>

        {/* Matching Modal */}
        <MatchItemsModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          unmatchedItems={unmatchedItems}
          availableItems={availableItems}
          onConfirm={handleConfirmMatches}
        />
      </div>
    </div>
  );
};

export default VendorInvoice;
