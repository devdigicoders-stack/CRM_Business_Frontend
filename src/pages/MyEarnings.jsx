import React, { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, History, ShieldAlert } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../api/axiosConfig';

const MyEarnings = () => {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyEarnings();
  }, []);

  const fetchMyEarnings = async () => {
    try {
      setIsLoading(true);
      // 1. Get current logged-in user's profile
      const profileRes = await apiClient.get('/auth/profile');
      const currentUser = profileRes.data.user;
      
      if (!currentUser || !currentUser._id) {
        throw new Error("Unable to identify user");
      }

      // 2. Fetch history for this user
      const historyRes = await apiClient.get(`/incentives/history/${currentUser._id}`);
      
      setUser(historyRes.data.employee);
      setTransactions(historyRes.data.transactions);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load your earnings');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading your earnings...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Error</h2>
        <p className="text-gray-500 mt-2">Could not load your profile data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Earnings & Incentives</h1>
          <p className="text-[11px] sm:text-sm text-gray-500 mt-1">View your current wallet balance and transaction history.</p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl shadow-lg p-8 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Wallet className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <p className="text-emerald-100 font-medium mb-1">Available Balance</p>
          <h2 className="text-4xl sm:text-5xl font-black mb-6">
            ₹{Number(user.incentiveBalance || 0).toLocaleString('en-IN')}
          </h2>
          
          <div className="flex items-center gap-2 text-sm text-emerald-50">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
              {user.name?.substring(0, 2).toUpperCase()}
            </div>
            <span>{user.name}</span>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
          <History className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-bold text-gray-800">Transaction History</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium border-b border-gray-100 whitespace-nowrap">Date & Time</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium border-b border-gray-100 whitespace-nowrap">Amount</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium border-b border-gray-100 whitespace-nowrap">Type</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium border-b border-gray-100 whitespace-nowrap">Remarks / Reason</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium border-b border-gray-100 whitespace-nowrap">Processed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Wallet className="w-12 h-12 text-gray-200 mb-3" />
                      <p>You have no incentive transactions yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-600 whitespace-nowrap">
                      {new Date(txn.createdAt).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`font-bold ${txn.transactionType === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {txn.transactionType === 'CREDIT' ? '+' : '-'} ₹{Number(txn.amount).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {txn.transactionType === 'CREDIT' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-medium bg-emerald-50 text-emerald-700">
                          <ArrowUpRight className="w-3 h-3 shrink-0" /> Credit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-medium bg-rose-50 text-rose-700">
                          <ArrowDownRight className="w-3 h-3 shrink-0" /> Debit
                        </span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-700 font-medium min-w-[200px] break-words">{txn.remarks || '-'}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-500 text-[10px] sm:text-xs whitespace-nowrap">
                      {txn.adminId?.name || 'Admin'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyEarnings;
