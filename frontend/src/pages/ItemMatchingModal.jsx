import React, { useState } from "react";

const MatchItemsModal = ({
  isOpen,
  onClose,
  unmatchedItems,
  availableItems,
  onConfirm,
}) => {
  const [matches, setMatches] = useState({});

  // Handle selection change
  const handleMatchChange = (index, value) => {
    setMatches((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[600px] relative">
        {/* Close Button */}
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-black text-lg"
          onClick={onClose}
        >
          ✖
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold mb-4">Match Imported Items</h2>

        {/* Table */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-2 text-left">Imported Item</th>
              <th className="p-2 text-left">Quantity</th>
              <th className="p-2 text-left">Price</th>
              <th className="p-2 text-left">Match To</th>
            </tr>
          </thead>
          <tbody>
            {unmatchedItems.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="p-2">{item.name}</td>
                <td className="p-2">{item.quantity}</td>
                <td className="p-2">₹{item["total_price"]}</td>
                <td className="p-2">
                  <select
                    className="border p-2 rounded w-full"
                    value={matches[index] || ""}
                    onChange={(e) => handleMatchChange(index, e.target.value)}
                  >
                    <option value="">Select item</option>
                    {availableItems.map((availableItem, idx) => (
                      <option key={idx} value={availableItem}>
                        {availableItem}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Confirm Button */}
        <div className="mt-4 flex justify-end">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            onClick={() => onConfirm(matches)}
          >
            Confirm Matches
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchItemsModal;
