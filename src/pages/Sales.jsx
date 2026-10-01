import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Search, Filter, FileText, CheckCircle2, 
  XCircle, Clock, Eye, Printer, Send, MessageSquare, 
  Trash2, ChevronDown, Check, X, Building2, User, Phone, 
  DollarSign, Percent, AlertCircle, RefreshCw, Loader2, Sparkles,
  ExternalLink, Mail, MapPin, Globe, Shield, ZoomIn, ZoomOut, Download, Edit3, Copy
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../api/axiosConfig';

// Helper to convert number to Indian Rupees in words
const convertNumberToWords = (amount) => {
  const num = Math.floor(amount || 0);
  if (num === 0) return "Rupees Zero Only";

  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if ((n = n.toString()).length > 9) return 'Amount too large';
    const nArray = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!nArray) return '';
    let str = '';
    str += (nArray[1] != 0) ? (a[Number(nArray[1])] || b[nArray[1][0]] + ' ' + a[nArray[1][1]]) + 'Crore ' : '';
    str += (nArray[2] != 0) ? (a[Number(nArray[2])] || b[nArray[2][0]] + ' ' + a[nArray[2][1]]) + 'Lakh ' : '';
    str += (nArray[3] != 0) ? (a[Number(nArray[3])] || b[nArray[3][0]] + ' ' + a[nArray[3][1]]) + 'Thousand ' : '';
    str += (nArray[4] != 0) ? (a[Number(nArray[4])] || b[nArray[4][0]] + ' ' + a[nArray[4][1]]) + 'Hundred ' : '';
    str += (nArray[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(nArray[5])] || b[nArray[5][0]] + ' ' + a[nArray[5][1]]) : '';
    return str.trim();
  };

  const words = inWords(num);
  return `Rupees ${words} Only`;
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'Approved':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-xs font-semibold whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
        </span>
      );
    case 'Pending Approval':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-full text-xs font-semibold whitespace-nowrap">
          <Clock className="w-3.5 h-3.5" /> Pending Approval
        </span>
      );
    case 'Rejected':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200/60 rounded-full text-xs font-semibold whitespace-nowrap">
          <XCircle className="w-3.5 h-3.5" /> Rejected
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold whitespace-nowrap">
          {status}
        </span>
      );
  }
};

