import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, X, ChevronDown, ChevronUp, IndianRupee, Clock, CheckCircle2, AlertCircle, FileText, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import apiClient from '../api/axiosConfig';

const StatusBadge = ({ status }) => {
  const styles = {
    Pending:   'bg-red-100 text-red-700 border border-red-200',
    Partial:   'bg-yellow-100 text-yellow-700 border border-yellow-200',
    Completed: 'bg-green-100 text-green-700 border border-green-200',
  };
  const icons = {
    Pending:   <AlertCircle className="w-3 h-3" />,
    Partial:   <Clock className="w-3 h-3" />,
    Completed: <CheckCircle2 className="w-3 h-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.Pending}`}>
      {icons[status]} {status}
    </span>
  );
};

const ProgressBar = ({ paid, total }) => {
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const color = pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>₹{paid?.toLocaleString('en-IN')} paid</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  // Init Modal
  const [initModal, setInitModal] = useState(false);
  const [initForm, setInitForm] = useState({ lead: '', totalAmount: '' });
  const [leads, setLeads] = useState([]);

  // Transaction Modal
  const [txnModal, setTxnModal] = useState({ isOpen: false, paymentId: null, balance: 0 });
  const [txnForm, setTxnForm] = useState({ amount: '', mode: 'Online', transactionId: '' });
  const [txnFile, setTxnFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Follow-up Modal
  const [followModal, setFollowModal] = useState({ isOpen: false, paymentId: null });
  const [followForm, setFollowForm] = useState({ text: '', nextFollowUpDate: '' });

  const [userProfile, setUserProfile] = useState(null);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    fetchPayments();
    fetchLeads();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/auth/profile');
      setUserProfile(res.data.user);
      setPermissions(res.data.user?.role?.permissions || []);
    } catch {}
  };

  const hasPermission = (perm) => {
    if (userProfile?.role?.name === 'Admin') return true;
    return permissions.includes(perm);
  };

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/payments');
      setPayments(res.data || []);
    } catch (err) {
      toast.error('Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await apiClient.get('/sales/leads/closed-won/all');
      setLeads(res.data.leads || []);
    } catch {}
  };

  const handleInitSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiClient.post('/payments/init', { lead: initForm.lead, totalAmount: Number(initForm.totalAmount) });
      toast.success('Payment account initialized!');
      setInitModal(false);
      setInitForm({ lead: '', totalAmount: '' });
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initialize payment');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTxnSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('amount', txnForm.amount);
      formData.append('mode', txnForm.mode);
      formData.append('transactionId', txnForm.transactionId);
      if (txnFile) formData.append('receipt', txnFile);
      await apiClient.post(`/payments/${txnModal.paymentId}/transactions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Transaction recorded successfully!');
      setTxnModal({ isOpen: false, paymentId: null, balance: 0 });
      setTxnForm({ amount: '', mode: 'Online', transactionId: '' });
      setTxnFile(null);
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add transaction');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFollowSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiClient.put(`/payments/${followModal.paymentId}/follow-up`, followForm);
      toast.success('Follow-up remark added!');
      setFollowModal({ isOpen: false, paymentId: null });
      setFollowForm({ text: '', nextFollowUpDate: '' });
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add remark');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = payments.filter(p => {
    const matchSearch = p.lead?.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalDue = payments.reduce((a, p) => a + (p.balanceAmount || 0), 0);
  const totalCollected = payments.reduce((a, p) => a + (p.paidAmount || 0), 0);
  const totalAmount = payments.reduce((a, p) => a + (p.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 shrink-0" />
            Payment Tracking
          </h1>
          <p className="text-[11px] sm:text-sm text-gray-500 mt-1">Track all customer payments, transactions and follow-ups.</p>
        </div>
        {hasPermission('initialize_payment') && (
          <button
            onClick={() => setInitModal(true)}
            className="bg-[#0B3A2C] hover:bg-[#124b39] text-white px-4 py-2 sm:py-2.5 rounded-lg transition-all shadow-sm font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 w-full sm:w-auto shrink-0"
          >
            <Plus className="w-4 h-4" /> Initialize Payment
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Total Invoiced</p>
          <p className="text-2xl font-bold text-gray-900">₹{totalAmount.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400 mt-1">{payments.length} payment accounts</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Total Collected</p>
          <p className="text-2xl font-bold text-green-600">₹{totalCollected.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400 mt-1">{payments.filter(p => p.status === 'Completed').length} fully paid</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Total Pending</p>
          <p className="text-2xl font-bold text-red-500">₹{totalDue.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400 mt-1">{payments.filter(p => p.status !== 'Completed').length} outstanding</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by customer name..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B3A2C] focus:ring-1 focus:ring-[#0B3A2C]"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B3A2C] bg-white"
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Partial">Partial</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Payment Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#0B3A2C] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No payment records found</p>
          <p className="text-gray-400 text-sm mt-1">Initialize a payment account to start tracking.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(payment => (
            <div key={payment._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Card Header */}
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors gap-4 sm:gap-3"
                onClick={() => setExpandedId(expandedId === payment._id ? null : payment._id)}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0B3A2C]/10 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                    <IndianRupee className="w-5 h-5 text-[#0B3A2C]" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm break-words">{payment.lead?.customerName || 'Unknown Customer'}</p>
                    <p className="text-xs text-gray-400">{payment.lead?.contactNumber || ''}</p>
                    {payment.project?.customerName && (
                      <p className="text-[10px] sm:text-xs text-emerald-600 font-medium mt-0.5">📁 {payment.project.customerName}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 flex-wrap w-full sm:w-auto border-t sm:border-0 border-gray-100 pt-3 sm:pt-0">
                  <div className="w-full sm:w-40 order-last sm:order-first">
                    <ProgressBar paid={payment.paidAmount} total={payment.totalAmount} />
                  </div>
                  <div className="text-left sm:text-right flex-1 sm:flex-none">
                    <p className="text-sm font-bold text-gray-900 whitespace-nowrap">₹{payment.totalAmount?.toLocaleString('en-IN')}</p>
                    <p className="text-[11px] sm:text-xs text-red-500 font-medium whitespace-nowrap">Due: ₹{payment.balanceAmount?.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={payment.status} />
                    {expandedId === payment._id ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                  </div>
                </div>
              </div>

              {/* Expanded Section */}
              {expandedId === payment._id && (
                <div className="border-t border-gray-100 p-4 space-y-5 bg-gray-50/50">
                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {hasPermission('add_transaction') && payment.status !== 'Completed' && (
                      <button
                        onClick={() => { setTxnModal({ isOpen: true, paymentId: payment._id, balance: payment.balanceAmount }); setTxnForm({ amount: '', mode: 'Online', transactionId: '' }); }}
                        className="px-3 py-1.5 bg-[#0B3A2C] text-white text-xs font-semibold rounded-lg hover:bg-[#124b39] flex items-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Transaction
                      </button>
                    )}
                    <button
                      onClick={() => { setFollowModal({ isOpen: true, paymentId: payment._id }); setFollowForm({ text: '', nextFollowUpDate: '' }); }}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Add Follow-Up
                    </button>
                  </div>

                  {/* Transactions */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Transactions ({payment.transactions?.length || 0})
                    </h4>
                    {payment.transactions?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-gray-500 border-b border-gray-200">
                              <th className="pb-2 pr-4 font-semibold">Amount</th>
                              <th className="pb-2 pr-4 font-semibold">Mode</th>
                              <th className="pb-2 pr-4 font-semibold">Txn ID</th>
                              <th className="pb-2 pr-4 font-semibold">Date</th>
                              <th className="pb-2 font-semibold">Receipt</th>
                            </tr>
                          </thead>
                          <tbody>
                            {payment.transactions.map((txn, i) => (
                              <tr key={i} className="border-b border-gray-100 last:border-0">
                                <td className="py-2 pr-4 font-bold text-green-600">₹{txn.amount?.toLocaleString('en-IN')}</td>
                                <td className="py-2 pr-4">
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">{txn.mode}</span>
                                </td>
                                <td className="py-2 pr-4 text-gray-500">{txn.transactionId || '—'}</td>
                                <td className="py-2 pr-4 text-gray-500">{new Date(txn.date).toLocaleDateString('en-IN')}</td>
                                <td className="py-2">
                                  {txn.receiptUrl ? (
                                    <a href={`http://localhost:5000${txn.receiptUrl}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a>
                                  ) : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No transactions yet.</p>
                    )}
                  </div>

                  {/* Follow-ups */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" /> Follow-Up Remarks ({payment.followUpRemarks?.length || 0})
                    </h4>
                    {payment.followUpRemarks?.length > 0 ? (
                      <div className="space-y-2">
                        {payment.followUpRemarks.map((rmk, i) => (
                          <div key={i} className="bg-white rounded-lg border border-gray-200 p-3">
                            <p className="text-xs text-gray-700">{rmk.text}</p>
                            <div className="flex gap-3 mt-1.5 text-[10px] text-gray-400">
                              <span>By: {rmk.addedBy?.name || 'Unknown'}</span>
                              <span>{new Date(rmk.date).toLocaleDateString('en-IN')}</span>
                              {rmk.nextFollowUpDate && (
                                <span className="text-blue-500 font-semibold">
                                  Next: {new Date(rmk.nextFollowUpDate).toLocaleDateString('en-IN')}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No follow-up remarks yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Initialize Payment Modal */}
      {initModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Initialize Payment Account</h2>
              <button onClick={() => setInitModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleInitSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer (Closed-Won Lead) *</label>
                <select
                  required
                  value={initForm.lead}
                  onChange={e => setInitForm({ ...initForm, lead: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B3A2C] bg-white"
                >
                  <option value="">Select Customer</option>
                  {leads.map(l => <option key={l._id} value={l._id}>{l.customerName} — {l.contactNumber}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Invoice Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={initForm.totalAmount}
                  onChange={e => setInitForm({ ...initForm, totalAmount: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B3A2C]"
                  placeholder="e.g. 50000"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setInitModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-semibold bg-[#0B3A2C] text-white rounded-lg hover:bg-[#124b39] disabled:opacity-50">
                  {isSaving ? 'Saving...' : 'Initialize'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {txnModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Record Payment</h2>
                <p className="text-xs text-gray-500 mt-0.5">Balance due: <span className="font-bold text-red-500">₹{txnModal.balance?.toLocaleString('en-IN')}</span></p>
              </div>
              <button onClick={() => setTxnModal({ isOpen: false, paymentId: null, balance: 0 })} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleTxnSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input type="number" required min="1" max={txnModal.balance} value={txnForm.amount}
                    onChange={e => setTxnForm({ ...txnForm, amount: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B3A2C]"
                    placeholder="Amount" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                  <select value={txnForm.mode} onChange={e => setTxnForm({ ...txnForm, mode: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B3A2C] bg-white">
                    <option>Online</option>
                    <option>Cash</option>
                    <option>Cheque</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction / Reference ID</label>
                <input type="text" value={txnForm.transactionId}
                  onChange={e => setTxnForm({ ...txnForm, transactionId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B3A2C]"
                  placeholder="UPI ref, cheque no., etc." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt (optional)</label>
                <input type="file" accept="image/*,.pdf"
                  onChange={e => setTxnFile(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0B3A2C]/10 file:text-[#0B3A2C] hover:file:bg-[#0B3A2C]/20" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setTxnModal({ isOpen: false, paymentId: null, balance: 0 })} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-semibold bg-[#0B3A2C] text-white rounded-lg hover:bg-[#124b39] disabled:opacity-50">
                  {isSaving ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Follow-Up Modal */}
      {followModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Add Follow-Up Remark</h2>
              <button onClick={() => setFollowModal({ isOpen: false, paymentId: null })} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleFollowSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remark *</label>
                <textarea required rows={3} value={followForm.text}
                  onChange={e => setFollowForm({ ...followForm, text: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B3A2C] resize-none"
                  placeholder="e.g. Customer will pay remaining amount by Friday..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Follow-Up Date</label>
                <input type="date" value={followForm.nextFollowUpDate}
                  onChange={e => setFollowForm({ ...followForm, nextFollowUpDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B3A2C]" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setFollowModal({ isOpen: false, paymentId: null })} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {isSaving ? 'Saving...' : 'Add Remark'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
