import React, { useState, useEffect } from 'react';
import { Trophy, Phone, User, Clock, Loader2, Eye, X, Mail, Building2, MapPin, FileText, CheckCircle2, Trash2, Search, Briefcase } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../api/axiosConfig';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { getFileUrl } from '../utils/fileUrl';

const ClosedWonLeads = () => {
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [selectedLead, setSelectedLead] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const fetchLeads = async () => {
        try {
            setIsLoading(true);
            const res = await apiClient.get('/sales/leads/closed-won/all');
            setLeads(res.data.leads || []);
        } catch (err) {
            console.error('Error fetching closed won leads:', err);
            toast.error(err.response?.data?.message || 'Failed to fetch closed won leads');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const handleViewLead = (lead) => {
        setSelectedLead(lead);
        setIsViewModalOpen(true);
    };

    const handleDeleteLead = async (leadId, customerName) => {
        const result = await Swal.fire({
            title: 'Delete Lead?',
            text: `Are you sure you want to delete "${customerName}"? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete lead',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                await apiClient.delete(`/sales/leads/${leadId}`);
                toast.success('Lead deleted successfully');
                fetchLeads();
                if (isViewModalOpen && selectedLead?._id === leadId) {
                    setIsViewModalOpen(false);
                }
            } catch (error) {
                console.error('Error deleting lead:', error);
                toast.error(error.response?.data?.message || 'Failed to delete lead');
            }
        }
    };

    const filteredLeads = leads.filter(lead => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
            (lead.customerName && lead.customerName.toLowerCase().includes(q)) ||
            (lead.companyName && lead.companyName.toLowerCase().includes(q)) ||
            (lead.contactNumber && lead.contactNumber.toLowerCase().includes(q)) ||
            (lead.email && lead.email.toLowerCase().includes(q)) ||
            (lead.source && lead.source.toLowerCase().includes(q)) ||
            (lead.createdBy?.name && lead.createdBy.name.toLowerCase().includes(q)) ||
            (lead.assignedTo?.name && lead.assignedTo.name.toLowerCase().includes(q))
        );
    });

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        Closed Won Leads (Projects)
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        All successfully converted deals ready for operations.
                    </p>
                </div>
            </div>

            {/* Search Filter */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search by customer, company, phone, source..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-9 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 text-sm"
                    />
                    {searchTerm && (
                        <button 
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold"
                        >
                            ✕
                        </button>
                    )}
                </div>
                <div className="text-xs text-gray-500 font-medium">
                    Showing <span className="font-bold text-gray-900">{filteredLeads.length}</span> of {leads.length} Converted Leads
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-16 flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 text-[#0B3A2C] animate-spin mb-3" />
                        <p className="text-gray-500 text-sm font-medium">Loading closed won deals...</p>
                    </div>
                ) : leads.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <Trophy className="w-8 h-8" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">No Closed Won Leads</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
                            You don't have any converted leads yet.
                        </p>
                    </div>
                ) : filteredLeads.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <Search className="w-8 h-8" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">No Matches Found</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
                            No converted leads found matching "{searchTerm}".
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-400 uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="py-3.5 px-4">Customer</th>
                                    <th className="py-3.5 px-4">Contact</th>
                                    <th className="py-3.5 px-4">Source</th>
                                    <th className="py-3.5 px-4">Owner / Assigned</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {filteredLeads.map(lead => (
                                    <tr key={lead._id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-gray-900">{lead.customerName}</div>
                                            {lead.companyName && (
                                                <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">{lead.companyName}</div>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <Phone className="w-3.5 h-3.5" /> {lead.contactNumber}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-gray-600 font-medium">
                                            {lead.source || 'N/A'}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5 text-gray-800 font-medium">
                                                    <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                    <span>{lead.assignedTo?.name || lead.createdBy?.name || 'Unknown'}</span>
                                                </div>
                                                {lead.assignedTo && lead.createdBy && lead.assignedTo._id !== lead.createdBy._id && (
                                                    <span className="text-[10px] text-gray-400 pl-5">
                                                        By: {lead.createdBy.name}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-yellow-50 text-yellow-700 border border-yellow-200">
                                                Converted
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => navigate('/dashboard/projects')}
                                                    className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 inline-flex items-center gap-1 text-xs font-semibold"
                                                    title="View Project Tasks & Operations"
                                                >
                                                    <Briefcase className="w-3.5 h-3.5" /> Project
                                                </button>
                                                <button
                                                    onClick={() => handleViewLead(lead)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 inline-flex items-center gap-1.5 text-xs font-semibold"
                                                    title="View Full Details"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> View
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteLead(lead._id, lead.customerName)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 inline-flex items-center gap-1.5 text-xs font-semibold"
                                                    title="Delete Lead"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* View Lead Details Modal */}
            {isViewModalOpen && selectedLead && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Project / Lead Details</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Review complete customer information & documents.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => navigate('/dashboard/projects')}
                                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-700 hover:text-white rounded-lg text-xs font-bold transition-colors border border-emerald-200 inline-flex items-center gap-1"
                                    title="Open Project Operations & Tasks"
                                >
                                    <Briefcase className="w-3.5 h-3.5" />
                                    Project Tasks
                                </button>
                                <button
                                    onClick={() => handleDeleteLead(selectedLead._id, selectedLead.customerName)}
                                    className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-xs font-bold transition-colors border border-red-200 inline-flex items-center gap-1"
                                    title="Delete Lead"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete Lead
                                </button>
                                <button 
                                    onClick={() => setIsViewModalOpen(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto space-y-8">
                            
                            {/* Customer Info Section */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                                    <User className="w-4 h-4 text-[#0B3A2C]" /> Customer Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Customer Name</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedLead.customerName}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Company Name</p>
                                        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                            {selectedLead.companyName || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Contact Number</p>
                                        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                                            {selectedLead.contactNumber}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Email Address</p>
                                        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                                            {selectedLead.email || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Documents Section */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-[#0B3A2C]" /> Uploaded Documents
                                </h4>
                                {selectedLead.documents && selectedLead.documents.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {selectedLead.documents.map((doc, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-3 hover:border-emerald-200 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-900">{doc.documentType || 'Document'}</p>
                                                        <p className="text-[10px] text-gray-500 truncate w-32">{doc.fileName}</p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={getFileUrl(doc.fileUrl)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-1.5 bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 text-xs font-semibold rounded-lg transition-colors border border-gray-200"
                                                >
                                                    View
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-xl text-center border border-dashed border-gray-200">
                                        No documents uploaded for this lead.
                                    </p>
                                )}
                            </div>

                            {/* Remarks Section */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-[#0B3A2C]" /> Follow-up History & Remarks
                                </h4>
                                {selectedLead.remarks && selectedLead.remarks.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedLead.remarks.map((remark, idx) => (
                                            <div key={idx} className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex gap-3">
                                                <div className="mt-1">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-800">{remark.text}</p>
                                                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500">
                                                        <span className="font-semibold text-gray-700">{remark.addedBy?.name || 'User'}</span>
                                                        <span>•</span>
                                                        <span>{new Date(remark.date || remark.createdAt).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-xl text-center border border-dashed border-gray-200">
                                        No remarks or follow-up history available.
                                    </p>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClosedWonLeads;
