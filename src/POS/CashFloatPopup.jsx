import React, { useState } from 'react';
import { DollarSign, User } from 'lucide-react';
import axios from 'axios';

const CashFloatPopup = ({ isOpen, onConfirm, cashierInfo }) => {
  const [openingBalance, setOpeningBalance] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input change with validation
  const handleInputChange = (e) => {
    const value = e.target.value;
    
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setOpeningBalance(value);
      setError('');
    }
  };

  // Validate and submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(openingBalance);
    
    // Validation
    if (!openingBalance || openingBalance.trim() === '') {
      setError('Please enter an opening balance amount');
      return;
    }
    
    if (isNaN(amount) || amount <= 0) {
      setError('Opening balance must be greater than 0');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem("authToken");
      const baseUrl = process.env.REACT_APP_BASE_URL || '';

      await axios.post(
        `${baseUrl}/api/pos/v1/cash-float/open`,
        {
          cashierId: cashierInfo.id,
          outletId: 1,
          openingBalance: amount
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Pass data to parent component
      onConfirm({
        cashierId: cashierInfo.id,
        cashierName: cashierInfo.name,
        openingBalance: amount,
        timestamp: new Date().toISOString()
      });
      
      // Reset form
      setOpeningBalance('');
      setError('');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to record opening balance. Please try again.';
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[10000] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 border border-[#E4E6EA]">
        {/* Header */}
        <div className="bg-[#0F50AA] text-white p-6 rounded-t-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 className="text-[20px] font-[600]">Enter Opening Cash Float</h2>
            </div>
          </div>
          <p className="text-[14px] text-white/80">
            Please declare the cash in the drawer before starting sales.
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Cashier Info */}
          <div className="bg-[#F8F9FA] rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#0F50AA]/10 rounded-full flex items-center justify-center">
                <User size={16} className="text-[#0F50AA]" />
              </div>
              <div>
                <p className="text-[12px] text-[#667085] uppercase tracking-wide">Cashier</p>
                <p className="text-[14px] font-[500] text-[#383E49]">
                  {cashierInfo?.name || 'John Doe'}
                </p>
              </div>
            </div>
          </div>

          {/* Opening Balance Input */}
          <div className="mb-6">
            <label className="block text-[14px] font-[500] text-[#383E49] mb-2">
              Opening Balance Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#667085] text-[14px] font-[500]">
                Rs.
              </span>
              <input
                type="text"
                value={openingBalance}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                placeholder="Enter cash in drawer"
                className="w-full pl-12 pr-4 py-3 border border-[#E4E6EA] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#0F50AA] focus:border-transparent transition-all duration-200"
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            {error && (
              <p className="mt-2 text-[13px] text-[#EF4444] flex items-center gap-1">
                <span className="w-4 h-4 bg-[#EF4444] rounded-full flex items-center justify-center text-white text-[10px] font-bold">!</span>
                {error}
              </p>
            )}
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleSubmit}
            disabled={!openingBalance || isSubmitting || parseFloat(openingBalance) <= 0}
            className="w-full bg-[#0F50AA] text-white py-3 px-4 rounded-md text-[14px] font-[600] hover:bg-[#0D4494] disabled:bg-[#E4E6EA] disabled:text-[#667085] disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Recording...
              </>
            ) : (
              'Confirm Opening Balance'
            )}
          </button>

          {/* Info Note */}
          <div className="mt-4 p-3 bg-[#F0F9FF] rounded-lg border border-[#B3E5FC]">
            <p className="text-[13px] text-[#0369A1]">
              <strong>Note:</strong> Once confirmed, you can start processing sales. 
              This amount will be used for cash reconciliation at day-end.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFloatPopup;