import React, { useState } from 'react';
import { X, ArrowRight, Package } from 'lucide-react';

export default function ManagerTransferModal({ 
  isOpen, 
  onClose, 
  item, 
  sourceOutletId, 
  outlets, 
  onTransferSuccess 
}) {
  const [destinationOutletId, setDestinationOutletId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !item) return null;

  const sourceOutletName = outlets.find(o => o.outletId.toString() === sourceOutletId.toString())?.name || 'Source Outlet';
  const availableOutlets = outlets.filter(o => o.outletId.toString() !== sourceOutletId.toString());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!destinationOutletId) {
      setError('Please select a destination outlet.');
      return;
    }
    
    const qtyNum = parseInt(quantity);
    if (!qtyNum || qtyNum <= 0) {
      setError('Please enter a valid quantity.');
      return;
    }
    
    if (qtyNum > item.currentQty) {
      setError(`Cannot transfer more than available stock (${item.currentQty}).`);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/v1/manager/actual-production/outlet-transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceOutletId: parseInt(sourceOutletId),
          destinationOutletId: parseInt(destinationOutletId),
          productId: item.productId,
          requestedQuantity: qtyNum
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create transfer request');
      }

      onTransferSuccess();
      onClose();
      setQuantity('');
      setDestinationOutletId('');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-[#F9FAFB]">
          <h3 className="font-semibold text-[#383E49]">Transfer Stock</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5">
          <div className="mb-6 flex items-center justify-between bg-blue-50/50 p-3 rounded-lg border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-[#0F50AA]">
                <Package size={20} />
              </div>
              <div>
                <p className="text-[14px] font-[600] text-[#383E49]">{item.productName}</p>
                <p className="text-[12px] text-gray-500">Available: {item.currentQty} units</p>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-[13px] rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <span className="block text-[11px] text-gray-500 uppercase font-semibold mb-1">From</span>
                <span className="text-[13px] font-medium text-[#383E49] truncate">{sourceOutletName}</span>
              </div>
              <ArrowRight size={16} className="text-gray-400" />
              <div className="flex-1">
                <label className="block text-[11px] text-gray-500 uppercase font-semibold mb-1 text-center">To</label>
                <select
                  value={destinationOutletId}
                  onChange={(e) => setDestinationOutletId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 text-[13px] focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Destination</option>
                  {availableOutlets.map(outlet => (
                    <option key={outlet.outletId} value={outlet.outletId}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#383E49] mb-1">
                Transfer Quantity
              </label>
              <input
                type="number"
                min="1"
                max={item.currentQty}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter amount to transfer"
              />
            </div>
          </div>
          
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-[#0F50AA] text-white rounded-lg text-[14px] font-medium hover:bg-[#0c428e] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                'Transfer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
