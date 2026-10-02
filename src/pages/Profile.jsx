import React, { useState, useEffect, useRef } from 'react';
import { getProfile, editProfile, changePassword } from '../api/authApi';
import { toast } from 'react-toastify';
import { 
  Camera, Mail, Phone, MapPin, Briefcase, User, Calendar, 
  Settings, Bell, Shield, Activity, Edit3, ChevronRight,
  Lock, Eye, EyeOff, CheckCircle2, Check
} from 'lucide-react';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('Personal Information');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  
  // Profile State
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    employeeId: '',
    company: '',
    location: '',
    role: '',
    profileImage: '',
    createdAt: ''
  });

  // Password State
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const token = localStorage.getItem('token'); // Assuming token is stored in localStorage

  // Fetch Profile on Mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!token) {
      toast.error('Not authenticated');
      return;
    }
    try {
      setIsLoading(true);
      const data = await getProfile();
      const user = data.user;
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        employeeId: user.employeeId || '',
        company: user.company || '',
        location: user.location || '',
        role: user.role?.name || 'User',
        profileImage: user.profileImage || '',
        createdAt: user.createdAt || ''
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImageFile(file);
      const imageUrl = URL.createObjectURL(file);
      setProfileData(prev => ({ ...prev, profileImagePreview: imageUrl }));
    }
  };

  // Save Profile Changes
  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('email', profileData.email);
      formData.append('phone', profileData.phone);
      formData.append('department', profileData.department);
      formData.append('employeeId', profileData.employeeId);
      formData.append('company', profileData.company);
      formData.append('location', profileData.location);
      
      if (profileImageFile) {
        formData.append('profileImage', profileImageFile);
      }

      const data = await editProfile(formData);
      toast.success(data.message || 'Profile updated successfully!');
      setIsEditing(false);
      setProfileImageFile(null);
      fetchProfile();
      // Optional: Refresh token or user object in context if needed
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Change Password
  const updatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match!");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    try {
      setIsSaving(true);
      const data = await changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      toast.success(data.message || 'Password changed successfully!');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setActiveTab('Personal Information');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error changing password');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to get initials if no image
  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  const profileImageUrl = profileData.profileImagePreview 
    ? profileData.profileImagePreview
    : (profileData.profileImage 
      ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${profileData.profileImage}` 
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || 'User')}&background=f3f4f6&color=374151&size=150`);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading Profile...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {activeTab === 'Change Password' ? 'Change Password' : 'My Profile'}
          </h1>
          <p className="text-[11px] sm:text-sm text-gray-500 mt-1">
            {activeTab === 'Change Password' 
              ? 'Update your password to keep your account secure.' 
              : 'Manage your account information, profile details and preferences.'}
          </p>
        </div>
        <div className="flex items-center text-xs sm:text-sm text-gray-500 gap-1.5 sm:gap-2 flex-wrap">
          <span className="hover:text-gray-700 cursor-pointer">Dashboard</span>
          <ChevronRight className="w-4 h-4" />
          <span 
            className={`${activeTab === 'Personal Information' ? 'text-gray-900 font-medium' : 'hover:text-gray-700 cursor-pointer'}`}
            onClick={() => setActiveTab('Personal Information')}
          >
            Profile
          </span>
          {activeTab === 'Change Password' && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 font-medium">Change Password</span>
            </>
          )}
        </div>
      </div>

      {activeTab === 'Personal Information' ? (
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left Column - Profile Summary */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <img 
                    src={profileImageUrl} 
                    alt="Profile" 
                    className="w-28 h-28 rounded-full border-4 border-white shadow-md object-cover" 
                  />
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <button 
                    onClick={() => fileInputRef.current.click()}
                    className="absolute bottom-1 right-1 w-8 h-8 bg-[#0B3A2C] text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:bg-[#0a2f23] transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <h2 className="mt-4 text-xl font-bold text-gray-900">{profileData.name || 'No Name'}</h2>
                <span className="mt-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold">
                  {profileData.role}
                </span>
                <p className="mt-4 text-sm text-gray-500 leading-relaxed">
                  Passionate about building products and managing teams to create better customer experiences.
                </p>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{profileData.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{profileData.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{profileData.location || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span>{profileData.company || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{profileData.role}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Member since {profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              
              {/* Tabs */}
              <div className="flex flex-col sm:flex-row gap-2 p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50">
                <button 
                  onClick={() => setActiveTab('Personal Information')}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto ${activeTab === 'Personal Information' ? 'bg-[#0B3A2C] text-white shadow-sm' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
                >
                  <User className="w-4 h-4" /> Personal Information
                </button>
                <button 
                  onClick={() => setActiveTab('Change Password')}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto ${activeTab === 'Change Password' ? 'bg-[#0B3A2C] text-white shadow-sm' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
                >
                  <Lock className="w-4 h-4" /> Change Password
                </button>
              </div>

              {/* Content Area */}
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Update your personal details and contact information.</p>
                  </div>
                  {!isEditing && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-[#0B3A2C] text-white rounded-lg text-sm font-medium shadow-sm hover:bg-[#0a2f23] transition-colors w-full sm:w-auto shrink-0"
                    >
                      <Edit3 className="w-4 h-4" /> Edit Profile
                    </button>
                  )}
                </div>

                <form className="space-y-6" onSubmit={saveProfile}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Row 1 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <input 
                          type="text" 
                          name="name"
                          value={profileData.name}
                          onChange={handleProfileChange}
                          disabled={!isEditing}
                          className={`pl-10 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`} 
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
                          value={profileData.email}
                          onChange={handleProfileChange}
                          disabled={!isEditing}
                          className={`pl-10 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`} 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-gray-400" />
                        </div>
                        <input 
                          type="text" 
                          name="phone"
                          value={profileData.phone}
                          onChange={handleProfileChange}
                          disabled={!isEditing}
                          className={`pl-10 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`} 
                        />
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <input 
                          type="text"
                          value={profileData.role}
                          disabled
                          className="pl-10 w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Briefcase className="h-4 w-4 text-gray-400" />
                        </div>
                        <input 
                          type="text"
                          name="department"
                          value={profileData.department}
                          onChange={handleProfileChange}
                          disabled
                          placeholder="e.g. Sales, IT"
                          className="pl-10 w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <input 
                          type="text" 
                          name="employeeId"
                          value={profileData.employeeId}
                          onChange={handleProfileChange}
                          disabled
                          placeholder="e.g. EMP001"
                          className="pl-10 w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed" 
                        />
                      </div>
                    </div>

                    {/* Row 3 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Briefcase className="h-4 w-4 text-gray-400" />
                        </div>
                        <input 
                          type="text" 
                          name="company"
                          value={profileData.company}
                          onChange={handleProfileChange}
                          disabled
                          placeholder="Company Name"
                          className="pl-10 w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPin className="h-4 w-4 text-gray-400" />
                        </div>
                        <input 
                          type="text" 
                          name="location"
                          value={profileData.location}
                          onChange={handleProfileChange}
                          disabled
                          placeholder="City, Country"
                          className="pl-10 w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed" 
                        />
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="pt-6 border-t border-gray-100 flex justify-end gap-3 mt-6">
                      <button 
                        type="button" 
                        onClick={() => { setIsEditing(false); fetchProfile(); }}
                        className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={isSaving}
                        className="px-5 py-2.5 bg-[#0B3A2C] text-white rounded-lg text-sm font-medium shadow-sm hover:bg-[#0a2f23] transition-colors disabled:opacity-70 flex items-center gap-2"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* Change Password Layout */
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left Column - Security Info */}
          <div className="w-full lg:w-96 shrink-0">
            <div className="bg-[#eefcf5] rounded-2xl shadow-sm border border-emerald-100 p-8 h-full">
              <img 
                src="/image copy.png" 
                alt="Secure Account" 
                className="w-full h-48 object-contain mb-8 drop-shadow-md"
              />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Keep Your Account Secure</h3>
              <p className="text-sm text-gray-600 mb-8 leading-relaxed">
                Use a strong password that you don't use anywhere else. A secure password helps protect your account.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 font-medium">Use at least 8 characters</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 font-medium">Include a mix of letters, numbers and symbols</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 font-medium">Avoid using personal information</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Password Form */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            
            {/* Tabs for easy navigation */}
            <div className="flex flex-wrap gap-2 p-5 border-b border-gray-100 bg-gray-50/50">
              <button 
                onClick={() => setActiveTab('Personal Information')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'Personal Information' ? 'bg-[#0B3A2C] text-white shadow-sm' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
              >
                <User className="w-4 h-4" /> Personal Information
              </button>
              <button 
                onClick={() => setActiveTab('Change Password')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'Change Password' ? 'bg-[#0B3A2C] text-white shadow-sm' : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
              >
                <Lock className="w-4 h-4" /> Change Password
              </button>
            </div>

            <form className="p-8" onSubmit={updatePassword}>
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Change Password</h3>
                <p className="text-sm text-gray-500">Enter your current password and choose a new one.</p>
              </div>

            <div className="flex flex-col xl:flex-row gap-10">
              <div className="flex-1 space-y-6">
                
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Current Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                      type={showCurrentPassword ? "text" : "password"} 
                      name="oldPassword"
                      value={passwordData.oldPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Enter current password" 
                      className="pl-11 pr-11 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                      type={showNewPassword ? "text" : "password"} 
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Enter new password" 
                      className="pl-11 pr-11 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {/* Password Strength */}
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500 font-medium">Password Strength</span>
                    </div>
                    <div className="flex gap-1.5 h-1.5">
                      <div className={`flex-1 rounded-full ${passwordData.newPassword.length > 0 ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
                      <div className={`flex-1 rounded-full ${passwordData.newPassword.length >= 4 ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
                      <div className={`flex-1 rounded-full ${passwordData.newPassword.length >= 8 ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
                      <div className={`flex-1 rounded-full ${passwordData.newPassword.match(/[!@#$%^&*(),.?":{}|<>]/) ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
                      <div className={`flex-1 rounded-full ${passwordData.newPassword.match(/[A-Z]/) && passwordData.newPassword.match(/[0-9]/) ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
                    </div>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder="Confirm new password" 
                      className="pl-11 pr-11 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {passwordData.confirmPassword && passwordData.confirmPassword !== passwordData.newPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
                  )}
                </div>

              </div>

              {/* Requirements Box */}
              <div className="w-full xl:w-80 shrink-0 mt-6 xl:mt-0">
                <div className="bg-[#f0fdf4] rounded-2xl p-6 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-bold text-gray-900">Password Requirements</h4>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${passwordData.newPassword.length >= 8 ? 'border-emerald-500 text-emerald-500' : 'border-gray-300 text-transparent'}`}>
                        <Check className="w-3 h-3" />
                      </div>
                      At least 8 characters long
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${/[A-Z]/.test(passwordData.newPassword) ? 'border-emerald-500 text-emerald-500' : 'border-gray-300 text-transparent'}`}>
                        <Check className="w-3 h-3" />
                      </div>
                      Include uppercase letter (A-Z)
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${/[a-z]/.test(passwordData.newPassword) ? 'border-emerald-500 text-emerald-500' : 'border-gray-300 text-transparent'}`}>
                        <Check className="w-3 h-3" />
                      </div>
                      Include lowercase letter (a-z)
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${/[0-9]/.test(passwordData.newPassword) ? 'border-emerald-500 text-emerald-500' : 'border-gray-300 text-transparent'}`}>
                        <Check className="w-3 h-3" />
                      </div>
                      Include a number (0-9)
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword) ? 'border-emerald-500 text-emerald-500' : 'border-gray-300 text-transparent'}`}>
                        <Check className="w-3 h-3" />
                      </div>
                      Include a special character (!@#$%)
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-8 flex justify-end gap-3 mt-8 border-t border-gray-100">
              <button 
                type="button" 
                onClick={() => {
                  setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                  setActiveTab('Personal Information');
                }}
                className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSaving}
                className="px-6 py-2.5 bg-[#0B3A2C] text-white rounded-xl text-sm font-medium shadow-sm hover:bg-[#0a2f23] transition-colors flex items-center gap-2 disabled:opacity-70"
              >
                <Lock className="w-4 h-4" /> {isSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
            </form>
          </div>
          
        </div>
      )}
    </div>
  );
};

export default Profile;
