import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Building2, Search, Mail, Phone, User as UserIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import apiClient from '../api/axiosConfig';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]); // For head of department dropdown
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Permissions state
  const [canCreate, setCanCreate] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedDept, setSelectedDept] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    departmentCode: '',
    description: '',
    headOfDepartment: '',
    contactEmail: '',
    contactPhone: '',
    isActive: true
  });

  useEffect(() => {
    const init = async () => {
      try {
        const profileRes = await apiClient.get('/auth/profile');
        const roleName = profileRes.data.user?.role?.name;
        const permissions = profileRes.data.user?.role?.permissions || [];
        
        setUserProfile(profileRes.data.user);
        
        const isAdmin = roleName === 'Admin';
        setCanCreate(isAdmin || permissions.includes('create_department'));
        setCanEdit(isAdmin || permissions.includes('edit_department'));
        setCanDelete(isAdmin || permissions.includes('delete_department'));

        await fetchDepartments();
        // Only fetch users if they might need the add/edit modal
        if (isAdmin || permissions.includes('create_department') || permissions.includes('edit_department')) {
          await fetchUsers();
        }
      } catch (err) {
        console.error("Auth init error:", err);
      }
    };
    init();
  }, []);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/master/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load departments');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Need users for the Head of Department dropdown
      const res = await apiClient.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      name: '',
      departmentCode: '',
      description: '',
      headOfDepartment: '',
      contactEmail: '',
      contactPhone: '',
      isActive: true
    });
    setSelectedDept(null);
    setIsModalOpen(true);
  };

  const openEditModal = (dept) => {
    setModalMode('edit');
    setSelectedDept(dept);
    setFormData({
      name: dept.name || '',
      departmentCode: dept.departmentCode || '',
      description: dept.description || '',
      headOfDepartment: dept.headOfDepartment?._id || dept.headOfDepartment || '',
      contactEmail: dept.contactEmail || '',
      contactPhone: dept.contactPhone || '',
      isActive: dept.isActive !== undefined ? dept.isActive : true
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await apiClient.post('/master/departments', formData);
        toast.success('Department created successfully');
      } else {
        await apiClient.put(`/master/departments/${selectedDept._id}`, formData);
        toast.success('Department updated successfully');
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error saving department');
    }
  };

  const handleDelete = async (dept) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you really want to delete the '${dept.name}' department?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await apiClient.delete(`/master/departments/${dept._id}`);
        Swal.fire('Deleted!', 'Department has been deleted successfully.', 'success');
        fetchDepartments();
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Error deleting department');
      }
    }
  };

  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = dept.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          dept.departmentCode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // If user has any management permission, they see all. Otherwise, they only see their own department.
    const hasAnyPermission = canCreate || canEdit || canDelete;
    
    // userProfile.department could be an object if populated, or string (ID or Name).
    const userDept = typeof userProfile?.department === 'object' ? userProfile?.department?._id || userProfile?.department?.name : userProfile?.department;
    
    // If user has no department assigned, they see nothing (unless they have permission).
    const isOwnDepartment = userDept && (userDept === dept._id || userDept === dept.name);
    
    const matchesPermission = hasAnyPermission || isOwnDepartment;

    return matchesSearch && matchesPermission;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage company departments and structural units.</p>
        </div>
        {canCreate && (
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#0B3A2C] text-white rounded-lg text-sm font-medium hover:bg-[#0a2f23] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Department
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search departments..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
           <div className="col-span-full text-center py-8 text-gray-500">Loading departments...</div>
        ) : filteredDepartments.length === 0 ? (
           <div className="col-span-full text-center py-8 text-gray-500">No departments found</div>
        ) : (
          filteredDepartments.map(dept => (
            <div key={dept._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 line-clamp-1">{dept.name}</h3>
                    <p className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded inline-block mt-1">
                      {dept.departmentCode || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  {canEdit && (
                    <button onClick={() => openEditModal(dept)} className="p-1.5 text-gray-400 hover:text-[#0B3A2C] hover:bg-emerald-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => handleDelete(dept)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mt-2 flex-1 text-sm text-gray-600">
                <p className="line-clamp-2 mb-4">{dept.description || 'No description provided.'}</p>
                
                <div className="space-y-2 text-xs">
                  {dept.headOfDepartment && (
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                      <span>{dept.headOfDepartment?.name || 'Assigned Head'}</span>
                    </div>
                  )}
                  {dept.contactEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{dept.contactEmail}</span>
                    </div>
                  )}
                  {dept.contactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>{dept.contactPhone}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${dept.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {dept.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                {modalMode === 'add' ? 'Add New Department' : 'Edit Department'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
              <div className="space-y-5">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department Name *</label>
                    <input 
                      type="text" name="name"
                      value={formData.name} onChange={handleInputChange}
                      placeholder="e.g. Sales" required
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department Code</label>
                    <input 
                      type="text" name="departmentCode"
                      value={formData.departmentCode} onChange={handleInputChange}
                      placeholder="e.g. DPT-SLS"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm uppercase" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea 
                    name="description" rows="3"
                    value={formData.description} onChange={handleInputChange}
                    placeholder="Brief description of the department's role..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm resize-none" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Head of Department</label>
                  <select
                    name="headOfDepartment"
                    value={formData.headOfDepartment} onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                  >
                    <option value="">-- Select a User --</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>{user.name} ({user.email})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                    <input 
                      type="email" name="contactEmail"
                      value={formData.contactEmail} onChange={handleInputChange}
                      placeholder="sales@company.com"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                    <input 
                      type="text" name="contactPhone"
                      value={formData.contactPhone} onChange={handleInputChange}
                      placeholder="+91 9876543210"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm" 
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" id="isActive" name="isActive"
                    checked={formData.isActive} onChange={handleInputChange}
                    className="w-4 h-4 text-[#0B3A2C] rounded border-gray-300 focus:ring-[#0B3A2C]"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Department is Active
                  </label>
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
                  {modalMode === 'add' ? 'Create Department' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;
