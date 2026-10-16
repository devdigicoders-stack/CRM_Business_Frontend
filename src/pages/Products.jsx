import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  DollarSign, 
  Package, 
  X, 
  Check, 
  Search, 
  Boxes, 
  Layers, 
  Sparkles, 
  Eye, 
  Info,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../api/axiosConfig';

// Quick template presets for solar kits
const SOLAR_KIT_TEMPLATES = [
  {
    title: '3kW On-Grid Kit',
    name: '3kW Single Phase On-Grid Rooftop Solar Kit',
    capacity: '3kW',
    phase: 'Single Phase',
    price: 155000,
    basePrice: 125000,
    gstPercentage: 12,
    description: 'Complete 3kW solar power solution designed for residential rooftop installations. Includes premium Mono PERC panels, grid-tie inverter, ACDB, DCDB, earthing kit & lightning protection.',
    kitComponents: [
      { name: 'Mono PERC Solar Panels (540W)', quantity: 6, unit: 'Nos', specification: '540W-595W Tier-1' },
      { name: 'Grid-Tie Solar Inverter 3kW', quantity: 1, unit: 'Nos', specification: 'Single Phase IP65 WiFi' },
      { name: 'ACDB Distribution Box', quantity: 1, unit: 'Nos', specification: 'Single Phase SPD + MCB' },
      { name: 'DCDB Distribution Box', quantity: 1, unit: 'Nos', specification: '1 IN 1 OUT with Fuse' },
      { name: 'Earthing Rod & Chemical Compound', quantity: 2, unit: 'Sets', specification: 'Copper Bonded + BFC' },
      { name: 'Lightning Protection Arrester', quantity: 1, unit: 'Nos', specification: 'Pure Copper Spike' }
    ]
  },
  {
    title: '5kW On-Grid Kit',
    name: '5kW Single Phase On-Grid Rooftop Solar Kit',
    capacity: '5kW',
    phase: 'Single Phase',
    price: 245000,
    basePrice: 195000,
    gstPercentage: 12,
    description: 'High efficiency 5kW residential solar kit. Features dual MPPT grid-tie inverter, premium Mono PERC half-cut panels, complete electrical balance of system (BOS) and surge protection.',
    kitComponents: [
      { name: 'Mono PERC Solar Panels (540W)', quantity: 10, unit: 'Nos', specification: '540W-595W Half-Cut' },
      { name: 'Grid-Tie Solar Inverter 5kW', quantity: 1, unit: 'Nos', specification: 'Dual MPPT Single Phase' },
      { name: 'ACDB Distribution Box', quantity: 1, unit: 'Nos', specification: 'Single Phase Heavy Duty' },
      { name: 'DCDB Distribution Box', quantity: 1, unit: 'Nos', specification: '2 IN 2 OUT with Fuses' },
      { name: 'Earthing Rod & Chemical Compound', quantity: 2, unit: 'Sets', specification: 'Copper Bonded + BFC' },
      { name: 'Lightning Protection Arrester', quantity: 1, unit: 'Nos', specification: 'Pure Copper Spike' }
    ]
  },
  {
    title: '10kW 3-Phase Kit',
    name: '10kW Three Phase Commercial Rooftop Solar Kit',
    capacity: '10kW',
    phase: 'Three Phase',
    price: 460000,
    basePrice: 380000,
    gstPercentage: 12,
    description: 'Commercial-grade 10kW three-phase solar kit designed for institutions and commercial rooftops. Includes 18x high-wattage panels, three-phase grid-tie inverter and industrial BOS gear.',
    kitComponents: [
      { name: 'Mono PERC Solar Panels (540W)', quantity: 18, unit: 'Nos', specification: '540W-595W High Output' },
      { name: 'Three-Phase Grid-Tie Inverter 10kW', quantity: 1, unit: 'Nos', specification: 'Three Phase 415V IP65' },
      { name: 'Three-Phase ACDB Box', quantity: 1, unit: 'Nos', specification: '4 Pole MCB + SPD' },
      { name: 'Three-Phase DCDB Box', quantity: 2, unit: 'Nos', specification: '2 IN 2 OUT Surge Protected' },
      { name: 'Chemical Earthing Kit', quantity: 3, unit: 'Sets', specification: 'Heavy Duty Copper Rod' },
      { name: 'Lightning Protection Arrester', quantity: 1, unit: 'Nos', specification: 'Copper Conventional Arrester' }
    ]
  }
];

