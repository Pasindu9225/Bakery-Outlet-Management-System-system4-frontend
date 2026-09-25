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
    <div className="fixed inset-0 bg-backdrop z-50 flex items-center justify-center p-4">
      <div className="bg-elevated rounded-xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-line bg-subtle">
          <h3 className="font-semibold text-fg">Transfer Stock</h3>
          <button 
            onClick={onClose}
            className="text-fg-muted hover:text-fg-secondary transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5">
          <div className="mb-6 flex items-center justify-between bg-brand/10 p-3 rounded-lg border border-brand/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand-fg">
                <Package size={20} />
              </div>
              <div>
                <p className="text-[14px] font-[600] text-fg">{item.productName}</p>
                <p className="text-[12px] text-fg-secondary">Available: {item.currentQty} units</p>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/30 text-error text-[13px] rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 p-2 bg-subtle border border-line rounded-lg text-center">
                <span className="block text-[11px] text-fg-secondary uppercase font-semibold mb-1">From</span>
                <span className="text-[13px] font-medium text-fg truncate">{sourceOutletName}</span>
              </div>
              <ArrowRight size={16} className="text-fg-muted" />
              <div className="flex-1">
                <label className="block text-[11px] text-fg-secondary uppercase font-semibold mb-1 text-center">To</label>
                <select
                  value={destinationOutletId}
                  onChange={(e) => setDestinationOutletId(e.target.value)}
                  className="w-full border border-line-strong rounded-lg px-2 py-2 text-[13px] focus:outline-none focus:border-brand-fg"
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
              <label className="block text-[13px] font-medium text-fg mb-1">
                Transfer Quantity
              </label>
              <input
                type="number"
                min="1"
                max={item.currentQty}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full border border-line-strong rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-1 focus:ring-brand-fg"
                placeholder="Enter amount to transfer"
              />
            </div>
          </div>
          
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-line-strong rounded-lg text-[14px] font-medium text-fg hover:bg-subtle transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-brand text-on-brand rounded-lg text-[14px] font-medium hover:bg-brand-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-line/30 border-t-line rounded-full animate-spin"></span>
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
