import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import {
  Search, Eye, X, UserCheck, ClipboardList, Phone, Mail,
  Building2, Tag, Calendar, MessageSquare, ChevronRight, FileText, ExternalLink
} from 'lucide-react';
import apiClient from '../api/axiosConfig';

const getStatusBadge = (status) => {
  const map = {
    'New': 'bg-blue-50 text-blue-600 border-blue-100',
    'Contacted': 'bg-cyan-50 text-cyan-600 border-cyan-100',
    'Interested': 'bg-indigo-50 text-indigo-600 border-indigo-100',
    'Follow-up': 'bg-amber-50 text-amber-600 border-amber-100',
    'Follow Up': 'bg-amber-50 text-amber-600 border-amber-100',
    'Quotation Sent': 'bg-purple-50 text-purple-600 border-purple-100',
    'Negotiation': 'bg-orange-50 text-orange-600 border-orange-100',
    'Closed-Won': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Closed-Lost': 'bg-red-50 text-red-600 border-red-100',
  };
  const cls = map[status] || 'bg-gray-50 text-gray-600 border-gray-100';
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border whitespace-nowrap inline-block ${cls}`}>
      {status}
    </span>
  );
};

const statusColors = {
  'New': '#3B82F6',
  'Contacted': '#06B6D4',
  'Interested': '#6366F1',
  'Follow-up': '#F59E0B',
  'Quotation Sent': '#A855F7',
  'Negotiation': '#F97316',
  'Closed-Won': '#10B981',
  'Closed-Lost': '#EF4444',
};

const MyLeads = () => {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [remarkText, setRemarkText] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const [userProfile, setUserProfile] = useState(null);
  
  const [hasUploadDocuments, setHasUploadDocuments] = useState(false);
  const [hasVerifyDocuments, setHasVerifyDocuments] = useState(false);
  
  // Document Upload State
  const [docFile, setDocFile] = useState(null);
  const [docType, setDocType] = useState('Aadhar');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const tabs = ['All', 'New', 'Contacted', 'Interested', 'Follow-up', 'Quotation Sent', 'Negotiation', 'Closed-Won', 'Closed-Lost'];

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/auth/profile');
      const user = res.data.user;
      setUserProfile(user);
      
      const permissions = user?.role?.permissions || [];
      const isAdmin = user?.role?.name === 'Admin';
      setHasUploadDocuments(isAdmin || permissions.includes('upload_documents'));
      setHasVerifyDocuments(isAdmin || permissions.includes('verify_documents'));
    } catch (err) {
      console.warn('Could not fetch profile:', err);
    }
  };

  const fetchMyLeads = async (page = 1, status = activeTab, search = searchQuery, limit = pageSize) => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/sales/leads', {
        params: { page, limit, status, search }
      });
      setLeads(res.data.leads || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalLeads(res.data.totalLeads || 0);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch your leads');
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    fetchMyLeads(currentPage, activeTab, searchQuery, pageSize);
  }, [currentPage, activeTab, pageSize]);

  const isFirstSearchRender = useRef(true);

  // Debounce search
  useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchMyLeads(1, activeTab, searchQuery, pageSize);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const openViewModal = async (lead) => {
    try {
      const res = await apiClient.get(`/sales/leads/${lead._id}`);
      setSelectedLead(res.data);
      setNewStatus(res.data.status);
      setIsViewModalOpen(true);
    } catch (error) {
      toast.error('Failed to load lead details');
    }
  };

  const handleAddRemark = async (e) => {
    e.preventDefault();
    if (!remarkText.trim()) return;
    try {
      const payload = {
        remarkText: remarkText.trim(),
        status: newStatus
      };
      if (nextFollowUpDate) {
        payload.nextFollowUpDate = nextFollowUpDate;
      }
      await apiClient.put(`/sales/leads/${selectedLead._id}`, payload);
      toast.success('Remark added!');
      setRemarkText('');
      setNextFollowUpDate('');
      openViewModal(selectedLead); // Refresh modal
      fetchMyLeads(currentPage, activeTab, searchQuery, pageSize);
    } catch (error) {
      toast.error('Failed to add remark');
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus || newStatus === selectedLead.status) return;
    try {
      setIsUpdatingStatus(true);
      await apiClient.put(`/sales/leads/${selectedLead._id}`, { status: newStatus });
      toast.success(`Status updated to "${newStatus}"!`);
      openViewModal(selectedLead);
      fetchMyLeads(currentPage, activeTab, searchQuery, pageSize);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docFile || !docType) return toast.warning("Please select a file and document type");
    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('documents', docFile);
      formData.append('documentTypes', docType);

      await apiClient.post(`/sales/leads/${selectedLead._id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Document uploaded successfully!");
      setDocFile(null);
      
      const res = await apiClient.get(`/sales/leads/${selectedLead._id}`);
      setSelectedLead(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload document");
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleVerifyDocument = async (docId, status, remarks = '') => {
    try {
      await apiClient.put(`/sales/leads/${selectedLead._id}/documents/verify`, {
        documentId: docId,
        status,
        remarks
      });
      toast.success(`Document marked as ${status}`);
      const res = await apiClient.get(`/sales/leads/${selectedLead._id}`);
      setSelectedLead(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to verify document");
    }
  };

  // Stats calculation
  const stats = [
    { label: 'Total Assigned', value: totalLeads, color: '#0B3A2C', icon: ClipboardList },
    { label: 'New', value: leads.filter(l => l.status === 'New').length, color: '#3B82F6', icon: Tag },
    { label: 'Follow-up', value: leads.filter(l => l.status === 'Follow-up' || l.status === 'Follow Up').length, color: '#F59E0B', icon: Phone },
    { label: 'Closed-Won', value: leads.filter(l => l.status === 'Closed-Won').length, color: '#10B981', icon: UserCheck },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>

          <h1 className="text-2xl font-bold text-gray-900">My Assigned Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Hello <span className="font-semibold text-[#0B3A2C]">{userProfile?.name || '...'}</span> — yahan aapke saare assigned leads hain
          </p>
        </div>

      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${stat.color}15` }}>
                <Icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pipeline Stages</span>
            <div className="relative">
              <input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-3.5 pr-9 py-2 border border-gray-200 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-48 sm:w-64 bg-white shadow-sm"
              />
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? 'bg-[#0B3A2C] text-white shadow-sm'
                    : 'bg-gray-100/70 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Company</th>
                <th className="px-6 py-4 font-semibold">Phone</th>
                <th className="px-6 py-4 font-semibold">Source</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Status</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Quotation</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Date</th>
                <th className="px-6 py-4 font-semibold text-center">Docs</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-[#0B3A2C] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-gray-500">Loading your leads...</p>
                    </div>
                  </td>
                </tr>
              ) : leads.length > 0 ? (
                leads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(lead.customerName)}&background=random&size=40`}
                          alt={lead.customerName}
                          className="w-9 h-9 rounded-full object-cover shadow-sm border border-gray-100 shrink-0"
                        />
                        <div>
                          <span className="font-semibold text-gray-900 block text-sm">{lead.customerName}</span>
                          {lead.email && <span className="text-xs text-gray-400">{lead.email}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{lead.companyName || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">{lead.contactNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{lead.source}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(lead.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.quotation ? (
                        <a
                          href={`/view-quote/${encodeURIComponent(lead.quotation.quotationNumber)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90 rounded-lg text-xs font-bold transition-all shadow-xs group/q whitespace-nowrap"
                          title={`View Quotation (${lead.quotation.status})`}
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-mono whitespace-nowrap leading-none">{lead.quotation.quotationNumber}</span>
                          <ExternalLink className="w-3 h-3 text-emerald-500 opacity-60 group-hover/q:opacity-100 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs italic">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                      {new Date(lead.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        {lead.documents && lead.documents.length > 0 ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap border border-blue-100">
                              {lead.documents.length} Uploaded
                            </span>
                            {lead.documents.some(d => d.status === 'Pending') && (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                Pending Review
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs italic">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openViewModal(lead)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#0B3A2C]/5 text-[#0B3A2C] rounded-lg hover:bg-[#0B3A2C] hover:text-white transition-all border border-[#0B3A2C]/10"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <ClipboardList className="w-7 h-7 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">Koi lead assign nahi hai</p>
                        <p className="text-sm text-gray-400 mt-1">Admin ya Manager aapko leads assign karega tab yahan dikhenge</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4 text-sm text-gray-700">
            <p>
              Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
              <span className="font-semibold text-gray-900">{totalPages}</span>{' '}
              <span className="text-gray-400">({totalLeads} total)</span>
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="text-xs border border-gray-300 rounded px-2 py-1 bg-white font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-3 py-2 text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
            >
              Previous
            </button>
            <span className="relative inline-flex items-center px-4 py-2 text-xs font-semibold text-[#0B3A2C] bg-[#0B3A2C]/5 ring-1 ring-inset ring-gray-300">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="relative inline-flex items-center rounded-r-md px-3 py-2 text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
            >
              Next
            </button>
          </nav>
        </div>
      </div>

      {/* View Lead Modal */}
      {isViewModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-none shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gradient-to-r from-[#0B3A2C]/5 to-emerald-50/30 shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedLead.customerName)}&background=random&size=48`}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedLead.customerName}</h2>
                  <p className="text-sm text-gray-500">{selectedLead.companyName || 'No Company'}</p>
                </div>
              </div>
              <button
                onClick={() => { setIsViewModalOpen(false); setRemarkText(''); }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Phone', value: selectedLead.contactNumber, icon: Phone },
                  { label: 'Email', value: selectedLead.email || '—', icon: Mail },
                  { label: 'Source', value: selectedLead.source, icon: Tag },
                  { label: 'Added On', value: new Date(selectedLead.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }), icon: Calendar },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">{label}</p>
                    </div>
                    <p className="font-semibold text-gray-800 text-sm truncate" title={value}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Assigned By */}
              {selectedLead.assignedBy?.name && (
                <div className="bg-[#0B3A2C]/5 border border-[#0B3A2C]/10 rounded-xl p-3 flex items-center gap-3">
                  <UserCheck className="w-4 h-4 text-[#0B3A2C] shrink-0" />
                  <p className="text-sm text-gray-700">
                    Lead assigned by <span className="font-bold text-[#0B3A2C]">{selectedLead.assignedBy.name}</span>
                  </p>
                </div>
              )}

              {/* Next Follow Up */}
              {selectedLead.nextFollowUpDate && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-sm text-amber-800">
                    <span className="font-bold uppercase tracking-wide text-xs mr-2">Next Follow-Up:</span>
                    <span className="font-semibold">{new Date(selectedLead.nextFollowUpDate).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', hour12: true })}</span>
                  </p>
                </div>
              )}

              {/* Official Quotation Card (If Generated) */}
              {selectedLead.quotation && (
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0B3A2C] text-white flex items-center justify-center shadow-sm shrink-0">
                      <FileText className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Official Quotation</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {selectedLead.quotation.status || 'Generated'}
                        </span>
                      </div>
                      <p className="text-sm font-extrabold text-gray-900 font-mono mt-0.5">
                        {selectedLead.quotation.quotationNumber}
                        {selectedLead.quotation.totalAmount && (
                          <span className="font-sans font-bold text-gray-700 ml-2">
                            (₹{Number(selectedLead.quotation.totalAmount).toLocaleString()})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`/view-quote/${encodeURIComponent(selectedLead.quotation.quotationNumber)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0B3A2C] hover:bg-[#124b39] text-white rounded-xl text-xs font-bold shadow-sm transition-all whitespace-nowrap"
                  >
                    <span>Open Official PDF</span>
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-300" />
                  </a>
                </div>
              )}

              {/* Documents Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 border-b border-gray-100 pb-2">
                    <FileText className="w-4 h-4 text-gray-500" /> Documents
                  </h3>

                  {/* Document Grid */}
                  <div className="space-y-3 mb-2">
                      {['Aadhar', 'PAN', 'GST', 'Other'].map(type => {
                          const doc = selectedLead.documents?.find(d => d.documentType === type);
                          
                          if (doc) {
                              return (
                                  <div key={type} className="bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                                          <FileText className="w-4 h-4 text-gray-500" />
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold text-gray-900">{doc.documentType} - {doc.fileName}</p>
                                          <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                              doc.status === 'Verified' ? 'bg-emerald-100 text-emerald-700' :
                                              doc.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                                              'bg-amber-100 text-amber-700'
                                            }`}>
                                              {doc.status}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                              {new Date(doc.uploadedAt).toLocaleDateString()}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-1">
                                        <a href={`http://localhost:5000${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="View Document">
                                          <Eye className="w-4 h-4" />
                                        </a>
                                        
                                        {/* Verify/Reject Actions */}
                                        {hasVerifyDocuments && doc.status === 'Pending' && (
                                          <>
                                            <button onClick={() => handleVerifyDocument(doc._id, 'Verified')} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors" title="Approve">
                                              <UserCheck className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => {
                                              const reason = window.prompt("Reason for rejection:");
                                              if(reason !== null) handleVerifyDocument(doc._id, 'Rejected', reason);
                                            }} className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors" title="Reject">
                                              <X className="w-4 h-4" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                  </div>
                              );
                          }

                          // If not uploaded and user has permission to upload
                          if (hasUploadDocuments) {
                              return (
                                  <div key={type} className="bg-gray-50/50 p-3 rounded-xl border border-dashed border-gray-200 flex flex-col md:flex-row items-center gap-4 justify-between">
                                      <div className="flex items-center gap-3 w-full md:w-auto">
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                          <FileText className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-600 whitespace-nowrap min-w-[100px]">{type} {type !== 'Other' ? 'Card' : 'Document'}</p>
                                      </div>
                                      
                                      <form className="flex items-center gap-3 w-full md:w-auto">
                                          <input 
                                            type="file" 
                                            name="fileInput"
                                            className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer bg-white border border-gray-200 rounded-lg"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                          />
                                          <button 
                                              type="button" 
                                              onClick={async (e) => {
                                                  const form = e.target.closest('form');
                                                  const file = form.elements.fileInput.files[0];
                                                  if(!file) return toast.warning("Please select a file");
                                                  
                                                  setIsUploadingDoc(true);
                                                  try {
                                                    const formData = new FormData();
                                                    formData.append('documents', file);
                                                    formData.append('documentTypes', type);
                                              
                                                    await apiClient.post(`/sales/leads/${selectedLead._id}/documents`, formData, {
                                                      headers: { 'Content-Type': 'multipart/form-data' }
                                                    });
                                                    toast.success(`${type} uploaded successfully!`);
                                                    const res = await apiClient.get(`/sales/leads/${selectedLead._id}`);
                                                    setSelectedLead(res.data);
                                                    form.reset();
                                                  } catch (error) {
                                                    toast.error(error.response?.data?.message || "Failed to upload document");
                                                  } finally {
                                                    setIsUploadingDoc(false);
                                                  }
                                              }}
                                              disabled={isUploadingDoc} 
                                              className="bg-[#0B3A2C] text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-sm hover:bg-[#0a2f23] transition-colors whitespace-nowrap disabled:opacity-50"
                                          >
                                              Upload
                                          </button>
                                      </form>
                                  </div>
                              );
                          }
                          return null;
                      })}
                  </div>
              </div>

              {/* Update Status */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-500" /> Update Status
                </h3>
                <div className="flex items-center gap-3">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  >
                    {['New', 'Contacted', 'Interested', 'Follow-up', 'Quotation Sent', 'Negotiation', 'Closed-Won', 'Closed-Lost'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={isUpdatingStatus || newStatus === selectedLead.status}
                    className="px-4 py-2 bg-[#0B3A2C] text-white rounded-lg text-sm font-semibold hover:bg-[#0a2f23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isUpdatingStatus ? 'Saving...' : 'Update'}
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  Current: {getStatusBadge(selectedLead.status)}
                </p>
              </div>

              {/* Remarks Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" /> Follow-up Remarks
                  <span className="ml-auto bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {selectedLead.remarks?.length || 0}
                  </span>
                </h3>

                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                  {selectedLead.remarks && selectedLead.remarks.length > 0 ? (
                    [...selectedLead.remarks].reverse().map((rm, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="text-sm text-gray-700 leading-relaxed">{rm.text}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-[#0B3A2C] font-semibold">{rm.addedBy?.name || 'Staff'}</span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(rm.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })},{' '}
                            {new Date(rm.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg">
                      Abhi tak koi remark nahi add kiya gaya
                    </div>
                  )}
                </div>

                {/* Add Remark Form */}
                <form onSubmit={handleAddRemark} className="flex flex-col gap-3 pt-3 border-t border-gray-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={remarkText}
                      onChange={(e) => setRemarkText(e.target.value)}
                      placeholder="Naya follow-up remark likhein..."
                      className="flex-1 px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 bg-gray-50/80 p-2.5 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600 font-semibold whitespace-nowrap">Schedule Next Call:</label>
                      <input 
                        type="datetime-local" 
                        value={nextFollowUpDate}
                        onChange={(e) => setNextFollowUpDate(e.target.value)}
                        className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-[#0B3A2C] text-white px-5 py-2 rounded-md text-sm font-bold shadow-sm hover:bg-[#0a2f23] transition-colors whitespace-nowrap"
                    >
                      Save Remark
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLeads;
