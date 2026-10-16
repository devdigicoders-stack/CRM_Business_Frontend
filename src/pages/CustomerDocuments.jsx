import React, { useState, useEffect } from 'react';
import { FileText, Upload, Trash2, Download, Loader2, X, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../api/axiosConfig';

const CustomerDocuments = () => {
    const [documents, setDocuments] = useState([]);
    const [leads, setLeads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [userProfile, setUserProfile] = useState(null);
    
    // Upload state
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadForm, setUploadForm] = useState({ leadId: '', documentName: '', file: null });

    const fetchProfile = async () => {
        try {
            const res = await apiClient.get('/auth/profile');
            setUserProfile(res.data.user);
        } catch (e) {
            console.error('Error fetching profile', e);
        }
    };

    const fetchDocuments = async () => {
        try {
            setIsLoading(true);
            const res = await apiClient.get('/documents');
            setDocuments(res.data || []);
        } catch (err) {
            console.error('Error fetching docs', err);
            toast.error('Failed to fetch documents');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchLeads = async () => {
        try {
            const res = await apiClient.get('/sales/leads/closed-won/all');
            setLeads(res.data.leads || []);
        } catch (err) {
            console.error('Error fetching leads', err);
        }
    };

    useEffect(() => {
        fetchProfile();
        fetchDocuments();
        fetchLeads();
    }, []);

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!uploadForm.file) return toast.error("Please select a file");
        
        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('leadId', uploadForm.leadId);
            formData.append('documentName', uploadForm.documentName);
            formData.append('file', uploadForm.file);

            await apiClient.post('/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            toast.success("Document uploaded successfully");
            setIsUploadModalOpen(false);
            setUploadForm({ leadId: '', documentName: '', file: null });
            fetchDocuments();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this document?")) return;
        try {
            await apiClient.delete(`/documents/${id}`);
            toast.success("Document deleted");
            fetchDocuments();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Delete failed');
        }
    };

    const isCustomer = userProfile?.role?.name === 'Customer';

    const filteredDocs = documents.filter(doc => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
            (doc.documentName && doc.documentName.toLowerCase().includes(q)) ||
            (doc.lead?.customerName && doc.lead.customerName.toLowerCase().includes(q)) ||
            (doc.uploadedBy?.name && doc.uploadedBy.name.toLowerCase().includes(q))
        );
    });

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-[#0B3A2C] shrink-0" />
                        Documents
                    </h1>
                    <p className="text-[11px] sm:text-sm text-gray-500 mt-1">
                        {isCustomer ? 'View and download your important project documents.' : 'Manage and upload documents for customers.'}
                    </p>
                </div>
                {!isCustomer && (
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="bg-[#0B3A2C] hover:bg-[#124b39] text-white px-3 sm:px-4 py-2 rounded-xl transition-all shadow-sm font-semibold text-sm inline-flex items-center gap-1.5 shrink-0"
                    >
                        <Upload className="w-4 h-4 shrink-0" />
                        <span className="hidden sm:inline">Upload Document</span>
                        <span className="sm:hidden">Upload</span>
                    </button>
                )}
            </div>

            {/* Search Filter */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search documents by name, customer, uploader..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-9 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
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
                    Showing <span className="font-bold text-gray-900">{filteredDocs.length}</span> of {documents.length} Documents
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-16 flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 text-[#0B3A2C] animate-spin mb-3" />
                        <p className="text-gray-500 text-sm font-medium">Loading documents...</p>
                    </div>
                ) : documents.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <FileText className="w-8 h-8" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">No Documents Found</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
                            {isCustomer ? "You don't have any uploaded documents yet." : "Upload documents for closed-won leads to show them here."}
                        </p>
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <Search className="w-8 h-8" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">No Matching Documents</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
                            No documents match your search "{searchTerm}".
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-semibold">
                                <tr>
                                    <th className="py-3 px-4">Document Name</th>
                                    {!isCustomer && <th className="py-3 px-4">Customer</th>}
                                    <th className="py-3 px-4">Date Uploaded</th>
                                    <th className="py-3 px-4">Uploaded By</th>
                                    <th className="py-3 px-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredDocs.map(doc => (
                                    <tr key={doc._id} className="hover:bg-gray-50">
                                        <td className="py-3 px-4 font-semibold text-gray-900">{doc.documentName}</td>
                                        {!isCustomer && <td className="py-3 px-4 text-gray-600">{doc.lead?.customerName || 'Unknown'}</td>}
                                        <td className="py-3 px-4 text-gray-500">{new Date(doc.createdAt).toLocaleDateString('en-IN')}</td>
                                        <td className="py-3 px-4 text-gray-500">{doc.uploadedBy?.name || 'System'}</td>
                                        <td className="py-3 px-4 text-center flex items-center justify-center gap-2">
                                            <a 
                                                href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${doc.fileUrl}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                title="View / Download"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                            {!isCustomer && (
                                                <button 
                                                    onClick={() => handleDelete(doc._id)}
                                                    className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                            <h3 className="text-lg font-bold text-gray-900">Upload Document</h3>
                            <button onClick={() => setIsUploadModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleUploadSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Select Customer *</label>
                                    <select 
                                        required
                                        value={uploadForm.leadId}
                                        onChange={(e) => setUploadForm({...uploadForm, leadId: e.target.value})}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0B3A2C]"
                                    >
                                        <option value="">-- Select Customer --</option>
                                        {leads.map(lead => (
                                            <option key={lead._id} value={lead._id}>{lead.customerName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Document Name *</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={uploadForm.documentName}
                                        onChange={(e) => setUploadForm({...uploadForm, documentName: e.target.value})}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0B3A2C]"
                                        placeholder="e.g. Site NOC, Registration Paper"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">File *</label>
                                    <input 
                                        type="file" 
                                        required
                                        onChange={(e) => setUploadForm({...uploadForm, file: e.target.files[0]})}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                    />
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
                                    <button type="submit" disabled={isUploading} className="px-4 py-2 text-sm font-semibold text-white bg-[#0B3A2C] hover:bg-[#124b39] rounded-lg flex items-center gap-2">
                                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerDocuments;
