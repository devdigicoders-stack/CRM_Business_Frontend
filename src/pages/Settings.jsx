import React, { useState, useEffect } from 'react';
import { 
  Building2, Percent, Clock, ShieldCheck, 
  MapPin, Phone, Mail, DollarSign, Save, Loader2, 
  CheckCircle2, AlertCircle, Info, Sparkles, FileText,
  Plus, Trash2, Globe, Send, Award, Check, Upload, Image, X
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../api/axiosConfig';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Document Types State
  const [documentTypes, setDocumentTypes] = useState([]);
  const [newDocType, setNewDocType] = useState('');
  const [isAddingDocType, setIsAddingDocType] = useState(false);

  // Products State
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '' });
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    companyName: 'DigiCoders Technologies',
    companyEmail: 'info@digicoders.com',
    companyPhone: '+91 98765 43210',
    companyAddress: 'Lucknow, Uttar Pradesh, India',
    currency: 'INR',
    leadApprovalTAT: 24,

    // Dynamic Images & Branding
    companyLogo: '',
    digitalSignature: '',
    companyStamp: '',

    // Dynamic Quotation & Branding
    companySlogan: 'BUILD | INNOVATE | GROW',
    quotationSubtitle: 'Software Solutions for a Better Tomorrow',
    defaultDesignation: 'Sales Executive',
    termsAndConditions: [
      "This quotation is valid for 30 days from the date of issue.",
      "50% advance payment required to initiate the work.",
      "Balance payment after project completion.",
      "Any additional features will be charged separately.",
      "Project timeline: 2 – 4 weeks (depending on requirements).",
      "Includes 3 months free support after delivery.",
      "GST (18%) is applicable as per government rules."
    ],
    whyChooseUs: [
      "Experienced Development Team",
      "Modern & Secure Technology Stack",
      "On-Time Delivery",
      "Dedicated Support & Maintenance"
    ],
    signatoryName: 'Amit Kumar',
    signatoryDesignation: 'Director',
    signatoryCompany: 'DigiCoders Technologies',
    stampCity: 'LUCKNOW',
    thankYouNote: 'We appreciate the opportunity to work with you. Looking forward to a long-term business relationship.',
    websiteUrl: 'https://www.digicoders.com',
    linkedinUrl: 'https://www.linkedin.com/company/digicoders-technologies',
    instagramUrl: 'https://www.instagram.com/digicoders',
    facebookUrl: 'https://www.facebook.com/digicoders',
    youtubeUrl: 'https://www.youtube.com/@digicoders'
  });

  const tabs = [
    { id: 'general', name: 'General & Company', icon: Building2, desc: 'Company details & contact' },
    { id: 'tat', name: 'TAT & Deadlines', icon: Clock, desc: 'SLA hours & breach alerts' },
    { id: 'documents', name: 'Lead Documents', icon: FileText, desc: 'Configure required documents for leads' },
    { id: 'system', name: 'System & Security', icon: ShieldCheck, desc: 'Environment & role access' },
  ];

  // Fetch settings from API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const res = await apiClient.get('/master/settings');
        if (res.data) {
          setFormData(prev => ({
            ...prev,
            companyName: res.data.companyName || prev.companyName,
            companyEmail: res.data.companyEmail || prev.companyEmail,
            companyPhone: res.data.companyPhone || prev.companyPhone,
            companyAddress: res.data.companyAddress || prev.companyAddress,
            currency: res.data.currency || prev.currency,
            leadApprovalTAT: res.data.leadApprovalTAT ?? prev.leadApprovalTAT,

            companyLogo: res.data.companyLogo || '',
            digitalSignature: res.data.digitalSignature || '',
            companyStamp: res.data.companyStamp || '',

            companySlogan: res.data.companySlogan || prev.companySlogan,
            quotationSubtitle: res.data.quotationSubtitle || prev.quotationSubtitle,
            defaultDesignation: res.data.defaultDesignation || prev.defaultDesignation,
            termsAndConditions: (res.data.termsAndConditions && res.data.termsAndConditions.length > 0) 
              ? res.data.termsAndConditions 
              : prev.termsAndConditions,
            whyChooseUs: (res.data.whyChooseUs && res.data.whyChooseUs.length > 0)
              ? res.data.whyChooseUs
              : prev.whyChooseUs,
            signatoryName: res.data.signatoryName || prev.signatoryName,
            signatoryDesignation: res.data.signatoryDesignation || prev.signatoryDesignation,
            signatoryCompany: res.data.signatoryCompany || prev.signatoryCompany,
            stampCity: res.data.stampCity || prev.stampCity,
            thankYouNote: res.data.thankYouNote || prev.thankYouNote,
            websiteUrl: res.data.websiteUrl || prev.websiteUrl,
            linkedinUrl: res.data.linkedinUrl || prev.linkedinUrl,
            instagramUrl: res.data.instagramUrl || prev.instagramUrl,
            facebookUrl: res.data.facebookUrl || prev.facebookUrl,
            youtubeUrl: res.data.youtubeUrl || prev.youtubeUrl
          }));
        }

        // Fetch Document Types
        const docRes = await apiClient.get('/master/document-types');
        if (docRes.data) {
          setDocumentTypes(docRes.data);
        }

        // Fetch Products
        const prodRes = await apiClient.get('/master/products');
        if (prodRes.data) {
          setProducts(prodRes.data);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        toast.error('Failed to load settings from server');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  // Image Upload to Base64 (Logo, Signature, Stamp)
  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        [fieldName]: reader.result
      }));
      const label = fieldName === 'companyLogo' ? 'Company Logo' : fieldName === 'digitalSignature' ? 'Digital Signature' : 'Company Stamp';
      toast.success(`${label} loaded! Click 'Save Settings' to save.`);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = (fieldName) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: ''
    }));
    toast.info('Image removed. Click Save Settings to apply.');
  };

  // Dynamic Terms & Conditions Handlers
  const handleTermChange = (index, value) => {
    setFormData(prev => {
      const updated = [...prev.termsAndConditions];
      updated[index] = value;
      return { ...prev, termsAndConditions: updated };
    });
  };

  const handleAddTerm = () => {
    setFormData(prev => ({
      ...prev,
      termsAndConditions: [...prev.termsAndConditions, '']
    }));
  };

  const handleRemoveTerm = (index) => {
    setFormData(prev => ({
      ...prev,
      termsAndConditions: prev.termsAndConditions.filter((_, i) => i !== index)
    }));
  };

  // Dynamic Why Choose Us Handlers
  const handleWhyChooseChange = (index, value) => {
    setFormData(prev => {
      const updated = [...prev.whyChooseUs];
      updated[index] = value;
      return { ...prev, whyChooseUs: updated };
    });
  };

  const handleAddWhyChoose = () => {
    setFormData(prev => ({
      ...prev,
      whyChooseUs: [...prev.whyChooseUs, '']
    }));
  };

  const handleRemoveWhyChoose = (index) => {
    setFormData(prev => ({
      ...prev,
      whyChooseUs: prev.whyChooseUs.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await apiClient.put('/master/settings', formData);
      toast.success(res.data?.message || 'Settings updated successfully!');
      if (res.data?.settings) {
        setFormData(prev => ({ ...prev, ...res.data.settings }));
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDocType = async () => {
    if (!newDocType.trim()) return;
    try {
      setIsAddingDocType(true);
      const res = await apiClient.post('/master/document-types', { name: newDocType.trim() });
      setDocumentTypes([...documentTypes, res.data.docType]);
      setNewDocType('');
      toast.success('Document type added successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add document type');
    } finally {
      setIsAddingDocType(false);
    }
  };

  const handleToggleDocCompulsory = async (id, currentStatus) => {
    try {
      const res = await apiClient.put(`/master/document-types/${id}`, { isRequired: !currentStatus });
      setDocumentTypes(documentTypes.map(doc => doc._id === id ? { ...doc, isRequired: res.data.docType.isRequired } : doc));
      toast.success('Document requirement updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update document type');
    }
  };

  const handleDeleteDocType = async (id) => {
    try {
      await apiClient.delete(`/master/document-types/${id}`);
      setDocumentTypes(documentTypes.filter(d => d._id !== id));
      toast.success('Document type deleted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete document type');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            System & Master Settings
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full">
              Live API
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Global CRM configurations for tax calculation, TAT SLAs, and company info
          </p>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0B3A2C] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#0a2f23] transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving Changes...' : 'Save Settings'}
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl p-16 flex flex-col items-center justify-center shadow-sm border border-gray-100">
          <Loader2 className="w-8 h-8 text-[#0B3A2C] animate-spin mb-3" />
          <p className="text-gray-500 text-sm font-medium">Loading settings from database...</p>
        </div>
      ) : (
        /* Main Container */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row overflow-hidden min-h-[580px]">
          
          {/* Left Sidebar Menu */}
          <div className="w-full md:w-72 border-r border-gray-100 p-6 shrink-0 bg-gray-50/50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
              Configuration Modules
            </p>
            <div className="space-y-1.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                      isActive 
                        ? 'bg-[#0B3A2C] text-white shadow-sm' 
                        : 'text-gray-700 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-200'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    <div>
                      <div className="text-sm font-bold leading-tight">{tab.name}</div>
                      <div className={`text-xs mt-0.5 ${isActive ? 'text-emerald-200' : 'text-gray-400'}`}>
                        {tab.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Status Box */}
            <div className="mt-8 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs mb-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Auto Synchronization
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Changes saved here dynamically adjust Quotations and Operation Task Deadlines across the whole CRM.
              </p>
            </div>
          </div>

          {/* Right Form Content */}
          <div className="flex-1 p-6 md:p-10">
            <form onSubmit={handleSave} className="max-w-2xl space-y-6">

              {/* TAB 1: GENERAL & COMPANY */}
              {activeTab === 'general' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-lg font-bold text-gray-900">Company Profile & Information</h2>
                    <p className="text-sm text-gray-500">
                      These details appear on generated quotations, customer invoices, and email footers.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                    <input 
                      type="text" 
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="e.g. DigiCoders Technologies Pvt Ltd" 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-gray-400" />
                        Contact Email
                      </label>
                      <input 
                        type="email" 
                        name="companyEmail"
                        value={formData.companyEmail}
                        onChange={handleInputChange}
                        placeholder="info@digicoders.com" 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-gray-400" />
                        Phone Number
                      </label>
                      <input 
                        type="text" 
                        name="companyPhone"
                        value={formData.companyPhone}
                        onChange={handleInputChange}
                        placeholder="+91 98765 43210" 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      Office Address
                    </label>
                    <input 
                      type="text" 
                      name="companyAddress"
                      value={formData.companyAddress}
                      onChange={handleInputChange}
                      placeholder="e.g. Aliganj, Lucknow, Uttar Pradesh, 226024" 
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      Default Currency
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all bg-white"
                    >
                      <option value="INR">INR (₹) - Indian Rupee</option>
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                      <option value="AED">AED (د.إ) - UAE Dirham</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TAB: QUOTATION & BRANDING TEMPLATE */}
              {activeTab === 'quotation' && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      Official Quotation Template & Branding Controls
                    </h2>
                    <p className="text-sm text-gray-500">
                      Customize company slogans, quotation terms, value highlights, authorized signatory, and social links.
                    </p>
                  </div>

                  {/* Section 0: Dynamic Company Logo Upload */}
                  <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-200/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
                        <Image className="w-4 h-4 text-emerald-600" />
                        Company Official Logo (Header Branding)
                      </div>
                      {formData.companyLogo && (
                        <button
                          type="button"
                          onClick={() => handleClearImage('companyLogo')}
                          className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Reset to Default
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-white rounded-xl border border-gray-100">
                      {/* Logo Preview */}
                      <div className="w-48 h-20 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center p-2 overflow-hidden shrink-0">
                        {formData.companyLogo ? (
                          <img 
                            src={formData.companyLogo} 
                            alt="Company Logo" 
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-center text-xs text-gray-400 font-medium">
                            <span className="font-bold text-gray-600 block">Default DigiCoders</span>
                            Geometric "D" Badge
                          </div>
                        )}
                      </div>

                      {/* Upload Controls */}
                      <div className="flex-1 space-y-2">
                        <label className="block text-xs font-bold text-gray-800">
                          Upload Custom Logo Image
                        </label>
                        <p className="text-xs text-gray-500">
                          Supports PNG, JPG, SVG, WebP (Transparent PNG recommended, under 5MB).
                        </p>
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm">
                          <Upload className="w-4 h-4" />
                          <span>{formData.companyLogo ? 'Change Company Logo' : 'Upload Logo File'}</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleFileUpload(e, 'companyLogo')} 
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Section 1: Header Branding & Slogan */}
                  <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-200/80 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
                      <Award className="w-4 h-4 text-emerald-600" />
                      Top Header Branding & Subtitle
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Company Slogan (Under Logo)
                        </label>
                        <input
                          type="text"
                          name="companySlogan"
                          value={formData.companySlogan}
                          onChange={handleInputChange}
                          placeholder="BUILD | INNOVATE | GROW"
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Header Green Banner Subtitle
                        </label>
                        <input
                          type="text"
                          name="quotationSubtitle"
                          value={formData.quotationSubtitle}
                          onChange={handleInputChange}
                          placeholder="Software Solutions for a Better Tomorrow"
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Default Prepared By Designation
                        </label>
                        <input
                          type="text"
                          name="defaultDesignation"
                          value={formData.defaultDesignation}
                          onChange={handleInputChange}
                          placeholder="Sales Executive"
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Terms & Conditions */}
                  <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-200/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        Terms & Conditions ({formData.termsAndConditions?.length || 0} Points)
                      </div>
                      <button
                        type="button"
                        onClick={handleAddTerm}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add New Term
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {formData.termsAndConditions?.map((term, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <input
                            type="text"
                            value={term}
                            onChange={(e) => handleTermChange(index, e.target.value)}
                            placeholder={`Term ${index + 1}`}
                            className="flex-1 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveTerm(index)}
                            disabled={formData.termsAndConditions.length <= 1}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30"
                            title="Delete Term"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 3: Why Choose Us */}
                  <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-200/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        Why Choose Us Highlights ({formData.whyChooseUs?.length || 0} Points)
                      </div>
                      <button
                        type="button"
                        onClick={handleAddWhyChoose}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Highlight Point
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {formData.whyChooseUs?.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => handleWhyChooseChange(index, e.target.value)}
                            placeholder={`Why Choose point ${index + 1}`}
                            className="flex-1 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveWhyChoose(index)}
                            disabled={formData.whyChooseUs.length <= 1}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30"
                            title="Delete Point"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 4: Authorized Signatory, Digital Signature & Stamp */}
                  <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-200/80 space-y-5">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Authorized Signatory, Digital Signature & Official Stamp
                    </div>
                    
                    {/* Input Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Signatory Name</label>
                        <input
                          type="text"
                          name="signatoryName"
                          value={formData.signatoryName}
                          onChange={handleInputChange}
                          placeholder="Amit Kumar"
                          className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Signatory Title</label>
                        <input
                          type="text"
                          name="signatoryDesignation"
                          value={formData.signatoryDesignation}
                          onChange={handleInputChange}
                          placeholder="Director"
                          className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Company Label</label>
                        <input
                          type="text"
                          name="signatoryCompany"
                          value={formData.signatoryCompany}
                          onChange={handleInputChange}
                          placeholder="DigiCoders Technologies"
                          className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Stamp City</label>
                        <input
                          type="text"
                          name="stampCity"
                          value={formData.stampCity}
                          onChange={handleInputChange}
                          placeholder="LUCKNOW"
                          className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Dual Uploaders: Digital Signature & Rubber Stamp Seal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      
                      {/* Box A: Digital Signature */}
                      <div className="p-4 bg-white rounded-xl border border-gray-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-emerald-600" />
                            Official Digital Signature
                          </span>
                          {formData.digitalSignature && (
                            <button
                              type="button"
                              onClick={() => handleClearImage('digitalSignature')}
                              className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-0.5 hover:underline"
                            >
                              <Trash2 className="w-3 h-3" /> Reset
                            </button>
                          )}
                        </div>

                        {/* Signature Preview */}
                        <div className="h-20 bg-gray-50 border border-dashed border-gray-300 rounded-lg flex items-center justify-center p-2 overflow-hidden">
                          {formData.digitalSignature ? (
                            <img 
                              src={formData.digitalSignature} 
                              alt="Digital Signature Preview" 
                              className="max-h-full max-w-full object-contain filter contrast-125"
                            />
                          ) : (
                            <div className="text-center">
                              <span className="font-serif italic text-2xl font-black text-gray-800 tracking-wider font-['Brush_Script_MT',_cursive,_sans-serif] block select-none">
                                {formData.signatoryName || 'Amit Kumar'}
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium block">
                                (Auto Cursive Signature Active)
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Upload Button */}
                        <label className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{formData.digitalSignature ? 'Change Signature Image' : 'Upload Signature (PNG / JPG)'}</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleFileUpload(e, 'digitalSignature')} 
                          />
                        </label>
                      </div>

                      {/* Box B: Rubber Stamp Seal */}
                      <div className="p-4 bg-white rounded-xl border border-gray-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                            Official Company Rubber Stamp Seal
                          </span>
                          {formData.companyStamp && (
                            <button
                              type="button"
                              onClick={() => handleClearImage('companyStamp')}
                              className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-0.5 hover:underline"
                            >
                              <Trash2 className="w-3 h-3" /> Reset
                            </button>
                          )}
                        </div>

                        {/* Stamp Preview */}
                        <div className="h-20 bg-gray-50 border border-dashed border-gray-300 rounded-lg flex items-center justify-center p-2 overflow-hidden">
                          {formData.companyStamp ? (
                            <img 
                              src={formData.companyStamp} 
                              alt="Stamp Preview" 
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full border-2 border-dashed border-blue-900/60 p-0.5 flex items-center justify-center rotate-[-6deg] select-none shrink-0">
                              <div className="w-full h-full rounded-full border border-blue-900/80 flex flex-col items-center justify-center text-blue-900 text-[6px] font-black uppercase text-center leading-none">
                                <span>★ {formData.companyName?.split(' ')[0]?.toUpperCase() || 'DIGICODERS'} ★</span>
                                <span className="font-extrabold text-[9px] my-0.5">D</span>
                                <span className="text-[5px] tracking-widest">{formData.stampCity?.toUpperCase() || 'LUCKNOW'}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Upload Button */}
                        <label className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{formData.companyStamp ? 'Change Stamp Image' : 'Upload Stamp Seal (PNG / JPG)'}</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleFileUpload(e, 'companyStamp')} 
                          />
                        </label>
                      </div>

                    </div>
                  </div>

                  {/* Section 5: Thank You Note */}
                  <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-200/80 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
                      <Send className="w-4 h-4 text-emerald-600" />
                      Client Thank You Message
                    </div>
                    <textarea
                      name="thankYouNote"
                      rows="2"
                      value={formData.thankYouNote}
                      onChange={handleInputChange}
                      placeholder="We appreciate the opportunity to work with you..."
                      className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* Section 6: Official Social Media & Website URLs */}
                  <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-200/80 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
                      <Globe className="w-4 h-4 text-emerald-600" />
                      Official Website & Social Media Channels
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Website URL</label>
                        <input
                          type="url"
                          name="websiteUrl"
                          value={formData.websiteUrl}
                          onChange={handleInputChange}
                          placeholder="https://www.digicoders.com"
                          className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">LinkedIn URL</label>
                        <input
                          type="url"
                          name="linkedinUrl"
                          value={formData.linkedinUrl}
                          onChange={handleInputChange}
                          placeholder="https://www.linkedin.com/company/..."
                          className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Instagram URL</label>
                        <input
                          type="url"
                          name="instagramUrl"
                          value={formData.instagramUrl}
                          onChange={handleInputChange}
                          placeholder="https://www.instagram.com/..."
                          className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Facebook URL</label>
                        <input
                          type="url"
                          name="facebookUrl"
                          value={formData.facebookUrl}
                          onChange={handleInputChange}
                          placeholder="https://www.facebook.com/..."
                          className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">YouTube URL</label>
                        <input
                          type="url"
                          name="youtubeUrl"
                          value={formData.youtubeUrl}
                          onChange={handleInputChange}
                          placeholder="https://www.youtube.com/@..."
                          className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}



              {/* TAB 3: TAT & DEADLINES */}
              {activeTab === 'tat' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-lg font-bold text-gray-900">Turn Around Time (TAT) & SLAs</h2>
                    <p className="text-sm text-gray-500">
                      Configure standard operating deadlines and automatic breach triggers.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Lead Approval TAT (in Hours)
                    </label>
                    <div className="relative">
                      <input 
                        type="number" 
                        name="leadApprovalTAT"
                        min="1"
                        max="720"
                        value={formData.leadApprovalTAT}
                        onChange={handleInputChange}
                        placeholder="24" 
                        className="w-full px-4 py-3 pr-16 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-semibold transition-all"
                      />
                      <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-bold text-gray-400 pointer-events-none">
                        Hours
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Target deadline for Sales Managers to review and verify new leads submitted by executives.
                    </p>
                  </div>

                  {/* Warning Notice Box */}
                  <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 leading-relaxed">
                      <span className="font-bold">Automated Breach Notification:</span> If a department employee fails to complete a task within their <span className="font-bold">assigned SLA limit</span>, the system marks the task as <span className="underline font-bold">Overdue / TAT Breached</span> and requires managerial remarks before resolution.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: LEAD DOCUMENTS */}
              {activeTab === 'documents' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-lg font-bold text-gray-900">Lead Document Configurations</h2>
                    <p className="text-sm text-gray-500">
                      Manage which documents are required when creating a new lead.
                    </p>
                  </div>

                  <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-200/80">
                    <label className="block text-sm font-bold text-gray-800 mb-3">
                      Required Documents Master List
                    </label>
                    <div className="flex items-center gap-3 mb-5">
                      <input 
                        type="text" 
                        value={newDocType}
                        onChange={(e) => setNewDocType(e.target.value)}
                        placeholder="e.g. Aadhar Card, Driving License..."
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddDocType()}
                      />
                      <button 
                        onClick={handleAddDocType}
                        disabled={isAddingDocType || !newDocType.trim()}
                        className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Add
                      </button>
                    </div>

                    {documentTypes.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {documentTypes.map(doc => (
                          <div key={doc._id} className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm">
                            <span className="text-sm font-semibold text-gray-700">{doc.name}</span>
                            
                            <div className="flex items-center gap-1 ml-2 pl-3 border-l border-gray-200">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={doc.isRequired || false}
                                  onChange={() => handleToggleDocCompulsory(doc._id, doc.isRequired)}
                                  className="w-3.5 h-3.5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                                />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Compulsory</span>
                              </label>
                            </div>

                            <button 
                              onClick={() => handleDeleteDocType(doc._id)}
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors ml-1"
                              title="Remove"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No document types configured yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: PRODUCTS & SERVICES */}
              {activeTab === 'products' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-lg font-bold text-gray-900">Products & Services Catalogue</h2>
                    <p className="text-sm text-gray-500">Add products/services with price. These will be available to select in Quotation creation.</p>
                  </div>

                  {/* Add New Product Form */}
                  <div className="bg-gray-50/70 p-5 rounded-2xl border border-gray-200/80 space-y-3">
                    <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Add New Product / Service</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Product / Service Name *"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct(p => ({ ...p, name: e.target.value }))}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <input
                        type="number"
                        placeholder="Price (₹) *"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct(p => ({ ...p, price: e.target.value }))}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <input
                        type="text"
                        placeholder="Description (optional)"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct(p => ({ ...p, description: e.target.value }))}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isAddingProduct || !newProduct.name.trim() || !newProduct.price}
                      onClick={async () => {
                        try {
                          setIsAddingProduct(true);
                          const res = await apiClient.post('/master/products', newProduct);
                          setProducts([...products, res.data.product]);
                          setNewProduct({ name: '', price: '', description: '' });
                          toast.success('Product added!');
                        } catch (err) {
                          toast.error(err.response?.data?.message || 'Failed to add product');
                        } finally { setIsAddingProduct(false); }
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold disabled:opacity-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> {isAddingProduct ? 'Adding...' : 'Add Product'}
                    </button>
                  </div>

                  {/* Product List */}
                  {products.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Product Name</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Price (₹)</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Description</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {products.map(prod => (
                            <tr key={prod._id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 font-semibold text-gray-800">{prod.name}</td>
                              <td className="px-4 py-3 text-emerald-700 font-bold">₹{prod.price?.toLocaleString('en-IN')}</td>
                              <td className="px-4 py-3 text-gray-500 text-xs">{prod.description || '—'}</td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await apiClient.delete(`/master/products/${prod._id}`);
                                      setProducts(products.filter(p => p._id !== prod._id));
                                      toast.success('Product deleted');
                                    } catch { toast.error('Failed to delete'); }
                                  }}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-gray-500">No products added yet</p>
                      <p className="text-xs text-gray-400 mt-1">Add your first product/service above</p>
                    </div>
                  )}
                </div>
              )}


              {activeTab === 'system' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-lg font-bold text-gray-900">System Environment & Permissions</h2>
                    <p className="text-sm text-gray-500">
                      Overview of server connection and role-based permissions.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <div className="text-xs font-semibold text-gray-400 uppercase">Server Status</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-sm font-bold text-gray-900">Backend API Online</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Port 5000 / Express Node</div>
                    </div>

                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <div className="text-xs font-semibold text-gray-400 uppercase">Database</div>
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-bold text-gray-900">MongoDB Connected</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">CRM_bussness Database</div>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <div className="text-sm font-bold text-emerald-900 mb-1">
                      Role-Based Access Control (RBAC)
                    </div>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      Only users with the <span className="font-semibold">Super Admin</span> or <span className="font-semibold">update_settings</span> permission have permission to alter these master rules.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Settings are immediately persisted to database upon saving.
                </span>

                <button 
                  type="submit" 
                  disabled={isSaving || isLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#0B3A2C] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-[#0a2f23] transition-colors disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving Changes...' : 'Save Settings'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
