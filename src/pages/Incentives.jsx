 import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Plus, ArrowUpRight, ArrowDownRight, History, Users, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../api/axiosConfig';

const Incentives = () => {
  const [activeTab, setActiveTab] = useState('balances'); // 'balances' or 'history'
  const [employees, setEmployees] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasAccess, setHasAccess] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [userHistory, setUserHistory] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [incentiveData, setIncentiveData] = useState({
    amount: '',
    transactionType: 'CREDIT',
    remarks: ''
  });

  useEffect(() => {
    checkAccessAndFetchData();
  }, [activeTab]);

  const checkAccessAndFetchData = async () => {
    try {
      setIsLoading(true);
      const profileRes = await apiClient.get('/auth/profile');
      const roleName = profileRes.data.user?.role?.name;
      const permissions = profileRes.data.user?.role?.permissions || [];
      
      const canManageIncentives = roleName === 'Admin' || permissions.includes('add_incentive');
      setHasAccess(canManageIncentives);

      if (!canManageIncentives) {
        setIsLoading(false);
        return;
      }

      if (activeTab === 'balances') {
        const res = await apiClient.get('/auth/users');
        setEmployees(res.data);
      } else {
        const res = await apiClient.get('/incentives/transactions/all');
        setTransactions(res.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const openIncentiveModal = (user) => {
    setSelectedUser(user);
    setIncentiveData({ amount: '', transactionType: 'CREDIT', remarks: '' });
    setIsModalOpen(true);
  };

  const openHistoryModal = async (user) => {
    try {
      setSelectedUser(user);
      setIsHistoryModalOpen(true);
      setUserHistory([]); // reset while loading
      const res = await apiClient.get(`/incentives/history/${user._id}`);
      setUserHistory(res.data.transactions);
    } catch (err) {
      toast.error('Failed to load user history');
    }
  };

  const handleIncentiveSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/incentives/transaction', {
        employeeId: selectedUser._id,
        ...incentiveData
      });
      toast.success('Incentive updated successfully');
      setIsModalOpen(false);
      checkAccessAndFetchData(); // Refresh list
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error updating incentive');
    }
  };

  if (!hasAccess && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <DollarSign className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
        <p className="text-gray-500 mt-2">You do not have permission to manage incentives.</p>
      </div>
    );
  }

  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Staff Incentives</h1>
          <p className="text-[11px] sm:text-sm text-gray-500 mt-1">Manage employee incentive balances and view transaction history.</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="flex flex-col sm:flex-row bg-gray-100 p-1 rounded-lg gap-1">
          <button
            onClick={() => setActiveTab('balances')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'balances' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" /> Balances
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'history' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="w-4 h-4 shrink-0" /> Transaction History
          </button>
        </div>

        {activeTab === 'balances' && (
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search employee..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
            />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading data...</div>
        ) : activeTab === 'balances' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                <tr>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Employee</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Department</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Emp ID</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Incentive Balance</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No employees found</td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] sm:text-xs overflow-hidden shrink-0">
                            {emp.profileImage ? (
                              <img src={`http://localhost:5000${emp.profileImage}`} alt={emp.name} className="w-full h-full object-cover" />
                            ) : (
                              emp.name ? emp.name.substring(0, 2).toUpperCase() : 'U'
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-xs sm:text-sm">{emp.name}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-700 whitespace-nowrap">{emp.department || 'N/A'}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-500 whitespace-nowrap">{emp.employeeId || 'N/A'}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className="font-bold text-base sm:text-lg text-emerald-600">
                          ₹{Number(emp.incentiveBalance || 0).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <button 
                            onClick={() => openHistoryModal(emp)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View User History"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openIncentiveModal(emp)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-medium transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                <tr>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Date & Time</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Employee</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Amount</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Type</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Remarks</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium whitespace-nowrap">Processed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No transactions found</td>
                  </tr>
                ) : (
                  transactions.map((txn) => (
                    <tr key={txn._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-600 whitespace-nowrap">
                        {new Date(txn.createdAt).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 text-xs sm:text-sm">{txn.employeeId?.name || 'Unknown'}</div>
                        <div className="text-[10px] sm:text-xs text-gray-500">{txn.employeeId?.department || 'N/A'}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className={`font-bold text-sm sm:text-base ${txn.transactionType === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          ₹{Number(txn.amount).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {txn.transactionType === 'CREDIT' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] sm:text-xs font-medium bg-emerald-50 text-emerald-700">
                            <ArrowUpRight className="w-3 h-3 shrink-0" /> Credit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] sm:text-xs font-medium bg-rose-50 text-rose-700">
                            <ArrowDownRight className="w-3 h-3 shrink-0" /> Debit
                          </span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-600 text-xs sm:text-sm min-w-[200px] break-words">
                        {txn.remarks || '-'}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-500 text-[10px] sm:text-xs whitespace-nowrap">
                        {txn.adminId?.name || 'System'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Deduct Incentive Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Manage Incentive</h2>
                  <p className="text-xs text-gray-500">For {selectedUser?.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleIncentiveSubmit} className="p-6 space-y-4">
              <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-100/50 mb-2">
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className="text-3xl font-black text-emerald-700 mt-1">₹{Number(selectedUser?.incentiveBalance || 0).toLocaleString('en-IN')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Transaction Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIncentiveData(prev => ({ ...prev, transactionType: 'CREDIT' }))}
                    className={`py-2 px-3 border rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                      incentiveData.transactionType === 'CREDIT' 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' 
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" /> Add (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIncentiveData(prev => ({ ...prev, transactionType: 'DEBIT' }))}
                    className={`py-2 px-3 border rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                      incentiveData.transactionType === 'DEBIT' 
                        ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm' 
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" /> Deduct (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (₹)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm font-medium">₹</span>
                  </div>
                  <input 
                    type="number" 
                    value={incentiveData.amount}
                    onChange={(e) => setIncentiveData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                    min="1"
                    placeholder="e.g. 5000"
                    className="pl-8 w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks / Reason</label>
                <input 
                  type="text" 
                  value={incentiveData.remarks}
                  onChange={(e) => setIncentiveData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="e.g. Q3 Target Achieved"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm" 
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`px-5 py-2.5 text-white rounded-lg text-sm font-bold shadow-md transition-all transform hover:-translate-y-0.5 ${
                    incentiveData.transactionType === 'CREDIT' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                  }`}
                >
                  Confirm {incentiveData.transactionType === 'CREDIT' ? 'Addition' : 'Deduction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User History Modal */}
      {isHistoryModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <History className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
                  <p className="text-xs text-gray-500">{selectedUser?.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-0">
              {userHistory.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <History className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>No transaction history found for this user.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 font-medium">Date & Time</th>
                      <th className="px-6 py-4 font-medium">Amount</th>
                      <th className="px-6 py-4 font-medium">Type</th>
                      <th className="px-6 py-4 font-medium">Remarks</th>
                      <th className="px-6 py-4 font-medium">Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {userHistory.map((txn) => (
                      <tr key={txn._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                          {new Date(txn.createdAt).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-bold ${txn.transactionType === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            ₹{Number(txn.amount).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {txn.transactionType === 'CREDIT' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700">
                              <ArrowUpRight className="w-3 h-3" /> Credit
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700">
                              <ArrowDownRight className="w-3 h-3" /> Debit
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{txn.remarks || '-'}</td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {txn.adminId?.name || 'System'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="bg-gray-50/50 p-4 border-t border-gray-100 flex justify-end shrink-0">
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-6 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Incentives;
