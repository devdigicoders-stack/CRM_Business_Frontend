import React, { useState, useEffect } from 'react';
import { Receipt, Search, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../api/axiosConfig';

const ManageExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [updateData, setUpdateData] = useState({
    status: '',
    managerRemark: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/expenses/all');
      setExpenses(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const openUpdateModal = (expense) => {
    setSelectedExpense(expense);
    setUpdateData({
      status: expense.status === 'Pending' ? 'Approved' : expense.status,
      managerRemark: expense.managerRemark || ''
    });
    setIsModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      await apiClient.put(`/expenses/${selectedExpense._id}/status`, updateData);
      toast.success(`Expense marked as ${updateData.status}`);
      setIsModalOpen(false);
      fetchExpenses();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error updating expense');
    } finally {
      setIsUpdating(false);
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

  const filteredExpenses = expenses.filter(exp => 
    exp.employeeId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    exp.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Manage Expenses</h1>
          <p className="text-[11px] sm:text-sm text-gray-500 mt-1">Review, approve, and pay employee expense claims.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by employee name, reason, or status..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading expenses...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No expenses found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Date</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Employee</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Amount</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Reason & Bill</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Status</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExpenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-600 whitespace-nowrap">
                      {new Date(expense.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 text-xs sm:text-sm">{expense.employeeId?.name || 'Unknown'}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500">{expense.employeeId?.employeeId || 'N/A'}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-gray-900 whitespace-nowrap">
                      ₹{expense.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 min-w-[200px] break-words">
                      <p className="text-gray-800 line-clamp-2 text-xs sm:text-sm">{expense.reason}</p>
                      {expense.billImage && (
                        <a href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${expense.billImage}`} target="_blank" rel="noreferrer" className="text-[10px] sm:text-xs text-blue-600 hover:underline mt-1 flex items-center gap-1">
                          <Receipt className="w-3 h-3 shrink-0" /> View Bill
                        </a>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {getStatusBadge(expense.status)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right whitespace-nowrap">
                      <button 
                        onClick={() => openUpdateModal(expense)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors"
                      >
                        Action
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {isModalOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Update Expense Status</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-500">Requested By: <span className="font-bold text-gray-900">{selectedExpense.employeeId?.name}</span></p>
                <p className="text-sm text-gray-500 mt-1">Amount: <span className="font-bold text-gray-900">₹{selectedExpense.amount}</span></p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Action / Status</label>
                <select
                  value={updateData.status}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm"
                >
                  <option value="Pending" disabled>Pending</option>
                  <option value="Approved">Approve</option>
                  <option value="Rejected">Reject</option>
                  <option value="Paid">Mark as Paid (Money transferred)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Remark (Optional)</label>
                <textarea 
                  value={updateData.managerRemark}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, managerRemark: e.target.value }))}
                  placeholder="e.g. Paid via UPI / Reject reason"
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm resize-none"
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isUpdating}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-70"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageExpenses;