const Products = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'Product' | 'Service' | 'Kit'

  // Standard Product/Service Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ 
    itemType: 'Product', 
    name: '', 
    basePrice: '', 
    price: '', 
    gstPercentage: 18, 
    description: '' 
  });
  const [isSaving, setIsSaving] = useState(false);

  // Dedicated Kit Modal State
  const [isKitModalOpen, setIsKitModalOpen] = useState(false);
  const [editingKitId, setEditingKitId] = useState(null);
  const [kitFormData, setKitFormData] = useState({
    name: '',
    capacity: '3kW',
    phase: 'Single Phase',
    basePrice: '',
    price: '',
    gstPercentage: 12,
    description: '',
    kitComponents: [
      { name: 'Mono PERC Solar Panels (540W)', quantity: 6, unit: 'Nos', specification: '540W-595W Tier-1' },
      { name: 'Grid-Tie Solar Inverter 3kW', quantity: 1, unit: 'Nos', specification: 'Single Phase IP65' },
      { name: 'ACDB Distribution Box', quantity: 1, unit: 'Nos', specification: 'Single Phase SPD + MCB' },
      { name: 'DCDB Distribution Box', quantity: 1, unit: 'Nos', specification: '1 IN 1 OUT with Fuse' },
      { name: 'Earthing Kit & Chemical', quantity: 2, unit: 'Sets', specification: 'Copper Bonded + Compound' },
      { name: 'Lightning Protection Arrester', quantity: 1, unit: 'Nos', specification: 'Pure Copper Spike' }
    ]
  });

  // Modal to preview kit breakdown
  const [viewingKit, setViewingKit] = useState(null);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/master/products');
      setProducts(res.data || []);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Standard Product Modal Handlers
  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ itemType: 'Product', name: '', basePrice: '', price: '', gstPercentage: 18, description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    if (product.itemType === 'Kit') {
      // Open the dedicated Kit modal for kits
      setEditingKitId(product._id);
      setKitFormData({
        name: product.name,
        capacity: product.capacity || '',
        phase: product.phase || '',
        basePrice: product.basePrice || '',
        price: product.price,
        gstPercentage: product.gstPercentage ?? 12,
        description: product.description || '',
        kitComponents: product.kitComponents && product.kitComponents.length > 0 
          ? product.kitComponents 
          : [{ name: '', quantity: 1, unit: 'Nos', specification: '' }]
      });
      setIsKitModalOpen(true);
      return;
    }

    setEditingProduct(product);
    setFormData({ 
      itemType: product.itemType || 'Product',
      name: product.name, 
      basePrice: product.basePrice || '', 
      price: product.price, 
      gstPercentage: product.gstPercentage ?? 18,
      description: product.description || '' 
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.name.trim() || formData.price === '') {
      toast.error('Name and Price are required');
      return;
    }
    try {
      setIsSaving(true);
      if (editingProduct) {
        const res = await apiClient.put(`/master/products/${editingProduct._id}`, formData);
        setProducts(products.map(p => p._id === editingProduct._id ? res.data.product : p));
        toast.success('Product updated successfully!');
      } else {
        const res = await apiClient.post('/master/products', formData);
        setProducts([...products, res.data.product]);
        toast.success('Product added successfully!');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  // Dedicated Kit Modal Handlers
  const openCreateKitModal = () => {
    setEditingKitId(null);
    // Load default 3kW template
    applyKitTemplate(SOLAR_KIT_TEMPLATES[0]);
    setIsKitModalOpen(true);
  };

  const applyKitTemplate = (tmpl) => {
    setKitFormData({
      name: tmpl.name,
      capacity: tmpl.capacity,
      phase: tmpl.phase,
      basePrice: tmpl.basePrice || '',
      price: tmpl.price || '',
      gstPercentage: tmpl.gstPercentage || 12,
      description: tmpl.description || '',
      kitComponents: tmpl.kitComponents.map(c => ({ ...c }))
    });
    toast.info(`Loaded "${tmpl.title}" template! Customize as needed.`);
  };

  const handleAddKitComponentRow = () => {
    setKitFormData(prev => ({
      ...prev,
      kitComponents: [...prev.kitComponents, { name: '', quantity: 1, unit: 'Nos', specification: '' }]
    }));
  };

  const handleRemoveKitComponentRow = (index) => {
    if (kitFormData.kitComponents.length === 1) return;
    setKitFormData(prev => ({
      ...prev,
      kitComponents: prev.kitComponents.filter((_, idx) => idx !== index)
    }));
  };

  const handleKitComponentChange = (index, field, value) => {
    setKitFormData(prev => {
      const updated = [...prev.kitComponents];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, kitComponents: updated };
    });
  };

  const handleSaveKit = async () => {
    if (!kitFormData.name.trim() || kitFormData.price === '') {
      toast.error('Kit Name and Selling Price are required');
      return;
    }

    const cleanComponents = kitFormData.kitComponents.filter(c => c.name.trim() !== '');
    if (cleanComponents.length === 0) {
      toast.warning('Please add at least one component in this Kit');
      return;
    }

    const payload = {
      ...kitFormData,
      itemType: 'Kit',
      kitComponents: cleanComponents
    };

    try {
      setIsSaving(true);
      if (editingKitId) {
        const res = await apiClient.put(`/master/products/${editingKitId}`, payload);
        setProducts(products.map(p => p._id === editingKitId ? res.data.product : p));
        toast.success('Solar Kit updated successfully!');
      } else {
        const res = await apiClient.post('/master/products', payload);
        setProducts([...products, res.data.product]);
        toast.success('Solar Kit created successfully!');
      }
      setIsKitModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save kit');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await apiClient.delete(`/master/products/${id}`);
      setProducts(products.filter(p => p._id !== id));
      toast.success('Item deleted!');
    } catch {
      toast.error('Failed to delete item');
    }
  };

  // Counts for tabs
  const productCount = products.filter(p => p.itemType === 'Product' || !p.itemType).length;
  const serviceCount = products.filter(p => p.itemType === 'Service').length;
  const kitCount = products.filter(p => p.itemType === 'Kit').length;

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.capacity || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.kitComponents && p.kitComponents.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())));

    if (!matchesSearch) return false;

    if (activeTab === 'Product') return p.itemType === 'Product' || !p.itemType;
    if (activeTab === 'Service') return p.itemType === 'Service';
    if (activeTab === 'Kit') return p.itemType === 'Kit';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 shrink-0" />
            Products & Services
          </h1>
          <p className="text-[11px] sm:text-sm text-gray-500 mt-1">
            Manage your product, service, and Solar Kit catalogue — these appear in Quotation creation.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Create Kit Button */}
          <button
            onClick={openCreateKitModal}
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all hover:scale-[1.01] shrink-0"
            title="Assemble solar panels, inverters and accessories into a package kit"
          >
            <Boxes className="w-4 h-4" />
            <span>Create Solar Kit</span>
          </button>

          {/* Add Product Button */}
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-[#0B3A2C] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:bg-[#0a2f23] transition-all hover:scale-[1.01] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Type Filter Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'all' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Items ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('Kit')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'Kit' 
                ? 'bg-amber-500 text-white shadow-sm' 
                : 'text-amber-800 hover:text-amber-900 bg-amber-50/60'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            Solar Kits ({kitCount})
          </button>
          <button
            onClick={() => setActiveTab('Product')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'Product' 
                ? 'bg-white text-blue-800 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Products ({productCount})
          </button>
          <button
            onClick={() => setActiveTab('Service')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'Service' 
                ? 'bg-white text-purple-800 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Services ({serviceCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products, kits, components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3A2C]/20 focus:border-[#0B3A2C]"
          />
        </div>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <Boxes className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h3 className="text-base font-bold text-gray-500">
            {searchQuery ? 'No matching items found' : 'No items yet'}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {searchQuery ? 'Try a different search keyword' : 'Click "Create Solar Kit" or "Add Product" to get started'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">#</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Type</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product / Kit Name</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Base Price (₹)</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Selling Price (₹)</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">GST (%)</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Kit Inclusions / Details</th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product, idx) => {
                  const isKit = product.itemType === 'Kit';
                  const compCount = product.kitComponents?.length || 0;

                  return (
                    <tr key={product._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4 text-gray-400 font-medium whitespace-nowrap">{idx + 1}</td>
                      
                      {/* Type Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isKit ? (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-800 border border-amber-200/80 inline-flex items-center gap-1">
                            <Boxes className="w-3.5 h-3.5 text-amber-600" />
                            Solar Kit
                          </span>
                        ) : product.itemType === 'Service' ? (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-100 text-purple-700">
                            Service
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-100 text-blue-700">
                            Product
                          </span>
                        )}
                      </td>

                      {/* Name & Capacity */}
                      <td className="px-5 py-4 min-w-[260px]">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isKit ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {isKit ? <Boxes className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 break-words flex items-center gap-2">
                              <span>{product.name}</span>
                              {product.capacity && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                                  {product.capacity}
                                </span>
                              )}
                              {product.phase && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">
                                  {product.phase}
                                </span>
                              )}
                            </div>
                            {isKit && compCount > 0 && (
                              <button
                                type="button"
                                onClick={() => setViewingKit(product)}
                                className="text-[11px] font-semibold text-amber-600 hover:text-amber-800 mt-0.5 flex items-center gap-1"
                              >
                                <span>Includes {compCount} Components (Panels, Inverter, BOS)</span>
                                <Eye className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Base Price */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-500">
                          {product.basePrice ? `₹${Number(product.basePrice).toLocaleString('en-IN')}` : <span className="text-gray-300">—</span>}
                        </span>
                      </td>

                      {/* Selling Price */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-bold text-emerald-700 text-base">
                          ₹{Number(product.price).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* GST */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-bold text-gray-700">{product.gstPercentage ?? 18}%</span>
                      </td>

                      {/* Inclusions / Description */}
                      <td className="px-5 py-4 text-gray-500 text-xs max-w-xs">
                        {isKit && compCount > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {product.kitComponents.slice(0, 3).map((c, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium">
                                {c.quantity}x {c.name.split(' ')[0]}
                              </span>
                            ))}
                            {compCount > 3 && (
                              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-bold">
                                +{compCount - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="truncate block">{product.description || <span className="text-gray-300">—</span>}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isKit && (
                            <button
                              onClick={() => setViewingKit(product)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="View Kit Breakdown"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-400 flex items-center justify-between">
            <span>Total: <strong className="text-gray-700">{filteredProducts.length}</strong> item(s)</span>
            <span className="text-gray-400">Solar Kits: <strong className="text-amber-700">{kitCount}</strong> | Products: <strong className="text-blue-700">{productCount}</strong></span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DEDICATED CREATE / EDIT SOLAR KIT BUILDER MODAL */}
      {/* ======================================================== */}
      {isKitModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] border-t-4 border-amber-500 my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-50/50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-sm">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {editingKitId ? 'Edit Solar Kit / Package' : 'Assemble Solar Kit / Package'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    Combine solar panels, inverters, and BOS accessories into an all-in-one bundle.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsKitModalOpen(false)} 
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Quick Template Presets */}
              {!editingKitId && (
                <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/70">
                  <div className="text-xs font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Quick 1-Click Solar Kit Presets:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SOLAR_KIT_TEMPLATES.map((tmpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => applyKitTemplate(tmpl)}
                        className="px-3 py-1.5 bg-white hover:bg-amber-100/70 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <Boxes className="w-3.5 h-3.5 text-amber-600" />
                        <span>{tmpl.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Kit Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">1. Kit Overview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Kit Name *</label>
                    <input
                      type="text"
                      value={kitFormData.name}
                      onChange={(e) => setKitFormData(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. TATA 3kW Single Phase On-Grid Rooftop Solar Kit"
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">System Capacity</label>
                    <input
                      type="text"
                      value={kitFormData.capacity}
                      onChange={(e) => setKitFormData(f => ({ ...f, capacity: e.target.value }))}
                      placeholder="e.g. 3kW, 5kW, 10kW"
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Phase Type</label>
                    <select
                      value={kitFormData.phase}
                      onChange={(e) => setKitFormData(f => ({ ...f, phase: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                    >
                      <option value="Single Phase">Single Phase</option>
                      <option value="Three Phase">Three Phase</option>
                      <option value="Off-Grid">Off-Grid</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Base Price (Cost) (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={kitFormData.basePrice}
                      onChange={(e) => setKitFormData(f => ({ ...f, basePrice: e.target.value }))}
                      placeholder="e.g. 125000"
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Package Selling Price (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={kitFormData.price}
                      onChange={(e) => setKitFormData(f => ({ ...f, price: e.target.value }))}
                      placeholder="e.g. 155000"
                      className="w-full px-3.5 py-2 border border-amber-300 bg-amber-50/20 rounded-lg text-sm font-bold text-emerald-800 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">GST (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={kitFormData.gstPercentage}
                      onChange={(e) => setKitFormData(f => ({ ...f, gstPercentage: e.target.value }))}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Description / Product Overview</label>
                  <textarea
                    rows={2}
                    value={kitFormData.description}
                    onChange={(e) => setKitFormData(f => ({ ...f, description: e.target.value }))}
                    placeholder="Short summary of this solar kit package..."
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
              </div>

              {/* Kit Components Builder */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-600" />
                      <span>2. Kit Components & Inclusions ({kitFormData.kitComponents.length} items)</span>
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      When this Kit is chosen in a Quotation, these individual items will be added automatically.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddKitComponentRow}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {/* Component Rows */}
                <div className="space-y-2.5">
                  {kitFormData.kitComponents.map((comp, idx) => (
                    <div 
                      key={idx} 
                      className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center bg-gray-50 p-2.5 rounded-xl border border-gray-200 hover:border-amber-300 transition-colors"
                    >
                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          value={comp.name}
                          onChange={(e) => handleKitComponentChange(idx, 'name', e.target.value)}
                          placeholder="e.g. Mono PERC Solar Panels"
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="w-full sm:w-24">
                        <input
                          type="number"
                          min="1"
                          required
                          value={comp.quantity}
                          onChange={(e) => handleKitComponentChange(idx, 'quantity', Number(e.target.value))}
                          placeholder="Qty"
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-center focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="w-full sm:w-24">
                        <select
                          value={comp.unit || 'Nos'}
                          onChange={(e) => handleKitComponentChange(idx, 'unit', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                        >
                          <option value="Nos">Nos</option>
                          <option value="Sets">Sets</option>
                          <option value="Mtr">Mtr</option>
                          <option value="Pkt">Pkt</option>
                          <option value="Lot">Lot</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={comp.specification || ''}
                          onChange={(e) => handleKitComponentChange(idx, 'specification', e.target.value)}
                          placeholder="Spec: 540W Tier-1 / 3kW IP65"
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveKitComponentRow(idx)}
                        disabled={kitFormData.kitComponents.length === 1}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 disabled:opacity-30"
                        title="Delete Component"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Package Price: <strong className="text-emerald-700 text-sm">₹{Number(kitFormData.price || 0).toLocaleString('en-IN')}</strong> ({kitFormData.kitComponents.length} items included)
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsKitModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveKit}
                  disabled={isSaving}
                  className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Kit...' : (editingKitId ? 'Update Kit' : 'Save Solar Kit')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PREVIEW KIT BREAKDOWN MODAL */}
      {/* ======================================================== */}
      {viewingKit && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-t-4 border-amber-500">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center gap-2.5">
                <Boxes className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{viewingKit.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {viewingKit.capacity && <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">{viewingKit.capacity}</span>}
                    {viewingKit.phase && <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{viewingKit.phase}</span>}
                    <span className="text-xs font-bold text-emerald-700">₹{Number(viewingKit.price).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setViewingKit(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {viewingKit.description && (
                <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {viewingKit.description}
                </p>
              )}

              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                  Included Components ({viewingKit.kitComponents?.length || 0}):
                </h4>
                <div className="space-y-2">
                  {viewingKit.kitComponents?.map((comp, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                      <div>
                        <div className="font-bold text-gray-800">{comp.name}</div>
                        {comp.specification && (
                          <div className="text-[11px] text-gray-500">{comp.specification}</div>
                        )}
                      </div>
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded-lg text-xs">
                        {comp.quantity} {comp.unit || 'Nos'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setViewingKit(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STANDARD ADD/EDIT PRODUCT MODAL */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type *</label>
                  <select
                    value={formData.itemType}
                    onChange={(e) => setFormData(f => ({ ...f, itemType: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="Product">Product</option>
                    <option value="Service">Service</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Solar Inverter 5kW"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Base Price (₹)</label>
                  <input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => setFormData(f => ({ ...f, basePrice: e.target.value }))}
                    placeholder="e.g. 10000"
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Selling Price (₹) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(f => ({ ...f, price: e.target.value }))}
                    placeholder="e.g. 15000"
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">GST (%) *</label>
                  <input
                    type="number"
                    value={formData.gstPercentage}
                    onChange={(e) => setFormData(f => ({ ...f, gstPercentage: e.target.value }))}
                    placeholder="e.g. 18"
                    min="0"
                    max="100"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                  placeholder="Short description of this product/service..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold disabled:opacity-50 transition-colors"
              >
                <Check className="w-4 h-4" />
                {isSaving ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
