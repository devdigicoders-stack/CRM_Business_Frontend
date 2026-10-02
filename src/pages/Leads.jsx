import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { 
  Download, Plus, Search, Filter, 
  MoreVertical, Edit3, ChevronDown, X, Eye, Upload, UserCheck, CheckSquare, Users, FileText, ExternalLink
} from 'lucide-react';
import apiClient from '../api/axiosConfig';
import Swal from 'sweetalert2';
// Removed bulk import libraries

const getStatusBadge = (status) => {
  const base = "px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap inline-block";
  switch (status) {
    case 'New': return <span className={`${base} bg-blue-50 text-blue-600`}>New</span>;
    case 'Contacted': return <span className={`${base} bg-cyan-50 text-cyan-600`}>Contacted</span>;
    case 'Interested': return <span className={`${base} bg-indigo-50 text-indigo-600`}>Interested</span>;
    case 'Follow-up':
    case 'Follow Up': return <span className={`${base} bg-amber-50 text-amber-600`}>Follow-up</span>;
    case 'Quotation Pending': return <span className={`${base} bg-yellow-50 text-yellow-600 border border-yellow-200`}>Quotation Pending</span>;
    case 'Quotation Sent': return <span className={`${base} bg-purple-50 text-purple-600`}>Quotation Sent</span>;
    case 'Quotation Approved': return <span className={`${base} bg-teal-50 text-teal-600 border border-teal-200`}>Quotation Approved</span>;
    case 'Quotation Rejected': return <span className={`${base} bg-orange-50 text-orange-600 border border-orange-200`}>Quotation Rejected</span>;
    case 'Negotiation': return <span className={`${base} bg-indigo-50 text-indigo-600`}>Negotiation</span>;
    case 'Closed-Won': return <span className={`${base} bg-emerald-50 text-emerald-600`}>Closed-Won</span>;
    case 'Closed-Lost': return <span className={`${base} bg-red-50 text-red-600`}>Closed-Lost</span>;
    case 'Rejected': return <span className={`${base} bg-rose-50 text-rose-600 border border-rose-200`}>Rejected</span>;
    case 'Approved': return <span className={`${base} bg-green-100 text-green-700 border border-green-300`}>Approved</span>;
    default: return <span className={`${base} bg-gray-50 text-gray-600`}>{status}</span>;
  }
};

const Leads = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [rejectModalDocId, setRejectModalDocId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
      const [modalMode, setModalMode] = useState('add');
  const [selectedLead, setSelectedLead] = useState(null);
            const [documentTypes, setDocumentTypes] = useState([]);
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [hasManageLeads, setHasManageLeads] = useState(false);
  const [hasCreateLead, setHasCreateLead] = useState(false);
  const [hasUploadDocuments, setHasUploadDocuments] = useState(false);
  const [hasVerifyDocuments, setHasVerifyDocuments] = useState(false);
// Removed hasBulkUploadLeads state
  
  // Document Upload State
  const [docFile, setDocFile] = useState(null);
  const [docType, setDocType] = useState('Aadhar');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    contactNumber: '',
    email: '',
    companyName: '',
    status: 'Pending'
  });

  const [leadDocuments, setLeadDocuments] = useState({});

  const [remarkText, setRemarkText] = useState('');
  const [remarkStatus, setRemarkStatus] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
