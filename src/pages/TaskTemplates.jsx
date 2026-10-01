import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, List, FileText, Search, Clock, PlusCircle, X } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import apiClient from '../api/axiosConfig';

const TaskTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [canManage, setCanManage] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  
  const [formData, setFormData] = useState({
    _id: '',
    stepNumber: '',
    taskName: '',
    department: '',
    description: '',
    tatHours: 24,
    opsHeadReminderHours: 24,
    requiredDocuments: [] // array of strings
  });
  
  const [newDoc, setNewDoc] = useState('');

  useEffect(() => {
    fetchData();
    checkPermissions();
  }, []);

  const checkPermissions = () => {
    // Unconditionally allow managing Task Templates for now to fix UI bug
    setCanManage(true);
    const user = JSON.parse(localStorage.getItem('user'));
    setUserProfile(user);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [templateRes, deptRes] = await Promise.all([
        apiClient.get('/master/task-templates'),
        apiClient.get('/master/departments')
      ]);
      setTemplates(templateRes.data);
      setDepartments(deptRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDoc = () => {
    if (newDoc.trim()) {
      setFormData({
        ...formData,
        requiredDocuments: [...formData.requiredDocuments, newDoc.trim()]
      });
      setNewDoc('');
    }
  };

  const handleRemoveDoc = (index) => {
    const updatedDocs = [...formData.requiredDocuments];
    updatedDocs.splice(index, 1);
    setFormData({ ...formData, requiredDocuments: updatedDocs });
  };

  const handleOpenModal = (mode, template = null) => {
    setModalMode(mode);
    if (mode === 'edit' && template) {
      setFormData({
        _id: template._id,
        stepNumber: template.stepNumber,
        taskName: template.taskName,
        department: template.department?._id || '',
        description: template.description || '',
        tatHours: template.tatHours || 24,
        opsHeadReminderHours: template.opsHeadReminderHours || 24,
        requiredDocuments: template.requiredDocuments || []
      });
    } else {
      setFormData({
        _id: '',
        stepNumber: templates.length + 1,
        taskName: '',
        department: '',
        description: '',
        tatHours: 24,
        opsHeadReminderHours: 24,
        requiredDocuments: []
      });
      setNewDoc('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.department) {
      return toast.error('Please select a department');
    }

    const payload = {
      stepNumber: Number(formData.stepNumber),
      taskName: formData.taskName,
      department: formData.department,
      description: formData.description,
      tatHours: Number(formData.tatHours),
      opsHeadReminderHours: Number(formData.opsHeadReminderHours),
      requiredDocuments: formData.requiredDocuments
    };

    try {
      if (modalMode === 'add') {
        await apiClient.post('/master/task-templates', payload);
        toast.success('Task template created successfully');
      } else {
        await apiClient.put(`/master/task-templates/${formData._id}`, payload);
        toast.success('Task template updated successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save template');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will remove the template from future projects.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await apiClient.delete(`/master/task-templates/${id}`);
        toast.success('Template deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete template');
      }
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <List className="h-6 w-6 text-[#0B3A2C]" />
            Task Workflow Templates
          </h1>
          <p className="text-gray-500 text-sm mt-1">Define the standard task sequence for converted leads.</p>
        </div>
        
        {canManage && (
          <button
            onClick={() => handleOpenModal('add')}
            className="flex items-center gap-2 bg-[#0B3A2C] text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all shadow-sm"
          >
            <Plus className="h-5 w-5" />
            Add Template Step
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B3A2C] transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Step</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Task Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Department</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">TAT (Hours)</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Docs Required</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#0B3A2C] border-t-transparent"></div>
                      Loading templates...
                    </div>
                  </td>
                </tr>
              ) : filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No templates found matching your search.
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((template) => (
                  <tr key={template._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[#0B3A2C]/10 text-[#0B3A2C] font-bold">
                        {template.stepNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{template.taskName}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {template.department?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-orange-500" />
                        {template.tatHours}h
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {template.requiredDocuments?.length > 0 ? (
                          template.requiredDocuments.map((doc, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs border border-gray-200">
                              {doc}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canManage && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal('edit', template)}
                            className="p-2 text-gray-400 hover:text-[#0B3A2C] hover:bg-[#0B3A2C]/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(template._id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {modalMode === 'add' ? 'Add Task Template' : 'Edit Task Template'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="templateForm" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Step Number *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.stepNumber}
                      onChange={(e) => setFormData({ ...formData, stepNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B3A2C] focus:ring-1 focus:ring-[#0B3A2C]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TAT Deadline (Hours) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={formData.tatHours}
                      onChange={(e) => setFormData({ ...formData, tatHours: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B3A2C] focus:ring-1 focus:ring-[#0B3A2C]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ops Head Reminder (Hours)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={formData.opsHeadReminderHours}
                      onChange={(e) => setFormData({ ...formData, opsHeadReminderHours: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B3A2C] focus:ring-1 focus:ring-[#0B3A2C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.taskName}
                    onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B3A2C] focus:ring-1 focus:ring-[#0B3A2C]"
                    placeholder="e.g. Logo Design"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Department *</label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B3A2C] focus:ring-1 focus:ring-[#0B3A2C]"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description / Instructions</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B3A2C] focus:ring-1 focus:ring-[#0B3A2C] resize-none"
                    placeholder="Task details and instructions..."
                  ></textarea>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Required Documents to Upload (Checklist)</label>
                  
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newDoc}
                      onChange={(e) => setNewDoc(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDoc())}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B3A2C]"
                      placeholder="e.g. PSD Source File"
                    />
                    <button
                      type="button"
                      onClick={handleAddDoc}
                      className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1"
                    >
                      <PlusCircle className="h-4 w-4" /> Add
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {formData.requiredDocuments.length === 0 ? (
                      <span className="text-sm text-gray-400">No documents required.</span>
                    ) : (
                      formData.requiredDocuments.map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-700 shadow-sm">
                          <FileText className="h-3.5 w-3.5 text-gray-400" />
                          {doc}
                          <button 
                            type="button" 
                            onClick={() => handleRemoveDoc(idx)}
                            className="ml-1 text-gray-400 hover:text-red-500 focus:outline-none"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="templateForm"
                className="px-5 py-2 bg-[#0B3A2C] text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium shadow-sm"
              >
                {modalMode === 'add' ? 'Create Template' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTemplates;