const Sales = () => {
  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState('All');
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingQuotationId, setEditingQuotationId] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [pdfZoom, setPdfZoom] = useState(100);
  
  // Review state
  const [reviewAction, setReviewAction] = useState('Approved'); // 'Approved' | 'Rejected'
  const [managerRemark, setManagerRemark] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Aux state
  const [currentUser, setCurrentUser] = useState(null);
  const [leadsList, setLeadsList] = useState([]);
  const [settings, setSettings] = useState(null);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

  // Create Quotation Form State
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [isLeadDropdownOpen, setIsLeadDropdownOpen] = useState(false);
  const leadDropdownRef = useRef(null);
  const [productsList, setProductsList] = useState([]);
  const [items, setItems] = useState([
    { itemType: 'Product', name: '', description: '', price: '', quantity: 1, gstPercentage: 18 }
  ]);

  // Selected Lead object
  const selectedLead = useMemo(() => {
    return leadsList.find(l => l._id === selectedLeadId);
  }, [leadsList, selectedLeadId]);

  // Filter leads based on search query in the dropdown
  const filteredLeads = useMemo(() => {
    if (!leadSearchQuery.trim()) return leadsList;
    const q = leadSearchQuery.toLowerCase();
    return leadsList.filter(lead => {
      const name = (lead.customerName || '').toLowerCase();
      const comp = (lead.companyName || '').toLowerCase();
      const phone = (lead.contactNumber || '').toLowerCase();
      const status = (lead.status || '').toLowerCase();
      return name.includes(q) || comp.includes(q) || phone.includes(q) || status.includes(q);
    });
  }, [leadsList, leadSearchQuery]);

  // Close lead search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (leadDropdownRef.current && !leadDropdownRef.current.contains(event.target)) {
        setIsLeadDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load Initial Data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [quotesRes, profileRes, settingsRes, leadsRes, productsRes] = await Promise.allSettled([
        apiClient.get('/sales/quotations'),
        apiClient.get('/auth/profile'),
        apiClient.get('/master/settings'),
        apiClient.get('/sales/leads?limit=100'),
        apiClient.get('/master/products')
      ]);

      if (quotesRes.status === 'fulfilled') {
        setQuotations(quotesRes.value.data || []);
      }
      if (profileRes.status === 'fulfilled') {
        setCurrentUser(profileRes.value.data?.user || null);
      }
      if (settingsRes.status === 'fulfilled') {
        setSettings(settingsRes.value.data);
      }
      if (leadsRes.status === 'fulfilled') {
        setLeadsList(leadsRes.value.data?.leads || []);
      }
      if (productsRes.status === 'fulfilled') {
        setProductsList(productsRes.value.data || []);
      }
    } catch (err) {
      console.error('Error fetching sales data:', err);
      toast.error('Failed to load quotations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Form Calculations
  const calculatedTotals = useMemo(() => {
    let subTotal = 0;
    let taxAmount = 0;
    items.forEach(curr => {
      const price = Number(curr.price) || 0;
      const qty = Number(curr.quantity) || 1;
      const gst = Number(curr.gstPercentage) || 0;
      const itemSub = price * qty;
      const itemTax = (itemSub * gst) / 100;
      subTotal += itemSub;
      taxAmount += itemTax;
    });
    return { subTotal, taxAmount, grandTotal: subTotal + taxAmount };
  }, [items]);

  const calculatedSubTotal = calculatedTotals.subTotal;
  const calculatedTaxAmount = calculatedTotals.taxAmount;
  const calculatedGrandTotal = calculatedTotals.grandTotal;

  // Item List Handlers
  const handleAddItem = () => {
    setItems(prev => [...prev, { itemType: 'Product', name: '', description: '', price: '', quantity: 1, gstPercentage: 18 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      toast.warning('A quotation must have at least one item');
      return;
    }
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // For selecting a product — updates name, price, description at once
  const handleProductSelect = (index, productName) => {
    const selected = productsList.find(p => p.name === productName);
    setItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        return {
          ...item,
          name: productName,
          price: selected ? selected.price : item.price,
          description: selected?.description || item.description,
          gstPercentage: selected?.gstPercentage !== undefined ? selected.gstPercentage : item.gstPercentage,
          itemType: selected?.itemType || item.itemType
        };
      }
      return item;
    }));
  };

  const handleOpenCreateModal = () => {
    setEditingQuotationId(null);
    setSelectedLeadId('');
    setLeadSearchQuery('');
    setIsLeadDropdownOpen(false);
    setItems([{ itemType: 'Product', name: '', description: '', price: '', quantity: 1, gstPercentage: 18 }]);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (quote) => {
    if (!quote) return;
    setEditingQuotationId(quote._id);
    setSelectedLeadId(quote.lead?._id || quote.lead || '');
    setLeadSearchQuery('');
    setIsLeadDropdownOpen(false);
    if (quote.items && quote.items.length > 0) {
      setItems(quote.items.map(item => ({
        itemType: item.itemType || 'Product',
        name: item.name || '',
        description: item.description || '',
        price: item.price !== undefined ? item.price : '',
        quantity: item.quantity !== undefined ? item.quantity : 1,
        gstPercentage: item.gstPercentage !== undefined ? item.gstPercentage : 18
      })));
    } else {
      setItems([{ itemType: 'Product', name: '', description: '', price: '', quantity: 1, gstPercentage: 18 }]);
    }
    setIsCreateModalOpen(true);
  };

  const handleSubmitQuotation = async (e) => {
    e.preventDefault();
    if (!selectedLeadId) {
      toast.error('Please select a customer / lead');
      return;
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      if (!items[i].name.trim()) {
        toast.error(`Please enter a name for item #${i + 1}`);
        return;
      }
      if (!items[i].price || Number(items[i].price) <= 0) {
        toast.error(`Please enter a valid price for "${items[i].name}"`);
        return;
      }
    }

    try {
      setIsSubmittingQuote(true);
      const payload = {
        leadId: selectedLeadId,
        items: items.map(item => ({
          itemType: item.itemType,
          name: item.name.trim(),
          description: item.description?.trim() || '',
          price: Number(item.price),
          quantity: Number(item.quantity) || 1,
          gstPercentage: Number(item.gstPercentage) || 0
        })),
        subTotal: calculatedSubTotal
      };

      if (editingQuotationId) {
        const res = await apiClient.put(`/sales/quotations/${editingQuotationId}`, payload);
        toast.success(res.data?.message || 'Quotation updated successfully!');
        if (selectedQuotation && selectedQuotation._id === editingQuotationId) {
          setSelectedQuotation(res.data.quotation);
        }
      } else {
        const res = await apiClient.post('/sales/quotations', payload);
        toast.success(res.data?.message || 'Quotation created successfully!');
      }

      setIsCreateModalOpen(false);
      setEditingQuotationId(null);
      fetchData(); // Refresh list
    } catch (err) {
      console.error('Error saving quotation:', err);
      toast.error(err.response?.data?.message || 'Failed to save quotation');
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  // Review Action Handler
  const handleOpenReview = (quote, action) => {
    setSelectedQuotation(quote);
    setReviewAction(action);
    setManagerRemark('');
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedQuotation) return;
    try {
      setIsSubmittingReview(true);
      const res = await apiClient.put(`/sales/quotations/${selectedQuotation._id}/review`, {
        status: reviewAction,
        managerRemark: managerRemark.trim()
      });
      toast.success(res.data?.message || `Quotation marked as ${reviewAction}`);
      setIsReviewModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error reviewing quotation:', err);
      toast.error(err.response?.data?.message || 'Failed to update quotation');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Base URL for Client Links (Uses VITE_PUBLIC_URL if defined, else current domain)
  const getPublicBaseUrl = () => {
    return (import.meta.env.VITE_PUBLIC_URL || window.location.origin).replace(/\/$/, '');
  };

  // Copy Public Quotation Link for Client
  const handleCopyPublicLink = (q) => {
    const publicUrl = `${getPublicBaseUrl()}/view-quote/${encodeURIComponent(q.quotationNumber)}`;
    navigator.clipboard.writeText(publicUrl);
    toast.success('Public Quotation link copied to clipboard!');
  };

  // WhatsApp Share Handler (Includes Clickable Online PDF Download Link)
  const handleShareWhatsApp = (q) => {
    const rawPhone = q.lead?.contactNumber || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const company = settings?.companyName || 'DigiCoders Technologies';
    const itemsLines = (q.items || [])
      .map((item, idx) => `${idx + 1}. *${item.name}* (${item.itemType}) - Qty: ${item.quantity} x Rs.${Number(item.price).toLocaleString()} = Rs.${(item.price * item.quantity).toLocaleString()}`)
      .join('%0A');

    const publicUrl = `${getPublicBaseUrl()}/view-quote/${encodeURIComponent(q.quotationNumber)}`;

    const message = `*${company} - Official Quotation*%0A%0A` +
      `Dear *${q.lead?.customerName || 'Customer'}*,%0A` +
      `Here are the details for your quotation (*${q.quotationNumber}*):%0A%0A` +
      `*Itemized Summary:*%0A${itemsLines}%0A%0A` +
      `*Subtotal:* Rs.${Number(q.subTotal).toLocaleString()}%0A` +
      `*GST / Tax (${q.taxPercentage}%):* Rs.${Number(q.taxAmount).toLocaleString()}%0A` +
      `*Grand Total:* Rs.${Number(q.totalAmount).toLocaleString()}%0A%0A` +
      `*Status:* ${q.status}%0A%0A` +
      `📥 *View & Download Official PDF Document:*%0A${publicUrl}%0A%0A` +
      `Thank you for choosing *${company}*! Please feel free to reach out if you have any questions.`;

    const url = targetPhone ? `https://wa.me/${targetPhone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(url, '_blank');
  };

  // Print Handler (multi-page safe)
  const handlePrint = () => {
    const prevZoom = pdfZoom;
    setPdfZoom(100);
    setTimeout(() => {
      window.print();
      setPdfZoom(prevZoom);
    }, 150);
  };

  // Check if current user has permission to approve/reject
  const canManageQuotations = useMemo(() => {
    if (!currentUser) return false;
    const roleName = currentUser.role?.name;
    const permissions = currentUser.role?.permissions || [];
    return roleName === 'Admin' || permissions.includes('manage_quotations');
  }, [currentUser]);

  // Unique Lead Statuses
  const uniqueLeadStatuses = useMemo(() => {
    const statuses = new Set();
    quotations.forEach(q => {
      if (q.lead && q.lead.status) {
        statuses.add(q.lead.status);
      }
    });
    return Array.from(statuses);
  }, [quotations]);

  // Filtered Quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      if (activeTab !== 'All' && q.status !== activeTab) {
        return false;
      }
      if (leadStatusFilter !== 'All' && (q.lead?.status || 'Unknown') !== leadStatusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const qNumber = q.quotationNumber?.toLowerCase() || '';
        const custName = q.lead?.customerName?.toLowerCase() || '';
        const compName = q.lead?.companyName?.toLowerCase() || '';
        const phone = q.lead?.contactNumber?.toLowerCase() || '';
        return qNumber.includes(query) || custName.includes(query) || compName.includes(query) || phone.includes(query);
      }
      return true;
    });
  }, [quotations, activeTab, searchQuery, leadStatusFilter]);

  // Overall Metrics
  const stats = useMemo(() => {
    const total = quotations.length;
    const pending = quotations.filter(q => q.status === 'Pending Approval').length;
    const approved = quotations.filter(q => q.status === 'Approved').length;
    const totalValue = quotations
      .filter(q => q.status === 'Approved')
      .reduce((acc, q) => acc + (Number(q.totalAmount) || 0), 0);
    return { total, pending, approved, totalValue };
  }, [quotations]);

  return (
    <div className="space-y-6">
      {/* MAIN SALES DASHBOARD (HIDDEN DURING PRINT SO ONLY PDF PRINTS) */}
      <div className="space-y-6 sales-main-dashboard print:hidden">
        {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Quotations Hub
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate customized quotations, download official PDF invoices, and send to WhatsApp
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            title="Refresh List"
            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B3A2C] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#0a2f23] transition-all hover:scale-[1.01]"
          >
            <Plus className="w-4 h-4" />
            Create Quotation
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Quotations</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{stats.total}</h3>
            <p className="text-xs text-gray-500 mt-1">Generated all time</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Review</p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{stats.pending}</h3>
            <p className="text-xs text-amber-600/80 mt-1">Awaiting manager review</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Approved Quotes</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.approved}</h3>
            <p className="text-xs text-emerald-600/80 mt-1">Ready for conversion</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Approved Value</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">
              ₹{stats.totalValue.toLocaleString()}
            </h3>
            <p className="text-xs text-gray-500 mt-1">Pipeline deal revenue</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#0B3A2C]/10 text-[#0B3A2C] flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {['All', 'Pending Approval', 'Approved', 'Rejected'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? 'bg-[#0B3A2C] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search and Lead Status Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Lead Status Filter */}
            <div className="relative w-full sm:w-48">
              <Filter className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={leadStatusFilter}
                onChange={(e) => setLeadStatusFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
              >
                <option value="All">All Lead Statuses</option>
                {uniqueLeadStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by quote # or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#0B3A2C] animate-spin mb-3" />
            <p className="text-gray-500 text-sm font-medium">Loading sales quotations...</p>
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">No Quotations Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
              {searchQuery ? 'No quotations matched your search criteria.' : 'No quotations created in this tab yet.'}
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B3A2C] text-white rounded-xl text-xs font-bold hover:bg-[#0a2f23] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Create First Quotation
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Quotation #</th>
                  <th className="py-3.5 px-4">Customer / Lead</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Lead Status</th>
                  <th className="py-3.5 px-4">Item Summary</th>
                  <th className="py-3.5 px-4">Subtotal</th>
                  <th className="py-3.5 px-4">Total Tax</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created By</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredQuotations.map((q) => (
                  <tr key={q._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0B3A2C]">
                      {q.quotationNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{q.lead?.customerName || 'N/A'}</div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {q.lead?.contactNumber || 'N/A'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {q.lead?.status ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 whitespace-nowrap">
                          {q.lead.status}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs italic">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="truncate text-gray-600 font-medium">
                        {(q.items || []).map(i => `${i.name} (${i.itemType}) x${i.quantity}`).join(', ')}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {q.items?.length || 0} line item{q.items?.length !== 1 ? 's' : ''}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-gray-800">
                      ₹{Number(q.subTotal || 0).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-emerald-700 font-medium">
                      +₹{Number(q.taxAmount || 0).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-gray-900 text-sm">
                      ₹{Number(q.totalAmount || 0).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(q.status)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-gray-900 font-medium">{q.createdBy?.name || 'User'}</div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        {/* Copy Public Link Button */}
                        <button
                          onClick={() => handleCopyPublicLink(q)}
                          title="Copy Public Link for Customer"
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* View / Print Invoice Button */}
                        <button
                          onClick={() => {
                            setSelectedQuotation(q);
                            setIsViewModalOpen(true);
                          }}
                          title="View Official Invoice"
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Quotation Button */}
                        <button
                          onClick={() => handleOpenEditModal(q)}
                          title="Edit Quotation"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Manager Review Buttons (Only for Pending Approval) */}
                        {canManageQuotations && q.status === 'Pending Approval' && (
                          <>
                            {/* Approve (Sahi / Check Icon) */}
                            <button
                              onClick={() => handleOpenReview(q, 'Approved')}
                              title="Approve Quotation"
                              className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-300"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>

                            {/* Reject (Cut / Cross Icon) */}
                            <button
                              onClick={() => handleOpenReview(q, 'Rejected')}
                              title="Reject Quotation"
                              className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-300"
                            >
                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          </>
                        )}

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE QUOTATION (ON-THE-FLY ITEMS)                              */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  {editingQuotationId ? 'Edit Quotation' : 'Create Sales Quotation'}
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                    {editingQuotationId ? 'Revision Mode' : 'Auto GST'}
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingQuotationId 
                    ? 'Modify client, line items, rates, and quantities for this quotation' 
                    : 'Pick a customer, choose Product/Service on the fly, and send for manager review'}
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingQuotationId(null);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitQuotation} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Customer Selection with Search Bar */}
              <div className="relative" ref={leadDropdownRef}>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Select Customer / Lead *
                </label>

                {/* Dropdown Trigger Box */}
                <div
                  onClick={() => setIsLeadDropdownOpen(!isLeadDropdownOpen)}
                  className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm transition-all cursor-pointer flex items-center justify-between shadow-sm select-none ${
                    isLeadDropdownOpen 
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20' 
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!selectedLeadId ? 'text-gray-400' : 'text-gray-900'}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <User className={`w-4 h-4 shrink-0 ${selectedLeadId ? 'text-emerald-600' : 'text-gray-400'}`} />
                    {selectedLead ? (
                      <div className="truncate text-left">
                        <span className="font-bold text-gray-900">{selectedLead.customerName}</span>
                        {selectedLead.companyName && (
                          <span className="text-emerald-700 ml-1.5 font-semibold">({selectedLead.companyName})</span>
                        )}
                        <span className="text-gray-500 ml-2 font-mono text-xs">- {selectedLead.contactNumber}</span>
                        {selectedLead.status && (
                          <span className="ml-2 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold">
                            {selectedLead.status}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="font-medium text-gray-500">-- Choose Customer from Leads --</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {selectedLeadId && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLeadId('');
                          setLeadSearchQuery('');
                        }}
                        className="p-1 text-gray-400 hover:text-rose-500 hover:bg-gray-100 rounded-full transition-colors"
                        title="Clear Selection"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isLeadDropdownOpen ? 'rotate-180 text-emerald-600' : ''}`} />
                  </div>
                </div>

                {/* Dropdown Menu with Live Search Bar */}
                {isLeadDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                    
                    {/* Live Search Bar Input */}
                    <div className="p-3 border-b border-gray-100 bg-gray-50/80">
                      <div className="relative">
                        <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={leadSearchQuery}
                          onChange={(e) => setLeadSearchQuery(e.target.value)}
                          placeholder="Search customer by name, company, phone..."
                          autoFocus
                          className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
                        />
                        {leadSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setLeadSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1.5 px-1 font-medium">
                        <span>{filteredLeads.length} customer{filteredLeads.length === 1 ? '' : 's'} available</span>
                        {leadSearchQuery && (
                          <span className="text-emerald-600 font-semibold">Filtering leads</span>
                        )}
                      </div>
                    </div>

                    {/* Scrollable Results List */}
                    <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
                      {filteredLeads.length > 0 ? (
                        filteredLeads.map((lead) => {
                          const isSelected = selectedLeadId === lead._id;
                          return (
                            <div
                              key={lead._id}
                              onClick={() => {
                                setSelectedLeadId(lead._id);
                                setIsLeadDropdownOpen(false);
                                setLeadSearchQuery('');
                              }}
                              className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                                isSelected 
                                  ? 'bg-emerald-50 text-emerald-900 font-semibold' 
                                  : 'hover:bg-gray-50 text-gray-800'
                              }`}
                            >
                              <div className="min-w-0 flex-1 pr-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-gray-900 truncate">
                                    {lead.customerName}
                                  </span>
                                  {lead.companyName && (
                                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50/70 px-1.5 py-0.5 rounded border border-emerald-100 truncate max-w-[150px]">
                                      {lead.companyName}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                  <span className="font-mono">{lead.contactNumber || 'No Phone'}</span>
                                  {lead.email && <span className="truncate max-w-[180px]">{lead.email}</span>}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {lead.status && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-semibold">
                                    {lead.status}
                                  </span>
                                )}
                                {isSelected && (
                                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-6 text-center text-xs text-gray-500">
                          <p className="font-semibold text-gray-700">No matching customers found</p>
                          <p className="text-gray-400 mt-0.5">Try searching with another keyword or phone number</p>
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {leadsList.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No leads found. Please create leads in the Leads section first.
                  </p>
                )}
              </div>

              {/* Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Quotation Line Items (Products & Services)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B3A2C] hover:text-emerald-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Item
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div 
                      key={index}
                      className="p-3.5 bg-gray-50 border border-gray-200/80 rounded-xl space-y-3 animate-fadeIn"
                    >
                      <div className="grid grid-cols-12 gap-2.5 items-center">
                        {/* Item Type */}
                        <div className="col-span-12 sm:col-span-2">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                            Type
                          </label>
                          <select
                            value={item.itemType}
                            onChange={(e) => handleItemChange(index, 'itemType', e.target.value)}
                            className="w-full px-2 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          >
                            <option value="Product">Product</option>
                            <option value="Service">Service</option>
                          </select>
                        </div>
                        
                        {/* Item Name / Product Select */}
                        <div className="col-span-12 sm:col-span-3">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                            Select {item.itemType} *
                          </label>
                          <select
                            value={item.name}
                            onChange={(e) => handleProductSelect(index, e.target.value)}
                            required
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          >
                            <option value="">-- Select {item.itemType} --</option>
                            {productsList
                              .filter(prod => prod.itemType === item.itemType)
                              .map(prod => (
                                <option key={prod._id} value={prod.name}>{prod.name} — ₹{prod.price?.toLocaleString('en-IN')}</option>
                            ))}
                          </select>
                        </div>

                        {/* GST % */}
                        <div className="col-span-4 sm:col-span-2">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                            GST (%)
                          </label>
                          <input
                            type="number"
                            placeholder="18"
                            value={item.gstPercentage}
                            readOnly
                            className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-500 cursor-not-allowed focus:outline-none"
                          />
                        </div>

                        {/* Unit Price */}
                        <div className="col-span-6 sm:col-span-2">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                            Rate (₹) *
                          </label>
                          <input
                            type="number"
                            placeholder="0"
                            value={item.price}
                            readOnly
                            className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-500 cursor-not-allowed focus:outline-none"
                          />
                        </div>

                        {/* Quantity */}
                        <div className="col-span-4 sm:col-span-2">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                            Qty
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            required
                            className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-center"
                          />
                        </div>

                        {/* Delete Row */}
                        <div className="col-span-2 sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            title="Remove item"
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Item Subtitle / Description */}
                      <div>
                        <input
                          type="text"
                          placeholder="Optional details: e.g. Business website with admin panel, responsive design, SEO setup"
                          value={item.description || ''}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Live Calculation Card */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Subtotal Amount:</span>
                  <span className="font-semibold text-gray-900">₹{calculatedSubTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-800">
                  <span className="flex items-center gap-1">
                    Total GST / Tax:
                  </span>
                  <span className="font-semibold text-emerald-800">
                    +₹{calculatedTaxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t border-emerald-200 pt-2 flex justify-between text-sm font-extrabold text-gray-900">
                  <span>Grand Total (Quotation Amount):</span>
                  <span className="text-[#0B3A2C] text-base">
                    ₹{calculatedGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingQuotationId(null);
                  }}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuote}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0B3A2C] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#0a2f23] transition-colors disabled:opacity-50"
                >
                  {isSubmittingQuote ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingQuotationId ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>
                    {isSubmittingQuote 
                      ? (editingQuotationId ? 'Updating...' : 'Creating...') 
                      : (editingQuotationId ? 'Save & Update Quotation' : 'Submit for Manager Approval')}
                  </span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: AUTHENTIC PDF VIEWER EXPERIENCE (SHARP A4 CORNERS, ZERO RADIUS)  */}
      {/* ========================================================================= */}
      {isViewModalOpen && selectedQuotation && (
        <div className="fixed inset-0 bg-[#525659] z-50 flex flex-col overflow-hidden animate-fadeIn pdf-viewer-modal-backdrop print:static print:inset-auto print:bg-white print:overflow-visible print:h-auto print:block">
          
          {/* Authentic PDF Viewer Toolbar (Chrome / Acrobat Style) */}
          <div className="bg-[#323639] text-white px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-md border-b border-black/20 shrink-0 print:hidden z-20">
            {/* Left: Document Name & Status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-rose-600 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
                  PDF
                </div>
                <span className="font-mono text-xs font-semibold text-gray-200 tracking-wide">
                  {selectedQuotation.quotationNumber}.pdf
                </span>
              </div>
              <div className="hidden sm:block">
                {getStatusBadge(selectedQuotation.status)}
              </div>
            </div>

            {/* Center: Page Indicator & Zoom Controls */}
            <div className="hidden md:flex items-center gap-3 text-xs text-gray-300">
              <span className="bg-[#212529] px-3 py-1 rounded text-[11px] font-medium text-gray-300 border border-white/5">
                Page 1 / 1
              </span>
              <div className="h-4 w-px bg-white/20"></div>
              <div className="flex items-center gap-1 bg-[#212529] px-2 py-0.5 rounded border border-white/5">
                <button
                  type="button"
                  onClick={() => setPdfZoom(prev => Math.max(60, prev - 10))}
                  className="p-1 hover:text-white text-gray-400 hover:bg-white/10 rounded transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="w-12 text-center font-mono text-[11px] text-gray-300 select-none">
                  {pdfZoom}%
                </span>
                <button
                  type="button"
                  onClick={() => setPdfZoom(prev => Math.min(150, prev + 10))}
                  className="p-1 hover:text-white text-gray-400 hover:bg-white/10 rounded transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                {pdfZoom !== 100 && (
                  <button
                    type="button"
                    onClick={() => setPdfZoom(100)}
                    className="ml-1 text-[10px] text-emerald-400 hover:underline"
                    title="Reset Zoom"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Right: Actions (Edit, WhatsApp, Print/Save PDF, Close) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const quoteToEdit = selectedQuotation;
                  setIsViewModalOpen(false);
                  handleOpenEditModal(quoteToEdit);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition-all shadow-sm"
                title="Edit this Quotation"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit Quotation</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyPublicLink(selectedQuotation)}
                disabled={selectedQuotation?.status !== 'Approved'}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all shadow-sm ${selectedQuotation?.status === 'Approved' ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                title={selectedQuotation?.status !== 'Approved' ? 'Approved hone ke baad hi Copy kar sakte hain' : 'Copy Public Link for Client'}
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copy Link</span>
              </button>

              <button
                type="button"
                onClick={() => window.open(`/view-quote/${encodeURIComponent(selectedQuotation.quotationNumber)}`, '_blank')}
                disabled={selectedQuotation?.status !== 'Approved'}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all shadow-sm ${selectedQuotation?.status === 'Approved' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                title={selectedQuotation?.status !== 'Approved' ? 'Approved hone ke baad hi Client View kar sakte hain' : 'Open Client Web View in new tab'}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Client View</span>
              </button>

              <button
                type="button"
                onClick={() => handleShareWhatsApp(selectedQuotation)}
                disabled={selectedQuotation?.status !== 'Approved'}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all shadow-sm ${selectedQuotation?.status === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                title={selectedQuotation?.status !== 'Approved' ? 'Approved hone ke baad hi WhatsApp par bhej sakte hain' : 'Send via WhatsApp'}
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
              
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B3A2C] hover:bg-[#124b39] text-white rounded text-xs font-semibold transition-all shadow-sm border border-emerald-500/30"
                title="Print or Save as PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print / Save PDF</span>
              </button>

              <div className="h-5 w-px bg-white/20 mx-1"></div>

              <button
                type="button"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setPdfZoom(100);
                }}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all"
                title="Close PDF Viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Rejected / Failed Banner */}
          {selectedQuotation?.status === 'Rejected' && (
            <div className="flex items-center gap-3 bg-rose-600 text-white px-6 py-3 print:hidden">
              <XCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold text-sm">Quotation Rejected / Failed</p>
                {selectedQuotation?.managerRemark && (
                  <p className="text-xs text-rose-100 mt-0.5">Manager Remark: {selectedQuotation.managerRemark}</p>
                )}
              </div>
            </div>
          )}

          {/* Pending Approval Banner */}
          {selectedQuotation?.status === 'Pending Approval' && (
            <div className="flex items-center gap-3 bg-amber-500 text-white px-6 py-3 print:hidden">
              <Clock className="w-5 h-5 shrink-0" />
              <p className="font-bold text-sm">Awaiting Sales Manager Approval — Cannot be sent to client yet</p>
            </div>
          )}

          {/* PDF Canvas Area (Centered A4 Sheet with Realistic Drop Shadow) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pdf-canvas-container print:p-0 print:m-0 print:overflow-visible print:block print:h-auto">
            {/* Real A4 Paper Sheet (Zero Border Radius - Pure Sharp Rectangle) */}
            <div 
              className="bg-white w-full max-w-[850px] shadow-[0_8px_35px_rgba(0,0,0,0.55)] rounded-none h-fit border border-gray-300 relative print:shadow-none print:border-none print:max-w-full print:m-0 print:p-0 print:static transition-transform duration-150 origin-top"
              style={{ borderRadius: 0, transform: `scale(${pdfZoom / 100})` }}
              id="official-quotation-doc"
            >
              {/* PRINTABLE DOCUMENT BODY (Exact Design of User Template) */}
              <div className="p-6 sm:p-10 space-y-6 text-gray-900 bg-white print:p-3 print:space-y-4">
              
              {/* HEADER WITH LOGO & GEOMETRIC GREEN BANNER */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative print-avoid-break">
                
                {/* Left Brand Logo & Monogram */}
                <div className="flex items-center gap-3.5">
                  {settings?.companyLogo ? (
                    <div className="flex flex-col">
                      <img 
                        src={settings.companyLogo} 
                        alt={settings?.companyName || "Logo"} 
                        className="h-16 w-auto max-w-[220px] object-contain"
                      />
                      <p className="text-[9px] font-black text-gray-400 tracking-[0.25em] uppercase mt-1">
                        {settings?.companySlogan || 'BUILD | INNOVATE | GROW'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* DigiCoders Modern D Icon */}
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-[#0B3A2C] to-[#041a13] p-0.5 shadow-md flex items-center justify-center shrink-0">
                        <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                          <svg viewBox="0 0 100 100" className="w-10 h-10">
                            {/* Custom Modern Geometric D Logo */}
                            <path d="M 25 20 L 55 20 C 75 20 85 32 85 50 C 85 68 75 80 55 80 L 25 80 Z" fill="#0B3A2C" />
                            <path d="M 40 35 L 52 35 C 64 35 70 42 70 50 C 70 58 64 65 52 65 L 40 65 Z" fill="#ffffff" />
                            <circle cx="30" cy="50" r="7" fill="#10b981" />
                            <rect x="25" y="47" width="10" height="6" fill="#10b981" />
                          </svg>
                        </div>
                      </div>

                      <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none font-sans">
                          {settings?.companyName?.split(' ')[0] || 'DigiCoders'}
                        </h1>
                        <span className="text-xl font-bold text-emerald-600 block tracking-tight leading-tight">
                          {settings?.companyName?.split(' ').slice(1).join(' ') || 'Technologies'}
                        </span>
                        <p className="text-[9px] font-black text-gray-400 tracking-[0.25em] uppercase mt-0.5">
                          {settings?.companySlogan || 'BUILD | INNOVATE | GROW'}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Right Geometric Green Header Banner */}
                <div className="bg-[#0B3A2C] text-white pl-8 pr-8 py-3.5 rounded-l-3xl rounded-r-xl sm:rounded-r-2xl shadow-lg relative self-stretch sm:self-auto text-right border-l-[6px] border-emerald-400">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-widest uppercase font-sans">
                    QUOTATION
                  </h2>
                  <p className="text-[11px] text-emerald-200/90 font-medium tracking-wide">
                    {settings?.quotationSubtitle || 'Software Solutions for a Better Tomorrow'}
                  </p>
                </div>
              </div>

              {/* Sub-header Contact Strip */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-[11px] text-gray-600 font-medium border-b border-gray-100 pb-3">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  {settings?.companyAddress || 'Lucknow, Uttar Pradesh, India'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  {settings?.companyEmail || 'info@digicoders.com'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  {settings?.companyPhone || '+91 98765 43210'}
                </span>
                <a 
                  href={settings?.websiteUrl || 'https://www.digicoders.com'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-emerald-700 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  {settings?.websiteUrl?.replace(/^https?:\/\//, '') || 'www.digicoders.com'}
                </a>
              </div>

              {/* TWO CARDS: QUOTATION FOR & QUOTATION DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print-avoid-break">
                
                {/* Quotation For (Real Client Info) */}
                <div className="bg-gray-50/80 rounded-2xl p-4 sm:p-5 border border-gray-100 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    Quotation For
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-gray-900 leading-tight">
                      {selectedQuotation.lead?.customerName || 'Valued Client'}
                    </h3>
                    {selectedQuotation.lead?.companyName && (
                      <p className="text-xs font-semibold text-emerald-700">
                        {selectedQuotation.lead.companyName}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-gray-600 font-medium">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{selectedQuotation.lead?.contactNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{selectedQuotation.lead?.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{selectedQuotation.lead?.location || 'Lucknow, Uttar Pradesh, India'}</span>
                    </div>
                  </div>
                </div>

                {/* Quotation Details (System Metadata) */}
                <div className="bg-gray-50/80 rounded-2xl p-4 sm:p-5 border border-gray-100 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    Quotation Details
                  </div>

                  <div className="grid grid-cols-12 gap-y-1.5 text-xs text-gray-600 font-medium">
                    <span className="col-span-5 text-gray-500">Quotation No</span>
                    <span className="col-span-1">:</span>
                    <span className="col-span-6 font-mono font-bold text-gray-900">{selectedQuotation.quotationNumber}</span>

                    <span className="col-span-5 text-gray-500">Issue Date</span>
                    <span className="col-span-1">:</span>
                    <span className="col-span-6 font-semibold text-gray-800">
                      {new Date(selectedQuotation.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>

                    <span className="col-span-5 text-gray-500">Valid Till</span>
                    <span className="col-span-1">:</span>
                    <span className="col-span-6 font-semibold text-gray-800">
                      {new Date(new Date(selectedQuotation.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} (30 Days)
                    </span>

                    <span className="col-span-5 text-gray-500">Prepared By</span>
                    <span className="col-span-1">:</span>
                    <span className="col-span-6 font-bold text-gray-900">
                      {selectedQuotation.createdBy?.name || 'Super Admin'}
                    </span>

                    <span className="col-span-5 text-gray-500">Designation</span>
                    <span className="col-span-1">:</span>
                    <span className="col-span-6 text-gray-600">
                      {selectedQuotation.createdBy?.role?.name || settings?.defaultDesignation || 'Sales Executive'}
                    </span>
                  </div>
                </div>

              </div>

              {/* ITEM TABLE (DARK GREEN HEADER AS IN TEMPLATE) */}
              <div className="rounded-xl overflow-hidden border border-gray-200 print:overflow-visible print:border print:rounded-none">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0B3A2C] text-white uppercase font-bold tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-3.5 text-center w-12">#</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-center">Type</th>
                      <th className="py-3 px-4 text-right">Unit Price (₹)</th>
                      <th className="py-3 px-4 text-center">Qty</th>
                      <th className="py-3 px-4 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {(selectedQuotation.items || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 print-avoid-break">
                        <td className="py-3.5 px-3.5 text-center text-gray-400 font-bold font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-gray-900 text-[13px]">{item.name}</div>
                          {item.description && (
                            <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                              {item.description}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.itemType === 'Service' ? (
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-full border border-blue-200">
                              Service
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200">
                              Product
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-gray-700">
                          {Number(item.price).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-gray-800">
                          {item.quantity}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-gray-900 text-sm">
                          {(Number(item.price) * Number(item.quantity)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* AMOUNT IN WORDS & GRAND TOTAL SUMMARY (TWO COLUMNS) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch print-avoid-break">
                
                {/* Left: Amount in Words */}
                <div className="md:col-span-7 bg-gray-50/80 rounded-2xl p-4 border border-gray-100 flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center">
                      <FileText className="w-3 h-3" />
                    </div>
                    Amount in Words
                  </div>
                  <p className="text-xs font-bold text-gray-800 italic mt-1">
                    {convertNumberToWords(selectedQuotation.totalAmount)}
                  </p>
                </div>

                {/* Right: Subtotal, GST & Grand Total Banner */}
                <div className="md:col-span-5 bg-gray-50/80 rounded-2xl p-4 border border-gray-100 flex flex-col justify-between space-y-2">
                  <div className="flex justify-between text-xs text-gray-600 font-medium">
                    <span>Subtotal</span>
                    <span className="font-bold text-gray-900">₹{Number(selectedQuotation.subTotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 font-medium">
                    <span>Total GST</span>
                    <span className="font-bold text-gray-900">₹{Number(selectedQuotation.taxAmount).toLocaleString()}</span>
                  </div>
                  
                  {/* Grand Total Green Banner */}
                  <div className="bg-[#0B3A2C] text-white p-3 rounded-xl flex justify-between items-center shadow-md">
                    <span className="text-xs font-black uppercase tracking-wider">Grand Total</span>
                    <span className="text-lg font-black tracking-tight">
                      ₹{Number(selectedQuotation.totalAmount).toLocaleString()}
                    </span>
                  </div>
                </div>

              </div>

              {/* TERMS & CONDITIONS & WHY CHOOSE US (TWO CARDS) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print-avoid-break">
                
                {/* Terms & Conditions */}
                <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 text-xs">
                  <div className="flex items-center gap-2 font-bold text-gray-800 uppercase tracking-wider mb-2.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Terms & Conditions
                  </div>
                  <ol className="space-y-1.5 text-gray-600 text-[11px] leading-relaxed">
                    {(settings?.termsAndConditions && settings.termsAndConditions.length > 0 ? settings.termsAndConditions : [
                      "This quotation is valid for 30 days from the date of issue.",
                      "50% advance payment required to initiate the work.",
                      "Balance payment after project completion.",
                      "Any additional features will be charged separately.",
                      "Project timeline: 2 – 4 weeks (depending on requirements).",
                      "Includes 3 months free support after delivery.",
                      `GST (${selectedQuotation.taxPercentage || 18}%) is applicable as per government rules.`
                    ]).map((term, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{term}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Why Choose DigiCoders */}
                <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 text-xs">
                  <div className="flex items-center gap-2 font-bold text-gray-800 uppercase tracking-wider mb-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Why Choose {settings?.companyName?.split(' ')[0] || 'DigiCoders'}?
                  </div>
                  <div className="space-y-2 text-gray-700 text-[11px] font-medium pt-1">
                    {(settings?.whyChooseUs && settings.whyChooseUs.length > 0 ? settings.whyChooseUs : [
                      "Experienced Development Team",
                      "Modern & Secure Technology Stack",
                      "On-Time Delivery",
                      "Dedicated Support & Maintenance"
                    ]).map((point, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* SIGNATURES, OFFICIAL STAMP & THANK YOU NOTE */}
              <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-6 pt-2 print-avoid-break">
                
                {/* Official Stamp & Sign */}
                <div className="flex items-center gap-5">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 mb-2">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      For {settings?.signatoryCompany || settings?.companyName || 'DigiCoders Technologies'}
                    </div>
                    
                    {/* Official Digital Signature Image or Handwritten Signature */}
                    <div className="h-12 flex items-center">
                      {settings?.digitalSignature ? (
                        <img 
                          src={settings.digitalSignature} 
                          alt="Digital Signature" 
                          className="h-12 max-w-[170px] object-contain transform -rotate-1 select-none filter contrast-125" 
                        />
                      ) : (
                        <div className="font-serif text-2xl italic font-bold text-gray-800 tracking-wider">
                          {settings?.signatoryName || 'Amit Kumar'}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-1 text-xs">
                      <div className="font-extrabold text-gray-900">
                        {settings?.signatoryName || 'Amit Kumar'}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {settings?.signatoryDesignation || 'Director'}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {settings?.signatoryCompany || settings?.companyName || 'DigiCoders Technologies'}
                      </div>
                    </div>
                  </div>

                  {/* Circular Official Company Stamp Seal (Uploaded Image or Dynamic Stamp) */}
                  {settings?.companyStamp ? (
                    <div className="w-20 h-20 flex items-center justify-center rotate-[-5deg] opacity-90 select-none shrink-0">
                      <img 
                        src={settings.companyStamp} 
                        alt="Official Stamp Seal" 
                        className="w-20 h-20 object-contain drop-shadow-sm" 
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-blue-900/60 p-1 flex items-center justify-center rotate-[-6deg] opacity-90 select-none shrink-0">
                      <div className="w-full h-full rounded-full border border-blue-900/80 flex flex-col items-center justify-center text-blue-900 text-[7px] font-black uppercase text-center leading-none p-1">
                        <span>★ {settings?.companyName?.toUpperCase() || 'DIGICODERS'} ★</span>
                        <div className="my-0.5">
                          <span className="text-xs font-extrabold">
                            {settings?.companyName ? settings.companyName.charAt(0).toUpperCase() : 'D'}
                          </span>
                        </div>
                        <span className="tracking-tighter">
                          {settings?.companyName?.split(' ').slice(1).join(' ')?.toUpperCase() || 'TECHNOLOGIES'}
                        </span>
                        <span className="text-[6px] tracking-widest mt-0.5">
                          {settings?.stampCity?.toUpperCase() || 'LUCKNOW'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Thank You Note */}
                <div className="text-center sm:text-right max-w-xs">
                  <div className="font-serif italic text-3xl font-extrabold text-emerald-600 tracking-wide">
                    Thank you!
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    {settings?.thankYouNote || 'We appreciate the opportunity to work with you. Looking forward to a long-term business relationship.'}
                  </p>
                </div>

              </div>

              {/* BOTTOM FOOTER RIBBON (FULL-BLEED WITH NOTCH & SOCIAL LINKS AS PER TEMPLATE) */}
              <div className="-mx-6 -mb-6 sm:-mx-10 sm:-mb-10 mt-6 bg-[#0B3A2C] text-white px-6 sm:px-10 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-medium shadow-lg rounded-none relative print-avoid-break">
                
                {/* Contact Items */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6">
                  <span className="flex items-center gap-1.5 text-gray-200 hover:text-white transition-colors">
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {settings?.companyPhone || '+91 98765 43210'}
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-200 hover:text-white transition-colors">
                    <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {settings?.companyEmail || 'info@digicoders.com'}
                  </span>
                  <a 
                    href={settings?.websiteUrl || 'https://www.digicoders.com'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-gray-200 hover:text-white transition-colors underline"
                  >
                    <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {settings?.websiteUrl?.replace(/^https?:\/\//, '') || 'www.digicoders.com'}
                  </a>
                </div>

                {/* Right: Downward White Notch Cut-Out, Divider & Clickable Social Icons */}
                <div className="flex items-center gap-3">
                  
                  {/* Downward Triangle Notch as in Template */}
                  <div className="hidden sm:block absolute -top-0 right-36 z-10">
                    <svg className="w-5 h-3 text-white fill-current block" viewBox="0 0 20 12">
                      <polygon points="0,0 20,0 10,12" />
                    </svg>
                  </div>

                  {/* Vertical Separator Line */}
                  <span className="text-emerald-500/60 font-light text-sm select-none pr-1">|</span>

                  {/* Clickable Social Media Links */}
                  <div className="flex items-center gap-3 text-emerald-300">
                    {/* LinkedIn */}
                    <a 
                      href={settings?.linkedinUrl || 'https://www.linkedin.com/company/digicoders-technologies'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="LinkedIn"
                      className="hover:text-white hover:scale-110 transition-all p-0.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.65 1.65 0 1 0 0-3.3 1.65 1.65 0 0 0 0 3.3m1.4 9.74V9.93H5.06v8.57z"/>
                      </svg>
                    </a>

                    {/* Instagram */}
                    <a 
                      href={settings?.instagramUrl || 'https://www.instagram.com/digicoders'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="Instagram"
                      className="hover:text-white hover:scale-110 transition-all p-0.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>

                    {/* Facebook */}
                    <a 
                      href={settings?.facebookUrl || 'https://www.facebook.com/digicoders'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="Facebook"
                      className="hover:text-white hover:scale-110 transition-all p-0.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>

                    {/* YouTube */}
                    <a 
                      href={settings?.youtubeUrl || 'https://www.youtube.com/@digicoders'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="YouTube"
                      className="hover:text-white hover:scale-110 transition-all p-0.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </a>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: MANAGER REVIEW (APPROVE / REJECT)                                */}
      {/* ========================================================================= */}
      {isReviewModalOpen && selectedQuotation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                reviewAction === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
                {reviewAction === 'Approved' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {reviewAction === 'Approved' ? 'Approve Quotation' : 'Reject Quotation'}
                </h3>
                <p className="text-xs text-gray-500 font-mono">
                  {selectedQuotation.quotationNumber} (₹{Number(selectedQuotation.totalAmount).toLocaleString()})
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Manager Notes / Remarks {reviewAction === 'Rejected' ? '(Required)' : '(Optional)'}
              </label>
              <textarea
                rows={3}
                placeholder={reviewAction === 'Approved' ? 'e.g. Approved as per standard rate card.' : 'e.g. Discount too high, reduce margin...'}
                value={managerRemark}
                onChange={(e) => setManagerRemark(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={isSubmittingReview || (reviewAction === 'Rejected' && !managerRemark.trim())}
                className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-colors disabled:opacity-50 ${
                  reviewAction === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isSubmittingReview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Confirm {reviewAction}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Sales;