// Removed isImporting state

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  
  const tabs = ['All', 'Pending', 'Contacted', 'Interested', 'Follow-up', 'Quotation Sent', 'Negotiation', 'Closed-Won', 'Closed-Lost'];

  const fetchLeads = async (page = 1, status = activeTab, search = searchQuery, limit = pageSize) => {
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
      toast.error("Failed to fetch leads");
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchDocTypes = async () => {
      try {
        const res = await apiClient.get('/master/document-types');
        if (res.data) setDocumentTypes(res.data);
      } catch (err) {
        console.error("Failed to fetch document types", err);
      }
    };
    fetchDocTypes();
  }, []);

  
  useEffect(() => {
        // Fetch current user profile to check permissions for hiding/showing buttons
    const fetchProfile = async () => {
        try {
            const res = await apiClient.get('/auth/profile');
            const user = res.data.user;
            setCurrentUser(user);
            const permissions = user?.role?.permissions || [];
            const isAdmin = user?.role?.name === 'Admin';
            setHasManageLeads(isAdmin || permissions.includes('manage_leads'));
            setHasCreateLead(isAdmin || permissions.includes('create_lead'));
            setHasUploadDocuments(isAdmin || permissions.includes('upload_documents'));
            setHasVerifyDocuments(isAdmin || permissions.includes('verify_documents'));
// Removed setHasBulkUploadLeads
        } catch (err) {
            console.error("Error fetching profile", err);
        }
    };
    fetchProfile();
  }, []);

  // Fetch when tab, search, page, pageSize or assignedToFilter changes
  useEffect(() => {
        fetchLeads(currentPage, activeTab, searchQuery, pageSize);
  }, [currentPage, activeTab, pageSize]);

  const isFirstSearchRender = useRef(true);

  // Debounce search
  useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setCurrentPage(1); // Reset to page 1 on new search
      fetchLeads(1, activeTab, searchQuery, pageSize);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'contactNumber') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length <= 10) {
        setFormData(prev => ({ ...prev, [name]: numericValue }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      customerName: '', contactNumber: '', email: '', companyName: '', status: 'Pending'
    });
    setLeadDocuments({});
    setSelectedLead(null);
    setIsModalOpen(true);
  };

  const openEditModal = (lead) => {
    setModalMode('edit');
    setSelectedLead(lead);
    setFormData({
      customerName: lead.customerName || '',
      contactNumber: lead.contactNumber || '',
      email: lead.email || '',
      companyName: lead.companyName || '',
      status: lead.status || 'New'
    });
    setLeadDocuments({});
    setIsModalOpen(true);
  };

  const openViewModal = async (lead) => {
    try {
        const res = await apiClient.get(`/sales/leads/${lead._id}`);
        setSelectedLead(res.data);
        setRemarkStatus(res.data.status);
        setIsViewModalOpen(true);
    } catch (error) {
        toast.error("Failed to load lead details");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.contactNumber && formData.contactNumber.length !== 10) {
      toast.warning("Phone number must be exactly 10 digits.");
      return;
    }
    try {
      if (modalMode === 'add') {
        const payload = new FormData();
        payload.append('customerName', formData.customerName);
        payload.append('contactNumber', formData.contactNumber);
        payload.append('email', formData.email);
        payload.append('companyName', formData.companyName);
        payload.append('status', formData.status);
        
        Object.keys(leadDocuments).forEach(docId => {
          if (leadDocuments[docId]) {
            const docName = documentTypes.find(d => d._id === docId)?.name || docId;
            payload.append('documents', leadDocuments[docId]);
            payload.append('documentTypes', docName);
          }
        });

        await apiClient.post('/sales/leads', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Lead added successfully!');
      } else {
        const editPayload = { ...formData };
        await apiClient.put(`/sales/leads/${selectedLead._id}`, editPayload);
        toast.success('Lead updated successfully!');
      }
      setIsModalOpen(false);
      fetchLeads(currentPage, activeTab, searchQuery);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving lead');
    }
  };

  const handleAddRemark = async (e) => {
      e.preventDefault();
      if(!remarkText) return;
      try {
          const payload = {
              ...selectedLead,
              remarkText: remarkText,
              status: remarkStatus || selectedLead.status
          };
          if (nextFollowUpDate) {
              payload.nextFollowUpDate = nextFollowUpDate;
          }
          await apiClient.put(`/sales/leads/${selectedLead._id}`, payload);
          toast.success("Remark added!");
          setRemarkText('');
          setNextFollowUpDate('');
          openViewModal(selectedLead); // refresh modal data
          fetchLeads();
      } catch (error) {
          toast.error("Failed to add remark");
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
      
      // Refresh lead details
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
      // Refresh lead details
      const res = await apiClient.get(`/sales/leads/${selectedLead._id}`);
      setSelectedLead(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to verify document");
    }
  };

// Removed bulk import functions

  // Filter logic is now on backend, so we just use leads directly
  const filteredLeads = leads;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-[11px] sm:text-sm text-gray-500 mt-1">Manage and track all your sales leads</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {hasCreateLead && (
            <button onClick={openAddModal} className="bg-[#0B3A2C] text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-[#0a2f23] transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Lead
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search - Professional Clean Layout */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col gap-3.5 bg-white">
          {/* Top row: Search & Staff Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pipeline Stages</span>
            </div>

            <div className="flex items-center gap-3">


              {/* Search */}
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
          </div>

          {/* Bottom row: Clean Horizontal Scrollable Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {tabs.map(tab => {
              const isActive = activeTab === tab;
              return (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive 
                    ? 'bg-[#0B3A2C] text-white shadow-sm ring-1 ring-[#0B3A2C]' 
                    : 'bg-gray-100/70 text-gray-600 hover:bg-gray-200/80 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                
                <th className="px-6 py-4 font-semibold">Customer Name</th>
                <th className="px-6 py-4 font-semibold">Company</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Status</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Quotation</th>
                <th className="px-6 py-4 font-semibold">Phone</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Date</th>
                <th className="px-6 py-4 font-semibold text-center">Docs</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                    <td colSpan="11" className="px-6 py-12 text-center text-gray-500">Loading leads...</td>
                </tr>
              ) : filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => {
                                    return (
                    <tr key={lead._id} className={`transition-colors hover:bg-gray-50/50`}>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={`https://ui-avatars.com/api/?name=${lead.customerName}&background=random`} alt={lead.customerName} className="w-9 h-9 rounded-full object-cover shadow-sm border border-gray-100" />
                          <div>
                              <span className="font-semibold text-gray-900 block">{lead.customerName}</span>
                              {lead.email && <span className="text-xs text-gray-500">{lead.email}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{lead.companyName || '-'}</td>
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
                      <td className="px-6 py-4 text-sm text-gray-500">{lead.contactNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{new Date(lead.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
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
                        <div className="flex items-center justify-end gap-2">

                          <button onClick={() => openViewModal(lead)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Lead">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEditModal(lead)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit Lead">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    No leads found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4 text-sm text-gray-700">
            <p>
              Showing page <span className="font-semibold text-gray-900">{currentPage}</span> of <span className="font-semibold text-gray-900">{totalPages}</span> 
              {' '} ({totalLeads} total leads)
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-xs border border-gray-300 rounded px-2 py-1 bg-white font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-3 py-2 text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
              >
                Previous
              </button>
              <span className="relative inline-flex items-center px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50/50 ring-1 ring-inset ring-gray-300">
                {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="relative inline-flex items-center rounded-r-md px-3 py-2 text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Add/Edit Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/80 shrink-0">
              <h2 className="text-xl font-bold text-gray-900">{modalMode === 'add' ? 'Add New Lead' : 'Edit Lead'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                  <input type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm" placeholder="Tech Solutions Pvt Ltd" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm" placeholder="+91 9876543210" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modalMode === 'edit' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    {(() => {
                      const isAdminOrManager = currentUser?.role?.name === 'Admin' || currentUser?.role?.name === 'Sales Manager';
                      const postApprovalStatuses = ['Quotation Approved', 'New', 'Interested', 'Follow-up', 'Negotiation', 'Closed-Won', 'Closed-Lost'];
                      const canSalesEdit = !isAdminOrManager && (postApprovalStatuses.includes(selectedLead?.status) || postApprovalStatuses.includes(formData.status));
                      
                      if (selectedLead?.status === 'Closed-Won') {
                          return (
                              <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-between text-sm">
                                <span>Closed-Won</span>
                                <span className="text-[10px] text-gray-400 bg-gray-200 px-2 py-0.5 rounded ml-2">Locked</span>
                              </div>
                          );
                      }

                      if (isAdminOrManager) {
                        return (
                          <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-sm">
                            <option value="Pending">Pending</option>
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Interested">Interested</option>
                            <option value="Follow-up">Follow-up</option>
                            <option value="Quotation Pending">Quotation Pending</option>
                            <option value="Quotation Sent">Quotation Sent</option>
                            <option value="Quotation Approved">Quotation Approved</option>
                            <option value="Quotation Rejected">Quotation Rejected</option>
                            <option value="Negotiation">Negotiation</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Closed-Won">Closed-Won</option>
                            <option value="Closed-Lost">Closed-Lost</option>
                          </select>
                        );
                      } else if (canSalesEdit) {
                        return (
                          <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-sm">
                            <option value="Quotation Approved">Quotation Approved</option>
                            <option value="New">New</option>
                            <option value="Interested">Interested</option>
                            <option value="Follow-up">Follow-up</option>
                            <option value="Negotiation">Negotiation</option>
                            <option value="Closed-Won">Closed-Won</option>
                            <option value="Closed-Lost">Closed-Lost</option>
                          </select>
                        );
                      } else {
                        return (
                          <div className="w-full px-3 py-2 border border-gray-100 rounded-lg bg-gray-50 text-sm text-gray-500 font-medium flex items-center justify-between">
                            <span>{formData.status}</span>
                            <span className="text-[10px] text-gray-400 bg-gray-200 px-2 py-0.5 rounded ml-2">Locked until Approval</span>
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}
              </div>

              {modalMode === 'add' && documentTypes.length > 0 && (
                <div className="border-t border-gray-100 pt-4 mt-2">
                  <h3 className="text-sm font-bold text-gray-800 mb-3">Upload Documents</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {documentTypes.map(docType => {
                      const selectedFile = leadDocuments[docType._id];
                      return (
                        <div key={docType._id} className="flex flex-row items-center gap-3">
                          <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-700 mb-1 capitalize">
                              {docType.name}
                              {docType.isRequired && <span className="text-rose-500 ml-0.5">*</span>}
                            </label>
                            <input 
                              type="file" 
                              onChange={(e) => setLeadDocuments(prev => ({ ...prev, [docType._id]: e.target.files[0] }))}
                              className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 bg-white border border-gray-200 rounded-lg p-1.5 transition-colors"
                              accept=".pdf,.jpg,.jpeg,.png"
                              required={docType.isRequired || false}
                            />
                          </div>
                          {selectedFile && (
                            <a 
                              href={URL.createObjectURL(selectedFile)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="w-16 h-16 shrink-0 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center shadow-sm mt-4 hover:border-emerald-400 transition-colors cursor-pointer"
                              title="Click to view file in new tab"
                            >
                              {selectedFile.type.startsWith('image/') ? (
                                <img 
                                  src={URL.createObjectURL(selectedFile)} 
                                  alt="Preview" 
                                  className="w-full h-full object-cover hover:scale-110 transition-transform" 
                                />
                              ) : (
                                <div className="text-[10px] text-gray-500 flex flex-col items-center gap-1 p-1 text-center hover:bg-emerald-50 w-full h-full justify-center">
                                  <FileText className="w-5 h-5 text-emerald-600" />
                                  <span className="truncate w-full font-medium" title={selectedFile.name}>{selectedFile.name}</span>
                                </div>
                              )}
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div className="pt-6 flex justify-end gap-3 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-[#0B3A2C] text-white rounded-lg text-sm font-medium shadow-sm hover:bg-[#0a2f23] transition-colors">
                  {modalMode === 'add' ? 'Save Lead' : 'Update Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* View Lead Modal (For Remarks) */}
      {isViewModalOpen && selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-none shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/80 shrink-0">
                      <div className="flex items-center gap-4">
                        <img src={`https://ui-avatars.com/api/?name=${selectedLead.customerName}&background=random`} alt="Avatar" className="w-12 h-12 rounded-full" />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{selectedLead.customerName}</h2>
                            <p className="text-sm text-gray-500">{selectedLead.companyName || 'No Company'}</p>
                        </div>
                      </div>
                      <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                          <div>
                              <p className="text-xs text-gray-500 uppercase">Phone</p>
                              <p className="font-semibold text-gray-800">{selectedLead.contactNumber}</p>
                          </div>
                          <div>
                              <p className="text-xs text-gray-500 uppercase">Status</p>
                              <p className="mt-1">{getStatusBadge(selectedLead.status)}</p>
                          </div>
                          <div>
                              <p className="text-xs text-gray-500 uppercase">Source</p>
                              <p className="font-semibold text-gray-800">{selectedLead.source}</p>
                          </div>
                          <div>
                              <p className="text-xs text-gray-500 uppercase">Created</p>
                              <p className="font-semibold text-gray-800">{new Date(selectedLead.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          </div>
                          {selectedLead.nextFollowUpDate && (
                              <div className="col-span-2 md:col-span-4 bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-center gap-2 text-amber-800 shadow-sm mt-2">
                                  <span className="text-xs uppercase font-bold tracking-wider">Next Follow-Up:</span>
                                  <span className="font-bold text-sm">
                                      {new Date(selectedLead.nextFollowUpDate).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', hour12: true })}
                                  </span>
                              </div>
                          )}
                      </div>

                      {/* Official Quotation Card (If Generated) */}
                      {selectedLead.quotation && (
                        <div className="mb-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
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
                      <div className="mb-6">
                          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2 flex items-center justify-between">
                            <span>Documents</span>
                          </h3>

                          {/* Document Grid */}
                          <div className="space-y-3 mb-2">
                              {selectedLead.documents && selectedLead.documents.length > 0 ? (
                                  selectedLead.documents.map(doc => (
                                      <div key={doc._id || doc.fileName} className="bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between gap-3">
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
                                            <a href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="View Document">
                                              <Eye className="w-4 h-4" />
                                            </a>
                                            
                                            {/* Verify/Reject Actions */}
                                            {hasVerifyDocuments && doc.status === 'Pending' && (
                                              <>
                                                <button onClick={() => handleVerifyDocument(doc._id, 'Verified')} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors" title="Approve">
                                                  <UserCheck className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => {
                                                  setRejectReason('');
                                                  setRejectModalDocId(doc._id);
                                                }} className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors" title="Reject">
                                                  <X className="w-4 h-4" />
                                                </button>
                                              </>
                                            )}
                                          </div>
                                      </div>
                                  ))
                              ) : (
                                  <p className="text-sm text-gray-500 text-center py-4">No documents uploaded.</p>
                              )}
                          </div>
                          
                          {hasUploadDocuments && selectedLead.status === 'Rejected' && (
                              <div className="mt-6 border-t border-gray-100 pt-5">
                                  <h3 className="text-sm font-bold text-gray-800 mb-3">Re-upload Rejected Documents</h3>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {selectedLead.documents.filter(doc => doc.status === 'Rejected').map(doc => {
                                          const selectedFile = leadDocuments[doc._id];
                                          return (
                                              <form key={doc._id} onSubmit={async (e) => {
                                                  e.preventDefault();
                                                  if (!selectedFile) return toast.warning("Please select a file");
                                                  setIsUploadingDoc(true);
                                                  try {
                                                      const formData = new FormData();
                                                      formData.append('documents', selectedFile);
                                                      formData.append('documentTypes', doc.documentType);
                                                      formData.append('replaceDocId', doc._id);
                                                      await apiClient.post(`/sales/leads/${selectedLead._id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                                                      toast.success(`${doc.documentType} uploaded successfully!`);
                                                      setLeadDocuments(prev => ({ ...prev, [doc._id]: null }));
                                                      const res = await apiClient.get(`/sales/leads/${selectedLead._id}`);
                                                      setSelectedLead(res.data);
                                                  } catch (error) {
                                                      toast.error(error.response?.data?.message || "Failed to upload document");
                                                  } finally {
                                                      setIsUploadingDoc(false);
                                                  }
                                              }} className="flex flex-row items-center gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100 shadow-sm">
                                                  <div className="flex-1">
                                                      <label className="block text-xs font-semibold text-gray-700 mb-1 capitalize">
                                                          {doc.documentType}
                                                          <span className="text-rose-500 font-bold ml-1">*</span>
                                                          <span className="block text-[10px] text-gray-500 font-normal mt-0.5 truncate" title={doc.remarks}>Reason: {doc.remarks}</span>
                                                      </label>
                                                      <input 
                                                          type="file" 
                                                          onChange={(e) => setLeadDocuments(prev => ({ ...prev, [doc._id]: e.target.files[0] }))}
                                                          className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 bg-white border border-gray-200 rounded-lg p-1.5 transition-colors"
                                                          accept=".pdf,.jpg,.jpeg,.png"
                                                          required
                                                      />
                                                      <button 
                                                          type="submit"
                                                          disabled={isUploadingDoc || !selectedFile}
                                                          className="mt-2 bg-[#0B3A2C] hover:bg-[#124b39] text-white px-4 py-1.5 rounded-md text-xs font-bold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                                      >
                                                          {isUploadingDoc ? 'Uploading...' : 'Upload File'}
                                                      </button>
                                                  </div>
                                                  {selectedFile && (
                                                      <div className="w-16 h-16 shrink-0 border border-gray-200 rounded-lg overflow-hidden bg-white flex items-center justify-center shadow-sm hover:border-emerald-400 transition-colors">
                                                          {selectedFile.type.startsWith('image/') ? (
                                                              <img 
                                                                  src={URL.createObjectURL(selectedFile)} 
                                                                  alt="Preview" 
                                                                  className="w-full h-full object-cover hover:scale-110 transition-transform" 
                                                              />
                                                          ) : (
                                                              <FileText className="w-6 h-6 text-emerald-600" />
                                                          )}
                                                      </div>
                                                  )}
                                              </form>
                                          );
                                      })}
                                  </div>
                              </div>
                          )}
                      </div>

                      <div className="mb-6">
                          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Follow-up Remarks</h3>
                          
                          <div className="space-y-4 max-h-60 overflow-y-auto pr-2 mb-4">
                              {selectedLead.remarks && selectedLead.remarks.length > 0 ? (
                                  selectedLead.remarks.map((rm, idx) => (
                                      <div key={idx} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                          <p className="text-sm text-gray-700">{rm.text}</p>
                                          <div className="flex justify-between items-center mt-2">
                                              <span className="text-xs text-gray-500 font-medium">{rm.addedBy?.name || 'User'}</span>
                                              <span className="text-[10px] text-gray-400">
                                                  {new Date(rm.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, {new Date(rm.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                              </span>
                                          </div>
                                      </div>
                                  ))
                              ) : (
                                  <p className="text-sm text-gray-500 text-center py-4 bg-white rounded-lg border border-dashed border-gray-200">No remarks added yet.</p>
                              )}
                          </div>

                          <form onSubmit={handleAddRemark} className="flex flex-col gap-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100 shadow-sm">
                              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                  {(() => {
                                      const isAdminOrManager = currentUser?.role?.name === 'Admin' || currentUser?.role?.name === 'Sales Manager';
                                      const postApprovalStatuses = ['Quotation Approved', 'New', 'Interested', 'Follow-up', 'Negotiation', 'Closed-Won', 'Closed-Lost'];
                                      const canSalesEdit = !isAdminOrManager && postApprovalStatuses.includes(selectedLead?.status);
                                      
                                      if (selectedLead?.status === 'Closed-Won') {
                                          return (
                                              <div className="w-full sm:w-1/3 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-between">
                                                  <span>Closed-Won</span>
                                                  <span className="text-[10px] text-gray-400">Locked</span>
                                              </div>
                                          );
                                      }

                                      if (isAdminOrManager) {
                                          return (
                                              <select value={remarkStatus} onChange={(e) => setRemarkStatus(e.target.value)} className="w-full sm:w-1/3 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white">
                                                <option value="Pending">Pending</option>
                                                <option value="New">New</option>
                                                <option value="Contacted">Contacted</option>
                                                <option value="Interested">Interested</option>
                                                <option value="Follow-up">Follow-up</option>
                                                <option value="Quotation Pending">Quotation Pending</option>
                                                <option value="Quotation Sent">Quotation Sent</option>
                                                <option value="Quotation Approved">Quotation Approved</option>
                                                <option value="Quotation Rejected">Quotation Rejected</option>
                                                <option value="Negotiation">Negotiation</option>
                                                <option value="Approved">Approved</option>
                                                <option value="Rejected">Rejected</option>
                                                <option value="Closed-Won">Closed-Won</option>
                                                <option value="Closed-Lost">Closed-Lost</option>
                                              </select>
                                          );
                                      } else if (canSalesEdit) {
                                          return (
                                              <select value={remarkStatus} onChange={(e) => setRemarkStatus(e.target.value)} className="w-full sm:w-1/3 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white">
                                                <option value="Quotation Approved">Quotation Approved</option>
                                                <option value="New">New</option>
                                                <option value="Interested">Interested</option>
                                                <option value="Follow-up">Follow-up</option>
                                                <option value="Negotiation">Negotiation</option>
                                                <option value="Closed-Won">Closed-Won</option>
                                                <option value="Closed-Lost">Closed-Lost</option>
                                              </select>
                                          );
                                      }
                                      return (
                                          <div className="w-full sm:w-1/3 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-between">
                                              <span>{selectedLead?.status}</span>
                                          </div>
                                      );
                                  })()}
                                  <input 
                                      type="text" 
                                      value={remarkText} 
                                      onChange={(e) => setRemarkText(e.target.value)}
                                      placeholder="Type a new follow-up remark..."
                                      className="flex-1 w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                      required
                                  />
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2 sm:mt-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                      <label className="text-xs text-gray-600 font-semibold whitespace-nowrap">Schedule Next Call:</label>
                                      <input 
                                          type="datetime-local" 
                                          value={nextFollowUpDate}
                                          onChange={(e) => setNextFollowUpDate(e.target.value)}
                                          className="w-full sm:w-auto px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                                      />
                                  </div>
                                  <button type="submit" className="w-full sm:w-auto bg-[#0B3A2C] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-[#0a2f23] transition-colors whitespace-nowrap">
                                      Save Remark
                                  </button>
                              </div>
                          </form>
                      </div>
                  </div>
              </div>
          </div>
      )}
      {/* Document Rejection Modal */}
      {rejectModalDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUp">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800">Reject Document</h2>
              <button onClick={() => setRejectModalDocId(null)} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for rejection *</label>
                <textarea
                  autoFocus
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm outline-none resize-none"
                  rows="3"
                  placeholder="E.g. Document is blurry, incorrect name, etc."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-100 bg-gray-50/50">
              <button onClick={() => setRejectModalDocId(null)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                Cancel
              </button>
              <button 
                onClick={() => {
                  if(!rejectReason.trim()) {
                    toast.error("Please enter a reason");
                    return;
                  }
                  handleVerifyDocument(rejectModalDocId, 'Rejected', rejectReason);
                  setRejectModalDocId(null);
                }} 
                className="px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm shadow-rose-200"
              >
                Reject Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
