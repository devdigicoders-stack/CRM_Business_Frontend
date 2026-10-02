import React, { useState, useEffect } from 'react';
import { Plus, Receipt, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../api/axiosConfig';

const MyExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    reason: '',
    billImage: null
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/expenses/my');
      setExpenses(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, billImage: e.target.files[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.reason) {
      toast.error("Please fill all required fields");
      return;
    }

    const data = new FormData();
    data.append('amount', formData.amount);
    data.append('reason', formData.reason);
    if (formData.billImage) {
      data.append('billImage', formData.billImage);
    }

    try {
      setIsSubmitting(true);
      await apiClient.post('/expenses', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Expense request submitted successfully');
      setIsModalOpen(false);
      setFormData({ amount: '', reason: '', billImage: null });
      fetchExpenses();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error submitting expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Approved': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'Rejected': return <XCircle className="w-4 h-4 text-rose-500" />;
      case 'Paid': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Approved': return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200">Approved</span>;
      case 'Rejected': return <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-medium border border-rose-200">Rejected</span>;
      case 'Paid': return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">Paid</span>;
      default: return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-200">Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Expense Claims</h1>
          <p className="text-[11px] sm:text-sm text-gray-500 mt-1">Request reimbursement for your work-related expenses.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm w-full sm:w-auto shrink-0"
        >
          <Plus className="w-4 h-4" /> New Claim
        </button>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading your claims...</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No expenses found</h3>
            <p className="text-gray-500">You haven't requested any reimbursements yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Date</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Amount</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Reason</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Status</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-600 whitespace-nowrap">
                      {new Date(expense.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-gray-900 whitespace-nowrap">
                      ₹{expense.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 min-w-[200px] break-words">
                      <p className="text-gray-800 text-xs sm:text-sm">{expense.reason}</p>
                      {expense.billImage && (
                        <a href={`http://localhost:5000${expense.billImage}`} target="_blank" rel="noreferrer" className="text-[10px] sm:text-xs text-blue-600 hover:underline mt-1 inline-block">
                          View Bill/Receipt
                        </a>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {getStatusIcon(expense.status)}
                        {getStatusBadge(expense.status)}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-600 text-[10px] sm:text-xs whitespace-nowrap">
                      {expense.managerRemark || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">New Expense Claim</h2>
                  <p className="text-xs text-gray-500">Submit bills for reimbursement</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (₹) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm font-medium">₹</span>
                  </div>
                  <input 
                    type="number" 
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                    min="1"
                    placeholder="e.g. 500"
                    className="pl-8 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason / Details *</label>
                <textarea 
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  required
                  rows="3"
                  placeholder="e.g. Petrol cost for client visit at XYZ location"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm resize-none" 
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Bill/Receipt (Optional but recommended)</label>
                <input 
                  type="file" 
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" 
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyExpenses;
