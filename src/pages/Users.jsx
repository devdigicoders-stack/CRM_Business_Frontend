import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Shield, UserX, UserCheck, Key, User, Mail, Briefcase, Camera, Eye, Phone, MapPin, Building, Hash 
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../api/axiosConfig';
import { getUsers, createUser, editUser, deleteUser, toggleUserStatus, changeUserPassword } from '../api/authApi';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasAccess, setHasAccess] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [hasManageUsers, setHasManageUsers] = useState(false);
  const [hasCreateUser, setHasCreateUser] = useState(false);
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  
  const [selectedUser, setSelectedUser] = useState(null);
  
  const fileInputRef = useRef(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    phone: '',
    department: '',
    employeeId: '',
    company: '',
    location: '',
    reportingManager: ''
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const init = async () => {
      try {
        const profileRes = await apiClient.get('/auth/profile');
        const roleName = profileRes.data.user?.role?.name;
        const permissions = profileRes.data.user?.role?.permissions || [];
        setCurrentUserRole(roleName);
        setHasManageUsers(roleName === 'Admin' || permissions.includes('manage_employees'));
        setHasCreateUser(roleName === 'Admin' || permissions.includes('create_user'));

        if (roleName !== 'Admin' && !permissions.includes('manage_employees')) {
           setHasAccess(false);
           setIsLoading(false);
           return;
        }

        await fetchUsers();
        
        // Roles and Departments are only needed for Add/Edit dropdowns
        if (roleName === 'Admin' || permissions.includes('manage_employees')) {
          await fetchRoles();
          await fetchDepartments();
        }
      } catch (err) {
         console.error(err);
         setHasAccess(false);
         setIsLoading(false);
      }
    };
    init();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await apiClient.get('/master/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error("Failed to fetch departments", err);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await apiClient.get('/roles');
      setRoles(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load roles');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ 
      name: '', email: '', password: '', role: '', 
      phone: '', department: '', employeeId: '', company: '', location: '', reportingManager: '' 
    });
    setProfileImageFile(null);
    setProfileImagePreview(null);
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role ? user.role._id : '',
      password: '', // Password not required for edit
      phone: user.phone || '',
      department: user.department || '',
      employeeId: user.employeeId || '',
      company: user.company || '',
      location: user.location || '',
      reportingManager: user.reportingManager ? user.reportingManager._id : ''
    });
    setProfileImageFile(null);
    setProfileImagePreview(user.profileImage ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${user.profileImage}` : null);
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImageFile(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setIsPasswordModalOpen(true);
  };

  const openViewModal = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('role', formData.role);
      submitData.append('phone', formData.phone);
      submitData.append('department', formData.department);
      submitData.append('employeeId', formData.employeeId);
      submitData.append('company', formData.company);
      submitData.append('location', formData.location);
      submitData.append('reportingManager', formData.reportingManager);
      
      if (modalMode === 'add') submitData.append('password', formData.password);
      if (profileImageFile) submitData.append('profileImage', profileImageFile);

      if (modalMode === 'add') {
        await createUser(submitData);
        toast.success('User created successfully');
      } else {
        await editUser(selectedUser._id, submitData);
        toast.success('User updated successfully');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error saving user');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    try {
      await changeUserPassword(selectedUser._id, passwordData.newPassword);
      toast.success('Password changed successfully');
      setIsPasswordModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error changing password');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(id);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || 'Error deleting user');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await toggleUserStatus(id);
      toast.success(res.message || 'User status updated');
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error updating status');
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
        <p className="text-gray-500 mt-2">You do not have permission to view the Users page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage team members, roles, and access.</p>
        </div>
        {hasCreateUser && (
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#0B3A2C] text-white rounded-lg text-sm font-medium hover:bg-[#0a2f23] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add New User
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-medium">User Details</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Work Info</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Reporting Head</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No users found</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                          {user.profileImage ? (
                            <img src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${user.profileImage}`} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user.name ? user.name.substring(0, 2).toUpperCase() : 'U'
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-gray-700 text-sm">{user.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-medium text-sm">{user.department || 'N/A'}</span>
                        <span className="text-gray-500 text-xs">ID: {user.employeeId || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        <Shield className="w-3 h-3" />
                        {user.role ? user.role.name : 'No Role'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.reportingManager ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#0B3A2C]/10 flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-bold text-[#0B3A2C]">
                              {user.reportingManager.name?.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-800 whitespace-nowrap">{user.reportingManager.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">— No Manager —</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleStatus(user._id)}
                        disabled={!hasManageUsers}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          user.isActive 
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                        } ${!hasManageUsers ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {user.isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                        {user.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openViewModal(user)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View User Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {hasManageUsers && (
                          <>
                            <button 
                              onClick={() => openPasswordModal(user)}
                              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Change Password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => openEditModal(user)}
                              className="p-1.5 text-gray-400 hover:text-[#0B3A2C] hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Edit User"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(user._id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete User"
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

      {/* Add/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-none w-full max-w-3xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {modalMode === 'add' ? 'Add New User' : 'Edit User'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              
              {/* Profile Image Section */}
              <div className="flex flex-col items-center mb-6">
                 <div className="relative">
                    <img 
                      src={profileImagePreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=f3f4f6&color=374151&size=100`} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover" 
                    />
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-[#0B3A2C] text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:bg-[#0a2f23] transition-colors cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Upload Profile Photo</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="pl-10 w-full px-3 py-2 border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm" 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="pl-10 w-full px-3 py-2 border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm" 
                    />
                  </div>
                </div>

                {modalMode === 'add' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key className="h-4 w-4 text-gray-400" />
                      </div>
                      <input 
                        type="password" 
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required={modalMode === 'add'}
                        className="pl-10 w-full px-3 py-2 border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm" 
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                    </div>
                    <select 
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                      className="pl-10 w-full px-3 py-2 border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm appearance-none bg-white"
                    >
                      <option value="">Select a role</option>
                      {roles.map(r => (
                        <option key={r._id} value={r._id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    className="w-full px-3 py-2 border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select 
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm appearance-none bg-white"
                  >
                    <option value="">Select a department</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Manager</label>
                  <select 
                    name="reportingManager"
                    value={formData.reportingManager}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm appearance-none bg-white"
                  >
                    <option value="">Select a Manager (Optional)</option>
                    {users.map(u => (
                      <option key={u._id} value={u._id}>{u.name} ({u.role?.name || 'User'})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                  <input 
                    type="text" 
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    placeholder="e.g. EMP001"
                    className="w-full px-3 py-2 border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input 
                    type="text" 
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Company Name"
                    className="w-full px-3 py-2 border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm" 
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input 
                    type="text" 
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="City, Country"
                    className="w-full px-3 py-2 border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm" 
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-none text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#0B3A2C] text-white rounded-none text-sm font-medium shadow-sm hover:bg-[#0a2f23] transition-colors"
                >
                  {modalMode === 'add' ? 'Create User' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">
                Reset Password
              </h2>
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  Set a new password for <span className="font-semibold text-gray-900">{selectedUser?.name}</span>.
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-4 w-4 text-gray-400" />
                  </div>
                  <input 
                    type="password" 
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                    className="pl-10 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-4 w-4 text-gray-400" />
                  </div>
                  <input 
                    type="password" 
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    className="pl-10 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm" 
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-amber-700 transition-colors"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {isViewModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-none w-full max-w-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                User Details
              </h2>
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-8">
              <div className="flex flex-col sm:flex-row gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-full border-4 border-gray-50 shadow-sm overflow-hidden bg-gray-100 flex items-center justify-center">
                    {selectedUser.profileImage ? (
                      <img src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${selectedUser.profileImage}`} alt={selectedUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-bold text-gray-400">
                        {selectedUser.name ? selectedUser.name.substring(0, 2).toUpperCase() : 'U'}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      selectedUser.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedUser.isActive ? 'Active User' : 'Inactive User'}
                    </span>
                  </div>
                </div>

                <div className="flex-1 w-full space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h3>
                    <p className="text-emerald-600 font-medium flex items-center gap-1.5 mt-1">
                      <Shield className="w-4 h-4" /> {selectedUser.role ? selectedUser.role.name : 'No Role'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm text-gray-600">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{selectedUser.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{selectedUser.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span>{selectedUser.department || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Hash className="w-4 h-4 text-gray-400" />
                      <span>ID: {selectedUser.employeeId || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span>{selectedUser.company || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{selectedUser.location || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-gray-100 text-xs text-gray-400">
                    Joined Date: {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50/50 p-4 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="px-6 py-2 bg-white border border-gray-200 rounded-none text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
