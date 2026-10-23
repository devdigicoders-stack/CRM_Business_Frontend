import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Key, Eye, Shield, Phone, Mail, MapPin, Building, Calendar, CheckCircle2, XCircle, RefreshCw, Lock, Trash2
} from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import apiClient from '../api/axiosConfig';
import { getCustomers, changeUserPassword } from '../api/authApi';
import { getFileUrl } from '../utils/fileUrl';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);

  // Modals state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const profileRes = await apiClient.get('/auth/profile');
        const roleName = profileRes.data.user?.role?.name || '';
        setCurrentUserRole(roleName);
        
        // Customers are not allowed to view the customer directory
        if (roleName === 'Customer') {
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        const superAdminCheck = roleName === 'Admin' || roleName === 'Super Admin';
        setIsSuperAdmin(superAdminCheck);

        await fetchCustomers();
      } catch (err) {
        console.error('Error fetching user profile in Customers page:', err);
        setHasAccess(false);
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await getCustomers();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      toast.error(err.response?.data?.message || 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  const openViewModal = (customer) => {
    setSelectedCustomer(customer);
    setIsViewModalOpen(true);
  };

  const openPasswordModal = (customer) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can change customer passwords.');
      return;
    }
    setSelectedCustomer(customer);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setIsPasswordModalOpen(true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      toast.error('Action not permitted: Super Admin access required.');
      return;
    }

    if (!passwordData.newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setIsSubmittingPassword(true);
      await changeUserPassword(selectedCustomer._id, passwordData.newPassword);
      toast.success(`Password updated successfully for ${selectedCustomer.name}`);
      setIsPasswordModalOpen(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Error changing password:', err);
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Filter customers based on search term
  const handleDeleteCustomer = async (customer) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can delete customers.');
      return;
    }

    const result = await Swal.fire({
      title: 'Delete Customer?',
      text: `Are you sure you want to delete customer "${customer.name}" (${customer.email})? This user account will be permanently deleted.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete customer',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await apiClient.delete(`/auth/customers/${customer._id}`);
        toast.success('Customer deleted successfully');
        fetchCustomers();
      } catch (err) {
        console.error('Error deleting customer:', err);
        toast.error(err.response?.data?.message || 'Failed to delete customer');
      }
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.phone && c.phone.toLowerCase().includes(term)) ||
      (c.company && c.company.toLowerCase().includes(term)) ||
      (c.location && c.location.toLowerCase().includes(term))
    );
  });

  const totalActive = customers.filter(c => c.isActive !== false).length;

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
        <p className="text-gray-500 mt-2">You do not have permission to view the Customers page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              {customers.length} Total
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Directory of all registered customers and client accounts.
          </p>
        </div>

        <button 
          onClick={fetchCustomers}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Customers</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{customers.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-50 text-green-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Accounts</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalActive}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Password Control</p>
            <p className="text-xs font-semibold text-gray-800 mt-1">
              {isSuperAdmin ? 'Super Admin Mode (Active)' : 'Super Admin Only (Restricted)'}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search customers by name, email, phone, company..." 
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
          Showing <span className="font-bold text-gray-900">{filteredCustomers.length}</span> of {customers.length} Customers
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-medium">Customer Details</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Company / Location</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Joined Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                      <span>Loading customers...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-gray-300" />
                      <p className="font-medium text-gray-600">No customers found</p>
                      {searchTerm && (
                        <p className="text-xs text-gray-400">
                          Try adjusting your search term: "{searchTerm}"
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Customer Details */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0B3A2C]/10 text-[#0B3A2C] flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden border border-[#0B3A2C]/15">
                          {customer.profileImage ? (
                            <img 
                              src={getFileUrl(customer.profileImage)} 
                              alt={customer.name} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            customer.name ? customer.name.substring(0, 2).toUpperCase() : 'CU'
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{customer.name}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-700 text-sm">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{customer.phone || 'N/A'}</span>
                      </div>
                    </td>

                    {/* Company / Location */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-medium text-sm flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-gray-400" />
                          {customer.company || 'Direct Customer'}
                        </span>
                        {customer.location && (
                          <span className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {customer.location}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        customer.isActive !== false 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {customer.isActive !== false ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-red-600" />
                            Inactive
                          </>
                        )}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Customer Details */}
                        <button 
                          onClick={() => openViewModal(customer)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Change Password (Super Admin Only) */}
                        {isSuperAdmin && (
                          <>
                            <button 
                              onClick={() => openPasswordModal(customer)}
                              className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Change Password (Super Admin Only)"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteCustomer(customer)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Customer (Super Admin Only)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Customer Details Modal */}
      {isViewModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-[#0B3A2C] text-white">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-300" />
                <h2 className="text-lg font-bold">Customer Details</h2>
              </div>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-300 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header profile info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#0B3A2C]/10 text-[#0B3A2C] flex items-center justify-center font-bold text-xl overflow-hidden border-2 border-emerald-500/20">
                  {selectedCustomer.profileImage ? (
                    <img 
                      src={getFileUrl(selectedCustomer.profileImage)} 
                      alt={selectedCustomer.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    selectedCustomer.name ? selectedCustomer.name.substring(0, 2).toUpperCase() : 'CU'
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedCustomer.name}</h3>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Customer Account
                  </span>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm">
                <div>
                  <span className="text-xs text-gray-400 font-medium block">Email Address</span>
                  <span className="font-semibold text-gray-800 break-all">{selectedCustomer.email || 'N/A'}</span>
                </div>

                <div>
                  <span className="text-xs text-gray-400 font-medium block">Phone Number</span>
                  <span className="font-semibold text-gray-800">{selectedCustomer.phone || 'N/A'}</span>
                </div>

                <div>
                  <span className="text-xs text-gray-400 font-medium block">Company</span>
                  <span className="font-semibold text-gray-800">{selectedCustomer.company || 'Direct Customer'}</span>
                </div>

                <div>
                  <span className="text-xs text-gray-400 font-medium block">Location</span>
                  <span className="font-semibold text-gray-800">{selectedCustomer.location || 'N/A'}</span>
                </div>

                <div>
                  <span className="text-xs text-gray-400 font-medium block">Account Status</span>
                  <span className={`inline-flex items-center gap-1 font-semibold text-xs mt-1 ${
                    selectedCustomer.isActive !== false ? 'text-emerald-700' : 'text-red-600'
                  }`}>
                    {selectedCustomer.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-gray-400 font-medium block">Joined On</span>
                  <span className="font-semibold text-gray-800">
                    {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    }) : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Password Action (Super Admin Only) */}
              {isSuperAdmin && (
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Need to reset customer's credentials?</span>
                  <button 
                    onClick={() => {
                      setIsViewModalOpen(false);
                      openPasswordModal(selectedCustomer);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors shadow-sm"
                  >
                    <Key className="w-3.5 h-3.5" /> Change Password
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal (Super Admin Only) */}
      {isPasswordModalOpen && selectedCustomer && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-amber-500 text-white">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold">Change Customer Password</h2>
              </div>
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200/60 rounded-lg p-3 text-xs text-amber-800">
                You are updating the login password for customer: <strong className="font-bold">{selectedCustomer.name}</strong> ({selectedCustomer.email}).
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input 
                  type="password" 
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input 
                  type="password" 
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-sm"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmittingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
