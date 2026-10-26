import React, { useState, useEffect } from 'react';
import { 
    Cpu, 
    Search, 
    Plus, 
    Trash2, 
    Save, 
    Loader2, 
    CheckCircle2, 
    AlertCircle, 
    FileText, 
    User, 
    Phone, 
    Layers, 
    ExternalLink, 
    X,
    Filter,
    ShieldCheck,
    Check,
    Boxes,
    Printer,
    Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../api/axiosConfig';

const Hardware = () => {
    const [projects, setProjects] = useState([]);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [equipments, setEquipments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTab, setFilterTab] = useState('all'); // 'all' | 'configured' | 'pending'

    // User permissions check
    const [userProfile, setUserProfile] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}');
        } catch {
            return {};
        }
    });

    const isAdmin = 
        userProfile?.role?.name === 'Admin' || 
        userProfile?.role?.name === 'Super Admin' ||
        userProfile?.name === 'Super Admin' ||
        userProfile?.email === 'digitalgurucse@gmail.com' ||
        userProfile?.email === 'admin@digicoders.com';

    const userPermissions = userProfile?.role?.permissions || [];
    const canManageHardware = isAdmin || userPermissions.includes('manage_hardware') || userPermissions.includes('manage_project_workflow');

    const fetchUserProfile = async () => {
        try {
            const res = await apiClient.get('/auth/profile');
            if (res.data?.user) {
                setUserProfile(res.data.user);
                localStorage.setItem('user', JSON.stringify(res.data.user));
            }
        } catch (err) {
            console.error('Error fetching profile in Hardware:', err);
        }
    };

    useEffect(() => {
        fetchUserProfile();
        fetchProjects();
        fetchProducts();
    }, []);

    const fetchProjects = async () => {
        try {
            setIsLoading(true);
            const res = await apiClient.get('/operations/projects');
            const data = res.data || [];
            setProjects(data);
        } catch (err) {
            console.error('Error fetching projects:', err);
            toast.error(err.response?.data?.message || 'Failed to load projects');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await apiClient.get('/master/products');
            setProducts(res.data || []);
        } catch (err) {
            // Optional catalog suggestions
            console.warn('Could not fetch master products for suggestions:', err);
        }
    };

    // When a customer/project is selected, populate equipments
    const handleSelectProject = (projectId) => {
        setSelectedProjectId(projectId);
        const proj = projects.find(p => p._id === projectId);
        if (proj) {
            if (proj.installedEquipments && proj.installedEquipments.length > 0) {
                setEquipments(proj.installedEquipments.map(item => ({
                    itemName: item.itemName || '',
                    serialNumber: item.serialNumber || '',
                    quantity: item.quantity || 1
                })));
            } else {
                // Auto-import items from quotation if available
                const qItems = (proj.quotationData?.items || proj.quotation?.items || [])
                    .filter(it => it.itemType === 'Product' || !it.itemType);
                if (qItems.length > 0) {
                    setEquipments(qItems.map(it => ({
                        itemName: it.name || '',
                        serialNumber: '',
                        quantity: it.quantity || 1
                    })));
                } else {
                    setEquipments([{ itemName: '', serialNumber: '', quantity: 1 }]);
                }
            }
        } else {
            setEquipments([]);
        }
    };

    const handleImportFromQuotation = () => {
        const proj = projects.find(p => p._id === selectedProjectId);
        if (!proj) return;
        const qItems = (proj.quotationData?.items || proj.quotation?.items || [])
            .filter(it => it.itemType === 'Product' || !it.itemType);
        
        if (qItems.length === 0) {
            toast.info("No quotation products found for this project.");
            return;
        }

        // Merge or replace preserving existing serial numbers
        setEquipments(qItems.map(it => {
            const existing = equipments.find(e => e.itemName?.toLowerCase() === it.name?.toLowerCase());
            return {
                itemName: it.name || '',
                serialNumber: existing?.serialNumber || '',
                quantity: it.quantity || 1
            };
        }));
        toast.success(`Loaded ${qItems.length} product(s) from Quotation! Please enter serial numbers.`);
    };

    const handleAddRow = () => {
        setEquipments(prev => [...prev, { itemName: '', serialNumber: '', quantity: 1 }]);
    };

    const handleRemoveRow = (index) => {
        if (equipments.length === 1 && !equipments[0].itemName && !equipments[0].serialNumber) {
            return;
        }
        setEquipments(prev => prev.filter((_, i) => i !== index));
    };

    const handleEquipmentChange = (index, field, value) => {
        setEquipments(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleSaveEquipments = async (e) => {
        e.preventDefault();
        if (!selectedProjectId) {
            toast.warning('Please select a customer project first');
            return;
        }

        if (!canManageHardware) {
            toast.error('You do not have permission to manage hardware details');
            return;
        }

        // Validate items: filter out completely blank rows, validate rows with partial data
        const cleanEquipments = equipments.filter(eq => eq.itemName.trim() !== '' || eq.serialNumber.trim() !== '');
        
        for (const item of cleanEquipments) {
            if (!item.itemName.trim()) {
                toast.warning('Please enter an item name for all hardware rows');
                return;
            }
            if (!item.serialNumber.trim()) {
                toast.warning(`Please enter serial number for "${item.itemName}"`);
                return;
            }
            if (!item.quantity || Number(item.quantity) < 1) {
                toast.warning(`Please enter a valid quantity for "${item.itemName}"`);
                return;
            }
        }

        try {
            setIsSaving(true);
            const res = await apiClient.put(`/operations/projects/${selectedProjectId}/equipment`, { 
                equipments: cleanEquipments 
            });
            
            toast.success(res.data?.message || 'Hardware details saved successfully!');
            
            // Update local state for the modified project
            setProjects(prev => prev.map(p => {
                if (p._id === selectedProjectId) {
                    return { ...p, installedEquipments: cleanEquipments };
                }
                return p;
            }));

            // Sync equipments state
            setEquipments(cleanEquipments.length > 0 ? cleanEquipments : [{ itemName: '', serialNumber: '', quantity: 1 }]);
        } catch (err) {
            console.error('Error saving equipments:', err);
            toast.error(err.response?.data?.message || 'Failed to save hardware details');
        } finally {
            setIsSaving(false);
        }
    };

    const selectedProject = projects.find(p => p._id === selectedProjectId);

    // Filtering logic
    const filteredProjects = projects.filter(project => {
        const customerName = project.customerName || project.lead?.customerName || '';
        const phone = project.lead?.contactNumber || '';
        const query = searchQuery.toLowerCase();

        const matchesSearch = 
            customerName.toLowerCase().includes(query) ||
            phone.includes(query) ||
            (project.installedEquipments && project.installedEquipments.some(eq => 
                eq.itemName?.toLowerCase().includes(query) || 
                eq.serialNumber?.toLowerCase().includes(query)
            ));

        if (!matchesSearch) return false;

        const hasHardware = project.installedEquipments && project.installedEquipments.length > 0;
        if (filterTab === 'configured') return hasHardware;
        if (filterTab === 'pending') return !hasHardware;
        return true;
    });

    const totalConfigured = projects.filter(p => p.installedEquipments && p.installedEquipments.length > 0).length;
    const totalPending = projects.length - totalConfigured;

    return (
        <div className="space-y-6 relative pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Cpu className="w-6 h-6 text-[#0B3A2C] shrink-0" />
                        Hardware Management
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Select a customer project to manage installed hardware, serial numbers, and equipment tracking.
                    </p>
                </div>

                {/* Quick stats pills */}
                <div className="flex items-center gap-2 self-stretch sm:self-auto">
                    <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Configured: {totalConfigured}</span>
                    </div>
                    <div className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span>Pending: {totalPending}</span>
                    </div>
                </div>
            </div>

            {/* Datalist for item name suggestions */}
            <datalist id="hardware-products-list">
                {products.map(p => (
                    <option key={p._id} value={p.name} />
                ))}
                <option value="Solar Panels (540W Mono PERC)" />
                <option value="Solar Inverter 5kW" />
                <option value="Solar Inverter 3kW" />
                <option value="Solar Battery 150Ah" />
                <option value="Solar Battery 200Ah" />
                <option value="Net Meter Bidirectional" />
                <option value="ACDB / DCDB Box" />
                <option value="Lightning Arrester" />
                <option value="Earthing Rod & Chemical" />
            </datalist>

            {/* Main Customer Selector Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <User className="w-4 h-4 text-[#0B3A2C]" />
                            Select Customer / Project
                        </label>
                        <select
                            id="customer-hardware-select"
                            value={selectedProjectId}
                            onChange={(e) => handleSelectProject(e.target.value)}
                            className="w-full bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 focus:border-[#0B3A2C] focus:ring-2 focus:ring-[#0B3A2C]/20 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 transition-all outline-none cursor-pointer"
                        >
                            <option value="">-- Choose a Customer to Manage Hardware --</option>
                            {projects.map(p => {
                                const cName = p.customerName || p.lead?.customerName || 'Unnamed Customer';
                                const phone = p.lead?.contactNumber ? ` (${p.lead.contactNumber})` : '';
                                const eqCount = p.installedEquipments?.length || 0;
                                const statusTag = eqCount > 0 ? `[${eqCount} Hardware Items]` : '[No Hardware]';
                                return (
                                    <option key={p._id} value={p._id}>
                                        {cName}{phone} — {p.workflowStage || 'Pending Registration'} {statusTag}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl self-start lg:self-end">
                        <button
                            type="button"
                            onClick={() => setFilterTab('all')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                filterTab === 'all' 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            All ({projects.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterTab('configured')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                filterTab === 'configured' 
                                    ? 'bg-white text-emerald-800 shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Configured ({totalConfigured})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterTab('pending')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                filterTab === 'pending' 
                                    ? 'bg-white text-amber-800 shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Pending ({totalPending})
                        </button>
                    </div>
                </div>
            </div>

            {/* Selected Project Hardware Management Section */}
            {selectedProject ? (
                <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden transition-all animate-fadeIn">
                    {/* Customer Summary Bar */}
                    <div className="bg-gradient-to-r from-[#0B3A2C] to-[#124b39] text-white p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shrink-0 font-bold text-lg">
                                {(selectedProject.customerName || selectedProject.lead?.customerName || 'C')[0].toUpperCase()}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-lg font-bold">
                                        {selectedProject.customerName || selectedProject.lead?.customerName || 'Customer'}
                                    </h2>
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white">
                                        {selectedProject.workflowStage || 'Pending Registration'}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                                        Status: {selectedProject.status || 'In Progress'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-white/80 mt-1 flex-wrap">
                                    {selectedProject.lead?.contactNumber && (
                                        <span className="flex items-center gap-1">
                                            <Phone className="w-3.5 h-3.5 text-emerald-300" />
                                            {selectedProject.lead.contactNumber}
                                        </span>
                                    )}
                                    {selectedProject.operationHead?.name && (
                                        <span className="flex items-center gap-1">
                                            <User className="w-3.5 h-3.5 text-emerald-300" />
                                            Ops Head: {selectedProject.operationHead.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Top Action buttons */}
                        <div className="flex items-center gap-2 self-start md:self-auto">
                            {selectedProject.status === 'Completed' ? (
                                <Link
                                    to={`/receipt/${selectedProject._id}`}
                                    target="_blank"
                                    className="px-3.5 py-2 bg-white text-[#0B3A2C] hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-sm"
                                    title="Generate & Print Installation Receipt"
                                >
                                    <Printer className="w-3.5 h-3.5 text-[#0B3A2C]" />
                                    <span>Generate Receipt</span>
                                    <ExternalLink className="w-3 h-3 opacity-60" />
                                </Link>
                            ) : (
                                <div 
                                    className="px-3 py-1.5 bg-white/10 text-white/90 border border-white/20 rounded-xl text-[11px] font-semibold flex items-center gap-1.5"
                                    title="Receipt is only generated once the project is marked as Completed"
                                >
                                    <Lock className="w-3.5 h-3.5 text-amber-300" />
                                    <span>Receipt Locked ({selectedProject.status})</span>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => setSelectedProjectId('')}
                                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                                title="Close Editor"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Hardware Form */}
                    <div className="p-4 sm:p-6 space-y-6">
                        {!canManageHardware && (
                            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>You have read-only access. You need the <strong>Manage Hardware</strong> permission to add or update hardware details.</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveEquipments} className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                                    <Boxes className="w-4 h-4 text-[#0B3A2C]" />
                                    Installed Equipment & Serial Numbers
                                </h3>
                                
                                <div className="flex items-center gap-3">
                                    {/* Helper to import products from linked quotation */}
                                    {((selectedProject.quotationData?.items || selectedProject.quotation?.items || []).some(it => it.itemType === 'Product' || !it.itemType)) && canManageHardware && (
                                        <button
                                            type="button"
                                            onClick={handleImportFromQuotation}
                                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                                            title="Auto-fill product names and quantities from quotation"
                                        >
                                            <FileText className="w-3.5 h-3.5 text-amber-600" />
                                            <span>Import from Quotation</span>
                                        </button>
                                    )}
                                    <span className="text-xs text-gray-500 font-medium">
                                        {equipments.filter(e => e.itemName.trim() !== '').length} item(s) listed
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {equipments.map((eq, idx) => (
                                    <div 
                                        key={idx} 
                                        className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end bg-gray-50 hover:bg-emerald-50/20 p-3.5 rounded-xl border border-gray-200 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                                                Equipment / Item Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                list="hardware-products-list"
                                                required
                                                disabled={!canManageHardware}
                                                value={eq.itemName}
                                                onChange={(e) => handleEquipmentChange(idx, 'itemName', e.target.value)}
                                                placeholder="e.g. Solar Inverter 5kW / Battery 150Ah"
                                                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#0B3A2C] focus:ring-1 focus:ring-[#0B3A2C] disabled:bg-gray-100 disabled:text-gray-500"
                                            />
                                        </div>

                                        <div className="flex-1">
                                            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                                                Serial Number / Unique ID <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                disabled={!canManageHardware}
                                                value={eq.serialNumber}
                                                onChange={(e) => handleEquipmentChange(idx, 'serialNumber', e.target.value)}
                                                placeholder="e.g. SN-89472384"
                                                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-mono text-gray-900 focus:outline-none focus:border-[#0B3A2C] focus:ring-1 focus:ring-[#0B3A2C] disabled:bg-gray-100 disabled:text-gray-500"
                                            />
                                        </div>

                                        <div className="w-full sm:w-28">
                                            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                                                Quantity <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                required
                                                disabled={!canManageHardware}
                                                value={eq.quantity}
                                                onChange={(e) => handleEquipmentChange(idx, 'quantity', e.target.value)}
                                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:border-[#0B3A2C] focus:ring-1 focus:ring-[#0B3A2C] disabled:bg-gray-100 disabled:text-gray-500 text-center"
                                            />
                                        </div>

                                        {canManageHardware && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveRow(idx)}
                                                disabled={equipments.length === 1 && !eq.itemName && !eq.serialNumber}
                                                className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors shrink-0 disabled:opacity-30 disabled:hover:bg-transparent"
                                                title="Remove Item"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Form footer buttons */}
                            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 border-t border-gray-100">
                                {canManageHardware ? (
                                    <button
                                        type="button"
                                        onClick={handleAddRow}
                                        className="px-4 py-2.5 text-xs font-bold text-[#0B3A2C] bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Another Equipment
                                    </button>
                                ) : <div />}

                                <div className="flex items-center gap-2.5 justify-end flex-wrap">
                                    {selectedProject.status === 'Completed' ? (
                                        <Link
                                            to={`/receipt/${selectedProject._id}`}
                                            target="_blank"
                                            className="px-4 py-2.5 text-xs font-bold text-[#0B3A2C] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                            title="Generate and view Installation Receipt with current hardware"
                                        >
                                            <Printer className="w-4 h-4" />
                                            <span>Generate Receipt</span>
                                            <ExternalLink className="w-3 h-3 opacity-60" />
                                        </Link>
                                    ) : (
                                        <div 
                                            className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-100 rounded-xl flex items-center gap-1.5"
                                            title="Complete the project to unlock receipt generation"
                                        >
                                            <Lock className="w-3.5 h-3.5 text-gray-400" />
                                            <span>Receipt unlocks when Completed</span>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => handleSelectProject(selectedProjectId)}
                                        className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        Reset
                                    </button>
                                    
                                    {canManageHardware && (
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="px-6 py-2.5 text-xs font-bold bg-[#0B3A2C] hover:bg-[#124b39] text-white rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>Saving...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4" />
                                                    <span>Save Hardware Details</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200 space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-[#0B3A2C] flex items-center justify-center">
                        <Cpu className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-gray-800">No Customer Selected</h3>
                    <p className="text-xs text-gray-500 max-w-md mx-auto">
                        Please choose a customer from the dropdown above or select one from the directory below to view and update their installed hardware and serial numbers.
                    </p>
                </div>
            )}

            {/* Customers & Projects Directory */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden space-y-4 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-base font-bold text-gray-900">All Customer Projects</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Click "Manage Hardware" on any customer to edit equipment</p>
                    </div>

                    {/* Search filter input */}
                    <div className="relative w-full sm:w-72">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by customer, phone, serial..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#0B3A2C] focus:bg-white transition-all"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin text-[#0B3A2C]" />
                        <span className="text-xs font-semibold">Loading projects...</span>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-xs">
                        No projects found matching your search or filter.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="py-3 px-4">Customer</th>
                                    <th className="py-3 px-4">Stage / Status</th>
                                    <th className="py-3 px-4">Installed Hardware</th>
                                    <th className="py-3 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-xs">
                                {filteredProjects.map(project => {
                                    const cName = project.customerName || project.lead?.customerName || 'Customer';
                                    const phone = project.lead?.contactNumber || '—';
                                    const eqList = project.installedEquipments || [];
                                    const isSelected = project._id === selectedProjectId;

                                    return (
                                        <tr 
                                            key={project._id}
                                            className={`hover:bg-gray-50/80 transition-colors ${
                                                isSelected ? 'bg-emerald-50/40 border-l-4 border-l-[#0B3A2C]' : ''
                                            }`}
                                        >
                                            <td className="py-3.5 px-4 font-semibold text-gray-900">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-lg bg-gray-100 text-[#0B3A2C] font-bold flex items-center justify-center text-xs shrink-0">
                                                        {cName[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">{cName}</div>
                                                        <div className="text-[11px] text-gray-500">{phone}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 font-semibold rounded text-[10px]">
                                                        {project.workflowStage || 'Pending Registration'}
                                                    </span>
                                                    <span className={`text-[10px] font-bold ${
                                                        project.status === 'Completed' ? 'text-emerald-600' : 'text-blue-600'
                                                    }`}>
                                                        {project.status || 'In Progress'}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                {eqList.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1.5 max-w-md">
                                                        {eqList.map((eq, i) => (
                                                            <span 
                                                                key={i} 
                                                                className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded text-[10px] font-medium flex items-center gap-1"
                                                            >
                                                                <span className="font-bold">{eq.itemName}</span>
                                                                <span className="text-emerald-600 font-mono text-[9px]">({eq.serialNumber})</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                                                        No hardware logged
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {project.status === 'Completed' ? (
                                                        <Link
                                                            to={`/receipt/${project._id}`}
                                                            target="_blank"
                                                            className="px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white inline-flex items-center gap-1"
                                                            title="Generate & Print Installation Receipt"
                                                        >
                                                            <Printer className="w-3.5 h-3.5" />
                                                            <span className="hidden sm:inline">Receipt</span>
                                                        </Link>
                                                    ) : (
                                                        <span 
                                                            className="px-2 py-1 text-[10px] font-medium text-gray-400 bg-gray-50 rounded border border-gray-200/60 inline-flex items-center gap-1 cursor-default"
                                                            title="Receipt unlocks when project status is Completed"
                                                        >
                                                            <Lock className="w-3 h-3 text-gray-400" />
                                                            <span className="hidden sm:inline">Locked</span>
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            handleSelectProject(project._id);
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                                            isSelected
                                                                ? 'bg-[#0B3A2C] text-white shadow-sm'
                                                                : 'bg-[#0B3A2C]/10 text-[#0B3A2C] hover:bg-[#0B3A2C] hover:text-white'
                                                        }`}
                                                    >
                                                        {isSelected ? 'Managing...' : 'Manage'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Hardware;
