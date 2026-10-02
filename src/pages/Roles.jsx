import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Shield, Search, Key } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import apiClient from '../api/axiosConfig';

const PERMISSION_GROUPS = {
  'User Management': ['create_user', 'manage_employees', 'edit_user', 'delete_user', 'add_incentive'],
  'Role Management': ['create_role', 'view_roles', 'edit_role', 'delete_role'],
  'Lead Management': ['create_lead', 'view_leads', 'manage_leads', 'convert_lead', 'upload_documents', 'verify_documents', 'view_closed_won'],
  'Sales & Operations': ['create_quotation', 'view_quotations', 'manage_quotations', 'create_project', 'view_projects', 'manage_project_workflow', 'create_task', 'add_task_remark', 'initialize_payment', 'view_payments', 'add_transaction'],
  'Master Data': ['manage_products', 'create_department', 'edit_department', 'delete_department'],
  'System & Reports': ['update_settings', 'manage_settings', 'view_dashboard_stats', 'view_dashboard_alerts', 'view_calendar', 'manage_expenses']
};

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedRole, setSelectedRole] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    permissions: []
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/roles');
      setRoles(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, name: e.target.value }));
  };

  const handlePermissionChange = (perm) => {
    setFormData(prev => {
      if (prev.permissions.includes(perm)) {
        return { ...prev, permissions: prev.permissions.filter(p => p !== perm) };
      } else {
        return { ...prev, permissions: [...prev.permissions, perm] };
      }
    });
  };

  const handleGroupSelect = (groupName, isChecked) => {
    const groupPerms = PERMISSION_GROUPS[groupName];
    setFormData(prev => {
      let newPerms = [...prev.permissions];
      if (isChecked) {
        groupPerms.forEach(p => {
          if (!newPerms.includes(p)) newPerms.push(p);
        });
      } else {
        newPerms = newPerms.filter(p => !groupPerms.includes(p));
      }
      return { ...prev, permissions: newPerms };
    });
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ name: '', permissions: [] });
    setSelectedRole(null);
    setIsModalOpen(true);
  };

  const openEditModal = (role) => {
    if (role.name === 'Admin') {
      toast.warning('Super Admin role cannot be edited');
      return;
    }
    setModalMode('edit');
    setSelectedRole(role);
    setFormData({
      name: role.name || '',
      permissions: role.permissions || []
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Role name is required');
      return;
    }
    try {
      if (modalMode === 'add') {
        await apiClient.post('/roles/create', formData);
        toast.success('Role created successfully');
      } else {
        await apiClient.put(`/roles/${selectedRole._id}`, formData);
        toast.success('Role updated successfully');
      }
      setIsModalOpen(false);
      fetchRoles();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error saving role');
    }
  };

  const handleDelete = async (role) => {
    if (role.name === 'Admin') {
      toast.error('Super Admin role cannot be deleted');
      return;
    }
    
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you really want to delete the '${role.name}' role?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await apiClient.delete(`/roles/${role._id}`);
        Swal.fire({
          title: 'Deleted!',
          text: 'Role has been deleted successfully.',
          icon: 'success',
          confirmButtonColor: '#0B3A2C'
        });
        fetchRoles();
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Error deleting role');
      }
    }
  };

  const filteredRoles = roles.filter(role => 
    role.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-sm text-gray-500 mt-1">Manage system roles and their access permissions.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#0B3A2C] text-white rounded-lg text-sm font-medium hover:bg-[#0a2f23] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add New Role
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search roles..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
           <div className="col-span-full text-center py-8 text-gray-500">Loading roles...</div>
        ) : filteredRoles.length === 0 ? (
           <div className="col-span-full text-center py-8 text-gray-500">No roles found</div>
        ) : (
          filteredRoles.map(role => (
            <div key={role._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{role.name}</h3>
                    <p className="text-xs text-gray-500">
                      {role.name === 'Admin' ? 'All Permissions' : `${role.permissions?.length || 0} Permissions`}
                    </p>
                  </div>
                </div>
                {role.name !== 'Admin' && (
                  <div className="flex gap-2">
                    <button onClick={() => openEditModal(role)} className="p-1.5 text-gray-400 hover:text-[#0B3A2C] hover:bg-emerald-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(role)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-2 flex-1">
                {role.name === 'Admin' ? (
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-md">
                      Full System Access
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {role.permissions?.slice(0, 5).map(p => (
                      <span key={p} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                        {p.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {role.permissions?.length > 5 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                        +{role.permissions.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {modalMode === 'add' ? 'Add New Role' : 'Edit Role'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Sales Manager"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                    {Object.entries(PERMISSION_GROUPS).map(([groupName, perms]) => {
                      const isAllSelected = perms.every(p => formData.permissions.includes(p));
                      
                      return (
                        <div key={groupName} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                            <h4 className="font-semibold text-gray-800 text-sm">{groupName}</h4>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={(e) => handleGroupSelect(groupName, e.target.checked)}
                                className="w-4 h-4 text-[#0B3A2C] rounded border-gray-300 focus:ring-[#0B3A2C]"
                              />
                              <span className="text-xs font-medium text-gray-600">Select All</span>
                            </label>
                          </div>
                          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white">
                            {perms.map(perm => (
                              <label key={perm} className="flex items-center gap-3 p-2 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <input 
                                  type="checkbox" 
                                  checked={formData.permissions.includes(perm)}
                                  onChange={() => handlePermissionChange(perm)}
                                  className="w-4 h-4 text-[#0B3A2C] rounded border-gray-300 focus:ring-[#0B3A2C]"
                                />
                                <span className="text-sm font-medium text-gray-700 capitalize">
                                  {perm.replace(/_/g, ' ')}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-8 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#0B3A2C] text-white rounded-lg text-sm font-medium shadow-sm hover:bg-[#0a2f23] transition-colors"
                >
                  {modalMode === 'add' ? 'Create Role' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;
