import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Loader2, X, Building2, User, Phone, CheckCircle2, Eye, Trash2, Search, Users, UserPlus, CheckSquare, Square, ClipboardList, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../api/axiosConfig';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const CountdownTimer = ({ dueDate, status, submittedAt, opsHeadReminderHours }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const reviewHours = opsHeadReminderHours || 24; // Use template setting, fallback to 24

  useEffect(() => {
    if (status === 'Completed' || status === 'Approved') {
      setTimeLeft('Stopped');
      return;
    }

    let targetDate = new Date(dueDate);
    if (status === 'Submitted' && submittedAt) {
      targetDate = new Date(new Date(submittedAt).getTime() + (reviewHours * 60 * 60 * 1000));
    }

    const calculateTimeLeft = () => {
      const difference = targetDate - new Date();
      if (difference > 0) {
        const hours = Math.floor((difference / (1000 * 60 * 60)));
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        return `${hours}h ${minutes}m ${seconds}s`;
      }
      return 'Overdue';
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [dueDate, status, submittedAt, reviewHours]);

  if (status === 'Completed' || status === 'Approved') {
    return <span className="text-[10px] font-semibold text-emerald-600">Task {status}</span>;
  }

  const isReviewTimer = status === 'Submitted' && submittedAt;
  const targetDateDisplay = isReviewTimer
    ? new Date(new Date(submittedAt).getTime() + (reviewHours * 60 * 60 * 1000))
    : new Date(dueDate);

  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-gray-500 mb-0.5">
        {isReviewTimer ? 'Ops Head Review By:' : ''} <br/> {targetDateDisplay.toLocaleString()}
      </span>
      <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-block w-max mt-0.5 ${timeLeft === 'Overdue' ? 'bg-red-50 text-red-600 border border-red-100' : (isReviewTimer ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100')}`}>
        {isReviewTimer ? '🔍' : '⏰'} {timeLeft}
      </span>
    </div>
  );
};

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [leads, setLeads] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [viewProjectModal, setViewProjectModal] = useState({ isOpen: false, project: null });
    const [approveModal, setApproveModal] = useState({ isOpen: false, task: null });
    const [assignModal, setAssignModal] = useState({ isOpen: false, taskId: null, projectId: null });
    const [assigneeId, setAssigneeId] = useState('');
    const [projectDocuments, setProjectDocuments] = useState([]);
    const [selectedReferenceDocs, setSelectedReferenceDocs] = useState([]);
    const [users, setUsers] = useState([]);
    
    // Multi-task assignment states
    const [multiAssignModal, setMultiAssignModal] = useState({ isOpen: false, project: null });
    const [multiAssignments, setMultiAssignments] = useState({}); // { taskId: userId }
    const [isSavingMultiAssign, setIsSavingMultiAssign] = useState(false);
    const [quickAssigneeAll, setQuickAssigneeAll] = useState('');

    // Checkbox bulk assign state inside viewProjectModal
    const [selectedProjectTaskIds, setSelectedProjectTaskIds] = useState([]);
    const [bulkAssignModal, setBulkAssignModal] = useState(false);
    const [bulkAssigneeId, setBulkAssigneeId] = useState('');

    // Assign Project state
    const [assignProjectModal, setAssignProjectModal] = useState({ isOpen: false, project: null });
    const [projectAssigneeId, setProjectAssigneeId] = useState('');
    const [isSavingProjectAssign, setIsSavingProjectAssign] = useState(false);
    
    const [approveStatus, setApproveStatus] = useState('Approved');
    const [approveRemark, setApproveRemark] = useState('');
    
    const [userProfile, setUserProfile] = useState(null);
    const [permissions, setPermissions] = useState([]);
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    
    const [formData, setFormData] = useState({
        leadId: '',
        customerName: '',
        quotationId: '',
        remarks: '',
        selectedTemplateIds: []
    });

    const [taskTemplates, setTaskTemplates] = useState([]);
    const [departments, setDepartments] = useState([]);

    // Select Template Tasks Modal
    const [isSelectTasksModalOpen, setIsSelectTasksModalOpen] = useState(false);
    const [projectSelectedTemplateIds, setProjectSelectedTemplateIds] = useState([]);
    const [isSavingSelectedTasks, setIsSavingSelectedTasks] = useState(false);

    // Add Custom Task Modal
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [customTaskData, setCustomTaskData] = useState({
        taskName: '',
        department: '',
        tatHours: 24,
        description: '',
        requiredDocuments: ''
    });
    const [isSavingCustomTask, setIsSavingCustomTask] = useState(false);

    const [equipmentModal, setEquipmentModal] = useState({ isOpen: false, project: null });
    const [equipments, setEquipments] = useState([{ itemName: '', serialNumber: '', quantity: 1 }]);
    const [isSavingEquipments, setIsSavingEquipments] = useState(false);

    const fetchProjects = async () => {
        try {
            setIsLoading(true);
            const res = await apiClient.get('/operations/projects');
            setProjects(res.data || []);
            
            // Fetch tasks to calculate total steps and show in modal
            try {
                const taskRes = await apiClient.get('/operations/tasks');
                setAllTasks(taskRes.data || []);
            } catch(e) { console.error("Error fetching tasks for projects", e); }
            
        } catch (err) {
            console.error('Error fetching projects:', err);
            toast.error(err.response?.data?.message || 'Failed to fetch projects');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchClosedWonLeads = async () => {
        try {
            const res = await apiClient.get('/sales/leads/closed-won/all');
            setLeads(res.data.leads || []);
        } catch (err) {
            console.error('Error fetching closed won leads:', err);
        }
    };

    const checkUser = async () => {
        try {
            const res = await apiClient.get('/auth/profile');
            setUserProfile(res.data.user);
            setPermissions(res.data.user?.role?.permissions || []);
        } catch (err) {
            console.error("Error fetching profile", err);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await apiClient.get('/auth/users?all=true');
            setUsers(res.data || []);
        } catch(e) { console.error("Error fetching users", e); }
    };

    const fetchMasterData = async () => {
        try {
            const [tplRes, deptRes] = await Promise.all([
                apiClient.get('/master/task-templates'),
                apiClient.get('/master/departments')
            ]);
            setTaskTemplates(tplRes.data || []);
            setDepartments(deptRes.data || []);
        } catch (err) {
            console.error("Error fetching task templates or departments:", err);
        }
    };

    useEffect(() => {
        checkUser();
        fetchProjects();
        fetchClosedWonLeads();
        fetchUsers();
        fetchMasterData();
    }, []);

    const isSuperAdmin = userProfile?.role?.name === 'Admin' || userProfile?.role?.name === 'Super Admin';

    const hasPermission = (perm) => {
        if (isSuperAdmin) return true;
        return permissions.includes(perm);
    };

    const handleDeleteProject = async (projectId, customerName) => {
        const result = await Swal.fire({
            title: 'Delete Project?',
            html: `
                <div class="text-left text-sm space-y-2">
                    <p class="text-gray-600">Choose how you want to delete the project for <b>"${customerName}"</b>:</p>
                    <div class="bg-red-50 p-2.5 rounded-lg border border-red-100 text-xs text-red-800">
                        <b>Delete All Data:</b> Permanently removes Project, Tasks, linked Lead, Quotations, and Customer login account.
                    </div>
                    <div class="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs text-gray-700">
                        <b>Project Only:</b> Removes only this project and its tasks, keeps the Lead and Customer account intact.
                    </div>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonColor: '#dc2626',
            denyButtonColor: '#4b5563',
            cancelButtonColor: '#9ca3af',
            confirmButtonText: 'Delete All (Project + Lead + Customer)',
            denyButtonText: 'Delete Project Only',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                await apiClient.delete(`/operations/projects/${projectId}?cascade=true`);
                toast.success('Project, Lead, Quotations & Customer deleted successfully');
                fetchProjects();
            } catch (error) {
                console.error('Error deleting project & data:', error);
                toast.error(error.response?.data?.message || 'Failed to delete project');
            }
        } else if (result.isDenied) {
            try {
                await apiClient.delete(`/operations/projects/${projectId}`);
                toast.success('Project deleted successfully (Lead retained)');
                fetchProjects();
            } catch (error) {
                console.error('Error deleting project:', error);
                toast.error(error.response?.data?.message || 'Failed to delete project');
            }
        }
    };

    const handleApproveSubmit = async (e) => {
        e.preventDefault();
        try {
            const selectedStatus = approveStatus; // capture before state clears
            await apiClient.put(`/operations/tasks/${approveModal.task._id}/approve`, {
                status: selectedStatus,
                remarkText: approveRemark
            });
            if (selectedStatus === 'Rejected') {
                toast.error('Task Rejected! Sent back to employee.');
            } else {
                toast.success('Task Approved successfully!');
            }
            setApproveModal({ isOpen: false, task: null });
            setApproveStatus('Approved'); // Reset for next time
            setApproveRemark('');
            
            // Re-fetch tasks
            const taskRes = await apiClient.get('/operations/tasks');
            setAllTasks(taskRes.data || []);
            fetchProjects();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to process approval');
        }
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.put(`/operations/tasks/${assignModal.taskId}/assign`, {
                assignedTo: assigneeId,
                referenceDocuments: selectedReferenceDocs
            });
            toast.success('Task assigned successfully!');
            setAssignModal({ isOpen: false, taskId: null, projectId: null });
            setSelectedReferenceDocs([]);
            
            // Re-fetch tasks
            const taskRes = await apiClient.get('/operations/tasks');
            setAllTasks(taskRes.data || []);
            fetchProjects();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign task');
        }
    };

    const handleOpenMultiAssignModal = async (project) => {
        try {
            const docRes = await apiClient.get(`/operations/projects/${project._id}/documents`);
            setProjectDocuments(docRes.data || []);
        } catch (err) {
            console.error("Failed to fetch project docs", err);
        }

        const projectTasks = allTasks.filter(t => t.project?._id === project._id);
        const initialMap = {};
        projectTasks.forEach(t => {
            initialMap[t._id] = t.assignedTo?._id || t.assignedTo || '';
        });
        setMultiAssignments(initialMap);
        setQuickAssigneeAll('');
        setSelectedReferenceDocs([]);
        setMultiAssignModal({ isOpen: true, project });
    };

    const handleApplyQuickAssignAll = () => {
        if (!quickAssigneeAll) return;
        const projectTasks = allTasks.filter(t => t.project?._id === multiAssignModal.project?._id && t.status !== 'Completed' && t.status !== 'Approved');
        const updated = { ...multiAssignments };
        projectTasks.forEach(t => {
            updated[t._id] = quickAssigneeAll;
        });
        setMultiAssignments(updated);
        toast.info("Applied employee to all active tasks");
    };

    const handleMultiAssignSubmit = async (e) => {
        e.preventDefault();
        
        // Collect only tasks where an employee has been selected
        const assignments = Object.entries(multiAssignments)
            .filter(([taskId, assignedTo]) => assignedTo && assignedTo.trim() !== '')
            .map(([taskId, assignedTo]) => ({
                taskId,
                assignedTo,
                referenceDocuments: selectedReferenceDocs
            }));

        if (assignments.length === 0) {
            return toast.warning("Please assign at least one task to an employee.");
        }

        try {
            setIsSavingMultiAssign(true);
            const res = await apiClient.put('/operations/tasks/assign-multiple', {
                assignments
            });
            toast.success(res.data.message || 'Tasks assigned successfully!');
            setMultiAssignModal({ isOpen: false, project: null });
            setSelectedReferenceDocs([]);

            const taskRes = await apiClient.get('/operations/tasks');
            setAllTasks(taskRes.data || []);
            fetchProjects();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign tasks');
        } finally {
            setIsSavingMultiAssign(false);
        }
    };

    const handleBulkAssignSubmit = async (e) => {
        e.preventDefault();
        if (!bulkAssigneeId) {
            return toast.warning("Please select an employee.");
        }
        if (selectedProjectTaskIds.length === 0) {
            return toast.warning("No tasks selected.");
        }

        try {
            setIsSavingMultiAssign(true);
            const res = await apiClient.put('/operations/tasks/assign-multiple', {
                taskIds: selectedProjectTaskIds,
                assignedTo: bulkAssigneeId,
                referenceDocuments: selectedReferenceDocs
            });
            toast.success(res.data.message || 'Selected tasks assigned successfully!');
            setBulkAssignModal(false);
            setSelectedProjectTaskIds([]);
            setBulkAssigneeId('');
            setSelectedReferenceDocs([]);

            const taskRes = await apiClient.get('/operations/tasks');
            setAllTasks(taskRes.data || []);
            fetchProjects();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign selected tasks');
        } finally {
            setIsSavingMultiAssign(false);
        }
    };

    const handleViewProject = async (project) => {
        setViewProjectModal({ isOpen: true, project });
        try {
            const taskRes = await apiClient.get('/operations/tasks', { params: { projectId: project._id } });
            if (taskRes.data && Array.isArray(taskRes.data)) {
                setAllTasks(prev => {
                    const otherTasks = prev.filter(t => t.project?._id !== project._id);
                    return [...otherTasks, ...taskRes.data];
                });
            }
        } catch (e) {
            console.error("Error fetching tasks for project", e);
        }
    };

    const handleAssignProjectSubmit = async (e) => {
        e.preventDefault();
        if (!projectAssigneeId) return toast.warning("Please select an employee.");
        try {
            setIsSavingProjectAssign(true);
            const res = await apiClient.put(`/operations/projects/${assignProjectModal.project._id}/assign`, {
                assignedTo: projectAssigneeId
            });
            toast.success(res.data.message || 'Project assigned successfully!');
            setAssignProjectModal({ isOpen: false, project: null });
            setProjectAssigneeId('');
            fetchProjects();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to assign project');
        } finally {
            setIsSavingProjectAssign(false);
        }
    };

    const handleOpenCreateModal = () => {
        setFormData({ 
            leadId: '', 
            customerName: '', 
            quotationId: '', 
            remarks: '',
            selectedTemplateIds: taskTemplates.map(t => t._id)
        });
        setIsCreateModalOpen(true);
    };

    // Open Select Tasks Modal for Project
    const handleOpenSelectTasksModal = (project) => {
        const projectTasks = allTasks.filter(t => t.project?._id === project._id);
        const initialSelectedIds = taskTemplates
            .filter(tpl => projectTasks.some(pt => pt.taskName === tpl.taskName))
            .map(tpl => tpl._id);
        
        setProjectSelectedTemplateIds(initialSelectedIds.length > 0 ? initialSelectedIds : taskTemplates.map(t => t._id));
        setIsSelectTasksModalOpen(true);
    };

    // Save Selected Template Tasks for Project
    const handleSaveSelectedTasks = async () => {
        if (!viewProjectModal.project) return;
        if (projectSelectedTemplateIds.length === 0) {
            return toast.warning("Please select at least one task template.");
        }
        try {
            setIsSavingSelectedTasks(true);
            const res = await apiClient.post(`/operations/projects/${viewProjectModal.project._id}/select-tasks`, {
                selectedTemplateIds: projectSelectedTemplateIds
            });
            toast.success(res.data.message || "Project tasks updated successfully!");
            setIsSelectTasksModalOpen(false);

            // Re-fetch project tasks
            const taskRes = await apiClient.get('/operations/tasks', { params: { projectId: viewProjectModal.project._id } });
            setAllTasks(prev => {
                const otherTasks = prev.filter(t => t.project?._id !== viewProjectModal.project._id);
                return [...otherTasks, ...taskRes.data];
            });
            fetchProjects();
        } catch (err) {
            console.error("Failed to update project tasks:", err);
            toast.error(err.response?.data?.message || "Failed to update project tasks");
        } finally {
            setIsSavingSelectedTasks(false);
        }
    };

    // Add Custom Task to Project
    const handleAddCustomTask = async (e) => {
        e.preventDefault();
        if (!viewProjectModal.project) return;
        if (!customTaskData.taskName.trim()) {
            return toast.warning("Task name is required.");
        }
        if (!customTaskData.department) {
            return toast.warning("Please select a department.");
        }

        try {
            setIsSavingCustomTask(true);
            const reqDocs = customTaskData.requiredDocuments
                ? customTaskData.requiredDocuments.split(',').map(s => s.trim()).filter(Boolean)
                : [];

            const res = await apiClient.post(`/operations/projects/${viewProjectModal.project._id}/tasks`, {
                taskName: customTaskData.taskName.trim(),
                department: customTaskData.department,
                tatHours: Number(customTaskData.tatHours) || 24,
                description: customTaskData.description,
                requiredDocuments: reqDocs
            });

            toast.success(res.data.message || "Custom task added successfully!");
            setIsAddTaskModalOpen(false);
            setCustomTaskData({
                taskName: '',
                department: departments[0]?._id || '',
                tatHours: 24,
                description: '',
                requiredDocuments: ''
            });

            // Re-fetch project tasks
            const taskRes = await apiClient.get('/operations/tasks', { params: { projectId: viewProjectModal.project._id } });
            setAllTasks(prev => {
                const otherTasks = prev.filter(t => t.project?._id !== viewProjectModal.project._id);
                return [...otherTasks, ...taskRes.data];
            });
            fetchProjects();
        } catch (err) {
            console.error("Failed to add custom task:", err);
            toast.error(err.response?.data?.message || "Failed to add custom task");
        } finally {
            setIsSavingCustomTask(false);
        }
    };

    // Delete Task from Project
    const handleDeleteTask = async (taskId, taskName) => {
        const result = await Swal.fire({
            title: 'Remove Task?',
            text: `Are you sure you want to remove "${taskName}" from this project?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, remove task',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                await apiClient.delete(`/operations/tasks/${taskId}`);
                toast.success('Task removed from project');
                
                // Re-fetch project tasks
                const taskRes = await apiClient.get('/operations/tasks', { params: { projectId: viewProjectModal.project._id } });
                setAllTasks(prev => {
                    const otherTasks = prev.filter(t => t.project?._id !== viewProjectModal.project._id);
                    return [...otherTasks, ...taskRes.data];
                });
                fetchProjects();
            } catch (err) {
                console.error("Failed to remove task:", err);
                toast.error(err.response?.data?.message || "Failed to remove task");
            }
        }
    };

    const handleLeadChange = (e) => {
        const leadId = e.target.value;
        const selectedLead = leads.find(l => l._id === leadId);
        setFormData({
            ...formData,
            leadId,
            customerName: selectedLead ? selectedLead.customerName : '',
            quotationId: selectedLead?.quotation || '' // Assuming lead has a quotation reference
        });
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            setIsCreating(true);
            await apiClient.post('/operations/projects', formData);
            toast.success("Project created successfully!");
            setIsCreateModalOpen(false);
            fetchProjects();
        } catch (err) {
            console.error('Error creating project:', err);
            toast.error(err.response?.data?.message || 'Failed to create project');
        } finally {
            setIsCreating(false);
        }
    };

    // Equipment Handlers
    const handleAddEquipmentRow = () => {
        setEquipments([...equipments, { itemName: '', serialNumber: '', quantity: 1 }]);
    };

    const handleRemoveEquipmentRow = (index) => {
        setEquipments(equipments.filter((_, i) => i !== index));
    };

    const handleEquipmentChange = (index, field, value) => {
        const newEq = [...equipments];
        newEq[index][field] = value;
        setEquipments(newEq);
    };

    const handleSaveEquipments = async (e) => {
        e.preventDefault();
        try {
            setIsSavingEquipments(true);
            await apiClient.put(`/operations/projects/${equipmentModal.project._id}/equipment`, { equipments });
            toast.success("Equipments saved successfully!");
            setEquipmentModal({ isOpen: false, project: null });
            fetchProjects();
        } catch (err) {
            console.error('Error saving equipments:', err);
            toast.error(err.response?.data?.message || 'Failed to save equipments');
        } finally {
            setIsSavingEquipments(false);
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                        <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 shrink-0" />
                        <span className="hidden sm:inline">Projects (Operations)</span>
                        <span className="sm:hidden">Projects</span>
                    </h1>
                    <p className="text-[11px] sm:text-sm text-gray-500 mt-1">
                        Manage converted deals and track project execution stages.
                    </p>
                </div>
                {userProfile?.role?.name !== 'Customer' && (
                    <button
                        onClick={handleOpenCreateModal}
                        className="bg-[#0B3A2C] hover:bg-[#124b39] text-white px-3 sm:px-4 py-2 rounded-xl transition-all shadow-sm font-semibold text-sm inline-flex items-center gap-1.5 sm:gap-2 shrink-0"
                    >
                        <Plus className="w-4 h-4 shrink-0" />
                        <span className="hidden sm:inline">Create Project</span>
                        <span className="sm:hidden">Create</span>
                    </button>
                )}
            </div>

            {/* Search Filter */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search projects by customer, phone, ops head, stage..." 
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
                    Showing <span className="font-bold text-gray-900">{projects.filter(p => {
                        if (!searchTerm.trim()) return true;
                        const q = searchTerm.toLowerCase();
                        return (
                            (p.customerName && p.customerName.toLowerCase().includes(q)) ||
                            (p.lead?.contactNumber && p.lead.contactNumber.toLowerCase().includes(q)) ||
                            (p.operationHead?.name && p.operationHead.name.toLowerCase().includes(q)) ||
                            (p.assignedTo?.name && p.assignedTo.name.toLowerCase().includes(q)) ||
                            (p.lead?.createdBy?.name && p.lead.createdBy.name.toLowerCase().includes(q)) ||
                            (p.lead?.assignedTo?.name && p.lead.assignedTo.name.toLowerCase().includes(q)) ||
                            (p.workflowStage && p.workflowStage.toLowerCase().includes(q)) ||
                            (p.status && p.status.toLowerCase().includes(q))
                        );
                    }).length}</span> of {projects.length} Projects
                </div>
            </div>

            <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-16 flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 text-[#0B3A2C] animate-spin mb-3" />
                        <p className="text-gray-500 text-sm font-medium">Loading projects...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <Briefcase className="w-8 h-8" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">No Projects Found</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
                            Create a new project from a closed won lead to get started.
                        </p>
                    </div>
                ) : projects.filter(p => {
                    if (!searchTerm.trim()) return true;
                    const q = searchTerm.toLowerCase();
                    return (
                        (p.customerName && p.customerName.toLowerCase().includes(q)) ||
                        (p.lead?.contactNumber && p.lead.contactNumber.toLowerCase().includes(q)) ||
                        (p.operationHead?.name && p.operationHead.name.toLowerCase().includes(q)) ||
                        (p.assignedTo?.name && p.assignedTo.name.toLowerCase().includes(q)) ||
                        (p.lead?.createdBy?.name && p.lead.createdBy.name.toLowerCase().includes(q)) ||
                        (p.lead?.assignedTo?.name && p.lead.assignedTo.name.toLowerCase().includes(q)) ||
                        (p.workflowStage && p.workflowStage.toLowerCase().includes(q)) ||
                        (p.status && p.status.toLowerCase().includes(q))
                    );
                }).length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <Search className="w-8 h-8" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">No Matching Projects</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
                            No projects match your search "{searchTerm}".
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-400 uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="py-3.5 px-4">Customer</th>
                                    <th className="py-3.5 px-4">Assignee / Ops Head</th>
                                    <th className="py-3.5 px-4">Workflow Stage</th>
                                    <th className="py-3.5 px-4">Total Price</th>
                                    <th className="py-3.5 px-4">Amount Paid</th>
                                    <th className="py-3.5 px-4">Step</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {projects.filter(p => {
                                    if (!searchTerm.trim()) return true;
                                    const q = searchTerm.toLowerCase();
                                    return (
                                        (p.customerName && p.customerName.toLowerCase().includes(q)) ||
                                        (p.lead?.contactNumber && p.lead.contactNumber.toLowerCase().includes(q)) ||
                                        (p.operationHead?.name && p.operationHead.name.toLowerCase().includes(q)) ||
                                        (p.assignedTo?.name && p.assignedTo.name.toLowerCase().includes(q)) ||
                                        (p.lead?.createdBy?.name && p.lead.createdBy.name.toLowerCase().includes(q)) ||
                                        (p.lead?.assignedTo?.name && p.lead.assignedTo.name.toLowerCase().includes(q)) ||
                                        (p.workflowStage && p.workflowStage.toLowerCase().includes(q)) ||
                                        (p.status && p.status.toLowerCase().includes(q))
                                    );
                                }).map(project => {
                                    const projectTasks = allTasks.filter(t => t.project?._id === project._id);
                                    const totalSteps = projectTasks.length;
                                    
                                    return (
                                    <tr key={project._id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-gray-900">{project.customerName}</div>
                                            {project.lead?.contactNumber && (
                                                <div className="text-[11px] text-gray-500 mt-0.5 font-medium flex items-center gap-1">
                                                    <Phone className="w-3 h-3" /> {project.lead.contactNumber}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5 text-gray-800 font-medium">
                                                    <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                    <span className="truncate max-w-[130px]">{project.assignedTo?.name || project.operationHead?.name || 'Unassigned'}</span>
                                                    {hasPermission('manage_project_workflow') && (
                                                        <button
                                                            onClick={() => {
                                                                setProjectAssigneeId(project.assignedTo?._id || project.operationHead?._id || '');
                                                                setAssignProjectModal({ isOpen: true, project });
                                                            }}
                                                            className="text-[10px] text-blue-600 hover:text-blue-800 font-bold ml-1 hover:underline"
                                                            title="Assign or change assignee"
                                                        >
                                                            Assign
                                                        </button>
                                                    )}
                                                </div>
                                                {(project.lead?.createdBy?.name || project.lead?.assignedTo?.name) && (
                                                    <span className="text-[10px] text-gray-500 pl-5">
                                                        Lead: {project.lead?.assignedTo?.name || project.lead?.createdBy?.name}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-gray-600 font-medium">
                                            {project.workflowStage}
                                        </td>
                                        <td className="py-3.5 px-4 font-bold text-gray-900">
                                            ₹{project.paymentData?.totalAmount?.toLocaleString('en-IN') || '0'}
                                        </td>
                                        <td className="py-3.5 px-4 font-bold text-green-600">
                                            ₹{project.paymentData?.paidAmount?.toLocaleString('en-IN') || '0'}
                                        </td>
                                        <td className="py-3.5 px-4 font-bold text-gray-900">
                                            {project.currentStep} / {totalSteps || '?'}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                                project.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                                project.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                'bg-gray-50 text-gray-700 border-gray-200'
                                            } border`}>
                                                {project.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                                <button
                                                    onClick={() => handleViewProject(project)}
                                                    className="px-3 py-1.5 bg-[#0B3A2C]/10 text-[#0B3A2C] hover:bg-[#0B3A2C] hover:text-white text-[10px] font-bold rounded transition-colors"
                                                >
                                                    Tasks
                                                </button>
                                                

                                                
                                                {project.status === 'Completed' && (
                                                    <Link
                                                        to={`/dashboard/projects/${project._id}/receipt`}
                                                        target="_blank"
                                                        className="px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white text-[10px] font-bold rounded transition-colors inline-flex items-center"
                                                    >
                                                        Receipt
                                                    </Link>
                                                )}

                                                {/* Super Admin Delete Project (Only for incomplete projects) */}
                                                {isSuperAdmin && project.status !== 'Completed' && project.workflowStage !== 'Completed' && (
                                                    <button
                                                        onClick={() => handleDeleteProject(project._id, project.customerName)}
                                                        className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white text-[10px] font-bold rounded transition-colors inline-flex items-center gap-1"
                                                        title="Delete Project (Super Admin Only)"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Project Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-none shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Create New Project</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Start operations for a Closed Won deal.</p>
                            </div>
                            <button 
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleCreateProject} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Select Converted Lead *</label>
                                    <select 
                                        required
                                        value={formData.leadId}
                                        onChange={handleLeadChange}
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3A2C]/20 focus:border-[#0B3A2C] transition-all"
                                    >
                                        <option value="">-- Select Closed Won Lead --</option>
                                        {leads.map(lead => (
                                            <option key={lead._id} value={lead._id}>
                                                {lead.customerName} {lead.companyName ? `(${lead.companyName})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Customer Name *</label>
                                    <input 
                                        type="text" 
                                        required
                                        readOnly
                                        value={formData.customerName}
                                        className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-600 cursor-not-allowed"
                                        placeholder="Auto-filled from lead"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Remarks (Optional)</label>
                                    <textarea 
                                        value={formData.remarks}
                                        onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3A2C]/20 focus:border-[#0B3A2C] transition-all"
                                        placeholder="Add any initial notes for the operations team..."
                                        rows="2"
                                    ></textarea>
                                </div>

                                {/* Task Template Selection for this Project */}
                                {taskTemplates.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Select Tasks to Include ({formData.selectedTemplateIds?.length || 0}/{taskTemplates.length})
                                            </label>
                                            <div className="flex gap-2 text-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, selectedTemplateIds: taskTemplates.map(t => t._id) })}
                                                    className="text-[#0B3A2C] font-semibold hover:underline"
                                                >
                                                    Select All
                                                </button>
                                                <span className="text-gray-300">|</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, selectedTemplateIds: [] })}
                                                    className="text-gray-500 font-semibold hover:underline"
                                                >
                                                    Clear All
                                                </button>
                                            </div>
                                        </div>
                                        <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-gray-50/50 space-y-1">
                                            {taskTemplates.map((t) => {
                                                const isChecked = formData.selectedTemplateIds?.includes(t._id);
                                                return (
                                                    <label key={t._id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded-lg cursor-pointer text-xs text-gray-700">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setFormData({ ...formData, selectedTemplateIds: [...(formData.selectedTemplateIds || []), t._id] });
                                                                } else {
                                                                    setFormData({ ...formData, selectedTemplateIds: (formData.selectedTemplateIds || []).filter(id => id !== t._id) });
                                                                }
                                                            }}
                                                            className="rounded text-[#0B3A2C] focus:ring-[#0B3A2C]"
                                                        />
                                                        <span className="font-medium text-gray-800">{t.taskName}</span>
                                                        <span className="text-[10px] text-gray-400">({t.tatHours}h)</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                                    <button 
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-none transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={isCreating || !formData.leadId}
                                        className="px-4 py-2 text-sm font-semibold text-white bg-[#0B3A2C] hover:bg-[#124b39] disabled:opacity-50 disabled:cursor-not-allowed rounded-none transition-all shadow-sm flex items-center gap-2"
                                    >
                                        {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        {isCreating ? 'Creating...' : 'Create Project'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* View Project Tasks Modal */}
            {viewProjectModal.isOpen && viewProjectModal.project && (() => {
                const projectTasksList = allTasks.filter(t => t.project?._id === viewProjectModal.project._id);
                const assignableTasks = projectTasksList.filter(t => t.status !== 'Completed' && t.status !== 'Approved');

                return (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded-none shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col max-h-[90vh] border-t-4 border-[#0B3A2C]">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/80">
                                <div>
                                    <h3 className="text-lg font-bold text-[#0B3A2C]">Project Tasks: <span className="text-gray-900">{viewProjectModal.project.customerName}</span></h3>
                                    <p className="text-xs text-gray-500 mt-1">Workflow Stage: <span className="font-semibold text-gray-700">{viewProjectModal.project.workflowStage}</span> | Overall Status: <span className="font-semibold text-gray-700">{viewProjectModal.project.status}</span></p>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {hasPermission('create_task') && (
                                        <>
                                            <button
                                                onClick={() => handleOpenSelectTasksModal(viewProjectModal.project)}
                                                className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all flex items-center gap-1.5 shadow-sm"
                                                title="Select which template tasks to include in this project"
                                            >
                                                <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                                                Select Template Tasks
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setCustomTaskData({
                                                        taskName: '',
                                                        department: departments[0]?._id || '',
                                                        tatHours: 24,
                                                        description: '',
                                                        requiredDocuments: ''
                                                    });
                                                    setIsAddTaskModalOpen(true);
                                                }}
                                                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all flex items-center gap-1.5 shadow-sm"
                                                title="Add custom task to this project"
                                            >
                                                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                                + Add Custom Task
                                            </button>
                                            <button
                                                onClick={() => handleOpenMultiAssignModal(viewProjectModal.project)}
                                                className="px-3 py-1.5 bg-[#0B3A2C] text-white rounded-lg text-xs font-bold hover:bg-[#124b39] transition-all flex items-center gap-1.5 shadow-sm"
                                                title="Assign multiple tasks together (optional to assign all)"
                                            >
                                                <Users className="w-3.5 h-3.5 text-emerald-300" />
                                                Multi-Assign Tasks
                                            </button>
                                        </>
                                    )}
                                    <button 
                                        onClick={() => {
                                            setViewProjectModal({ isOpen: false, project: null });
                                            setSelectedProjectTaskIds([]);
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-none transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Bulk selection action bar */}
                            {selectedProjectTaskIds.length > 0 && hasPermission('create_task') && (
                                <div className="bg-emerald-50 border-b border-emerald-200 px-4 sm:px-6 py-2.5 flex items-center justify-between animate-fadeIn">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
                                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                                        <span><strong>{selectedProjectTaskIds.length}</strong> tasks selected</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                apiClient.get(`/operations/projects/${viewProjectModal.project._id}/documents`)
                                                    .then(res => setProjectDocuments(res.data))
                                                    .catch(err => console.error("Failed to fetch project docs", err));
                                                setBulkAssigneeId('');
                                                setSelectedReferenceDocs([]);
                                                setBulkAssignModal(true);
                                            }}
                                            className="px-3 py-1.5 bg-[#0B3A2C] text-white rounded-lg text-xs font-bold hover:bg-[#124b39] transition-all flex items-center gap-1.5 shadow-sm"
                                        >
                                            <UserPlus className="w-3.5 h-3.5" />
                                            Assign Selected ({selectedProjectTaskIds.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedProjectTaskIds([])}
                                            className="px-2.5 py-1.5 bg-white text-gray-600 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50"
                                        >
                                            Clear Selection
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            <div className="overflow-y-auto overflow-x-auto p-4 sm:p-6">
                                <table className="w-full text-left text-[10px] sm:text-xs min-w-[500px]">
                                    <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-semibold">
                                        <tr>
                                            {hasPermission('create_task') && (
                                                <th className="py-2 sm:py-3 px-2 sm:px-3 w-8 text-center">
                                                    <input 
                                                        type="checkbox"
                                                        checked={
                                                            assignableTasks.length > 0 &&
                                                            assignableTasks.every(t => selectedProjectTaskIds.includes(t._id))
                                                        }
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedProjectTaskIds(assignableTasks.map(t => t._id));
                                                            } else {
                                                                setSelectedProjectTaskIds([]);
                                                            }
                                                        }}
                                                        className="rounded text-[#0B3A2C] focus:ring-[#0B3A2C] cursor-pointer"
                                                        title="Select all assignable tasks"
                                                    />
                                                </th>
                                            )}
                                            <th className="py-2 sm:py-3 px-2 sm:px-4">Task Details</th>
                                            <th className="py-2 sm:py-3 px-2 sm:px-4">Assignee</th>
                                            <th className="py-2 sm:py-3 px-2 sm:px-4">Status</th>
                                            <th className="py-2 sm:py-3 px-2 sm:px-4">Deadline</th>
                                            <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {projectTasksList.map((task) => (
                                            <tr key={task._id} className="hover:bg-gray-50">
                                                {hasPermission('create_task') && (
                                                    <td className="py-2 sm:py-3 px-2 sm:px-3 text-center">
                                                        {task.status !== 'Completed' && task.status !== 'Approved' ? (
                                                            <input 
                                                                type="checkbox"
                                                                checked={selectedProjectTaskIds.includes(task._id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedProjectTaskIds([...selectedProjectTaskIds, task._id]);
                                                                    } else {
                                                                        setSelectedProjectTaskIds(selectedProjectTaskIds.filter(id => id !== task._id));
                                                                    }
                                                                }}
                                                                className="rounded text-[#0B3A2C] focus:ring-[#0B3A2C] cursor-pointer"
                                                            />
                                                        ) : (
                                                            <span className="text-gray-300">-</span>
                                                        )}
                                                    </td>
                                                )}
                                                <td className="py-2 sm:py-3 px-2 sm:px-4">
                                                    <div className="font-bold text-gray-900">{task.taskName}</div>
                                                    <div className="text-[10px] text-gray-500">Step {task.stepNumber}</div>
                                                </td>
                                                <td className="py-2 sm:py-3 px-2 sm:px-4">
                                                    {task.assignedTo ? (
                                                        <span className="font-semibold text-gray-900">{task.assignedTo.name}</span>
                                                    ) : (
                                                        <span className="text-gray-400 italic">Unassigned</span>
                                                    )}
                                                </td>
                                                <td className="py-2 sm:py-3 px-2 sm:px-4 flex flex-col items-start gap-1">
                                                    <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                        task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                        task.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                        task.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                        task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {task.status}
                                                    </span>
                                                    {task.status === 'Submitted' && task.submittedAt && (
                                                        <span className="text-[10px] text-gray-500 font-medium">Submitted: {new Date(task.submittedAt).toLocaleDateString()}</span>
                                                    )}
                                                    {task.status === 'Approved' && task.approvedAt && (
                                                        <span className="text-[10px] text-gray-500 font-medium">Approved: {new Date(task.approvedAt).toLocaleDateString()}</span>
                                                    )}
                                                    {task.status === 'Rejected' && task.approvedAt && (
                                                        <span className="text-[10px] text-red-500 font-medium">Rejected: {new Date(task.approvedAt).toLocaleDateString()}</span>
                                                    )}
                                                </td>
                                                <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-600">
                                                    {task.dueDate ? <CountdownTimer dueDate={task.dueDate} status={task.status} submittedAt={task.submittedAt} opsHeadReminderHours={task.opsHeadReminderHours} /> : 'Not set'}
                                                </td>
                                                <td className="py-2 sm:py-3 px-2 sm:px-4 text-[10px] text-gray-500 flex flex-col gap-1 items-center sm:items-start justify-center text-center">
                                                    {task.remarks?.length > 0 && <div className="text-red-500 font-semibold mb-1">Has remarks</div>}
                                                    
                                                    {hasPermission('manage_project_workflow') && task.status !== 'Pending' && (
                                                        <button
                                                            onClick={() => {
                                                                setApproveStatus('Approved'); // Always reset to default
                                                                setApproveRemark('');
                                                                setApproveModal({ isOpen: true, task });
                                                            }}
                                                            title="View / Review Task"
                                                            className="px-3 py-1 bg-[#0B3A2C] text-white text-[10px] uppercase font-bold rounded hover:bg-opacity-90 transition-colors"
                                                        >
                                                            View
                                                        </button>
                                                    )}
                                                    
                                                    {/* Assign / Reassign Task Button & Delete Task */}
                                                    {hasPermission('create_task') && task.status !== 'Completed' && task.status !== 'Approved' && (
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <button
                                                                onClick={() => {
                                                                    setAssigneeId(task.assignedTo?._id || '');
                                                                    setAssignModal({ isOpen: true, taskId: task._id, projectId: viewProjectModal.project._id });
                                                                    // Fetch project documents
                                                                    apiClient.get(`/operations/projects/${viewProjectModal.project._id}/documents`)
                                                                        .then(res => setProjectDocuments(res.data))
                                                                        .catch(err => console.error("Failed to fetch project docs", err));
                                                                }}
                                                                className={`px-3 py-1 text-white text-[10px] uppercase font-bold rounded transition-colors ${
                                                                    task.assignedTo ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-amber-500 hover:bg-amber-600'
                                                                }`}
                                                                title={task.assignedTo ? "Change Assignee" : "Assign Task"}
                                                            >
                                                                {task.assignedTo ? 'Reassign' : 'Assign Task'}
                                                            </button>

                                                            <button
                                                                onClick={() => handleDeleteTask(task._id, task.taskName)}
                                                                className="p-1 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded transition-colors"
                                                                title="Remove task from this project"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {projectTasksList.length === 0 && (
                                            <tr>
                                                <td colSpan={hasPermission('create_task') ? 6 : 5} className="text-center py-6 text-gray-500">No tasks generated for this project yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Select Template Tasks Modal for Project */}
            {isSelectTasksModalOpen && viewProjectModal.project && (
                <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border-t-4 border-[#0B3A2C]">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <ClipboardList className="w-5 h-5 text-[#0B3A2C]" />
                                    Select Tasks for Project
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">{viewProjectModal.project.customerName}</p>
                            </div>
                            <button
                                onClick={() => setIsSelectTasksModalOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-xs text-gray-600 mb-3">
                                Choose which template tasks are required for this project. Tasks not selected will be removed, and selected tasks will be generated.
                            </p>

                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Available Template Tasks ({projectSelectedTemplateIds.length}/{taskTemplates.length})
                                </span>
                                <div className="flex gap-2 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setProjectSelectedTemplateIds(taskTemplates.map(t => t._id))}
                                        className="text-[#0B3A2C] font-semibold hover:underline"
                                    >
                                        Select All
                                    </button>
                                    <span className="text-gray-300">|</span>
                                    <button
                                        type="button"
                                        onClick={() => setProjectSelectedTemplateIds([])}
                                        className="text-gray-500 font-semibold hover:underline"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-gray-50/50 space-y-1 mb-4">
                                {taskTemplates.map((tpl, index) => {
                                    const isChecked = projectSelectedTemplateIds.includes(tpl._id);
                                    return (
                                        <label 
                                            key={tpl._id} 
                                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                                                isChecked ? 'bg-emerald-50/80 border border-emerald-200 text-emerald-950 font-medium' : 'hover:bg-white text-gray-700 border border-transparent'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setProjectSelectedTemplateIds(prev => [...prev, tpl._id]);
                                                        } else {
                                                            setProjectSelectedTemplateIds(prev => prev.filter(id => id !== tpl._id));
                                                        }
                                                    }}
                                                    className="rounded text-[#0B3A2C] focus:ring-[#0B3A2C]"
                                                />
                                                <span>
                                                    <span className="text-gray-400 font-bold mr-1.5">{index + 1}.</span>
                                                    {tpl.taskName}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-gray-400 px-2 py-0.5 bg-gray-100 rounded">
                                                {tpl.department?.name || 'Operations'} • {tpl.tatHours}h
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsSelectTasksModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveSelectedTasks}
                                    disabled={isSavingSelectedTasks || projectSelectedTemplateIds.length === 0}
                                    className="px-5 py-2 text-xs font-bold bg-[#0B3A2C] text-white rounded-lg hover:bg-[#124b39] transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                                >
                                    {isSavingSelectedTasks ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Apply Selected Tasks ({projectSelectedTemplateIds.length})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Custom Task Modal */}
            {isAddTaskModalOpen && viewProjectModal.project && (
                <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border-t-4 border-emerald-600">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-emerald-600" />
                                    Add Custom Task to Project
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">{viewProjectModal.project.customerName}</p>
                            </div>
                            <button
                                onClick={() => setIsAddTaskModalOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddCustomTask} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Task Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={customTaskData.taskName}
                                    onChange={(e) => setCustomTaskData({ ...customTaskData, taskName: e.target.value })}
                                    placeholder="e.g. Special Meter Installation / Extra Approvals"
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Department *
                                    </label>
                                    <select
                                        required
                                        value={customTaskData.department}
                                        onChange={(e) => setCustomTaskData({ ...customTaskData, department: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                                    >
                                        <option value="">-- Select Department --</option>
                                        {departments.map(d => (
                                            <option key={d._id} value={d._id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        TAT (Hours)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={customTaskData.tatHours}
                                        onChange={(e) => setCustomTaskData({ ...customTaskData, tatHours: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Required Documents (Comma separated, optional)
                                </label>
                                <input
                                    type="text"
                                    value={customTaskData.requiredDocuments}
                                    onChange={(e) => setCustomTaskData({ ...customTaskData, requiredDocuments: e.target.value })}
                                    placeholder="e.g. Site Photo, Inspection Report, Customer Signoff"
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Description / Instructions (Optional)
                                </label>
                                <textarea
                                    rows="2"
                                    value={customTaskData.description}
                                    onChange={(e) => setCustomTaskData({ ...customTaskData, description: e.target.value })}
                                    placeholder="Detailed instructions for the assigned staff..."
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddTaskModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingCustomTask}
                                    className="px-5 py-2 text-xs font-bold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                                >
                                    {isSavingCustomTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Add Task to Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Approve Task Modal */}
            {approveModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
                <div className="bg-white rounded-none shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border-t-4 border-yellow-500">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/80">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Review Task: {approveModal.task?.taskName}</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Project: <span className="font-semibold text-gray-700">{approveModal.task?.project?.customerName}</span></p>
                        </div>
                        <button 
                            onClick={() => setApproveModal({ isOpen: false, task: null })}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-none transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="overflow-y-auto p-6 flex flex-col gap-6">
                        {/* Assignment Details */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200 gap-4 sm:gap-0">
                            <div className="flex flex-col w-full sm:w-auto">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Assigned By</span>
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-semibold text-gray-800">{approveModal.task?.assignedBy?.name || 'System / Admin'}</span>
                                </div>
                            </div>
                            <div className="hidden sm:block text-gray-300">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                            </div>
                            <div className="flex flex-col sm:items-end mt-2 sm:mt-0 w-full sm:w-auto border-t sm:border-0 border-gray-200 pt-3 sm:pt-0">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Assigned To</span>
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-[#0B3A2C]" />
                                    <span className="text-sm font-semibold text-[#0B3A2C]">{approveModal.task?.assignedTo?.name || 'Unassigned'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Task Timeline & Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                            <div className="bg-gray-50 p-3 rounded-md border border-gray-200 flex flex-col justify-between">
                                <div>
                                    <span className="block text-[10px] text-gray-500 font-bold uppercase mb-1">Generated At</span>
                                    <span className="text-xs font-semibold text-gray-900">{approveModal.task?.createdAt ? new Date(approveModal.task.createdAt).toLocaleString() : 'N/A'}</span>
                                </div>
                                <div className="text-[10px] text-gray-500 mt-2 font-medium">Task originally created</div>
                            </div>
                            <div className="bg-blue-50/50 p-3 rounded-md border border-blue-100 flex flex-col justify-between">
                                <div>
                                    <span className="block text-[10px] text-blue-500 font-bold uppercase mb-1">Assigned At</span>
                                    <span className="text-xs font-semibold text-blue-900">
                                        {approveModal.task?.assignedAt ? new Date(approveModal.task.assignedAt).toLocaleString() : 'Not Assigned'}
                                    </span>
                                </div>
                                <div className="text-[10px] text-gray-600 mt-2 font-medium">Ops Head action</div>
                            </div>
                            <div className="bg-amber-50/50 p-3 rounded-md border border-amber-100 flex flex-col justify-between">
                                <div>
                                    <span className="block text-[10px] text-amber-600 font-bold uppercase mb-1">
                                        {(approveModal.task?.status === 'Submitted' || approveModal.task?.status === 'Completed') && approveModal.task?.remarks?.length > 1 ? 'Resubmitted At' : 'Submitted At'}
                                    </span>
                                    <span className="text-xs font-semibold text-amber-900">
                                        {approveModal.task?.submittedAt ? new Date(approveModal.task.submittedAt).toLocaleString() : (approveModal.task?.status === 'Rejected' ? 'Awaiting Resubmission' : 'Not Submitted')}
                                    </span>
                                </div>
                                <div className="text-[10px] text-gray-600 mt-2 font-medium">Employee action</div>
                            </div>
                            <div className={`${approveModal.task?.status === 'Rejected' ? 'bg-red-50/50 border-red-100' : 'bg-green-50/50 border-green-100'} p-3 rounded-md border flex flex-col justify-between`}>
                                <div>
                                    <span className={`block text-[10px] font-bold uppercase mb-1 ${approveModal.task?.status === 'Rejected' ? 'text-red-600' : 'text-green-600'}`}>
                                        {approveModal.task?.status === 'Rejected' ? 'Rejected At' : 'Last Decision At'}
                                    </span>
                                    <span className={`text-xs font-semibold ${approveModal.task?.status === 'Rejected' ? 'text-red-900' : 'text-green-900'}`}>
                                        {approveModal.task?.approvedAt ? new Date(approveModal.task.approvedAt).toLocaleString() : (
                                            approveModal.task?.status === 'Rejected' ? 'Rejected' : 'Pending Review'
                                        )}
                                    </span>
                                </div>
                                <div className="text-[10px] text-gray-600 mt-2 font-medium">Ops Head Review</div>
                            </div>
                        </div>

                        {/* Submitted Documents */}
                        <div>
                            <h3 className="font-bold text-sm text-gray-800 mb-3 border-b pb-2">Submitted Documents</h3>
                            {(!approveModal.task?.requiredDocuments || approveModal.task.requiredDocuments.length === 0) ? (
                                <p className="text-xs text-gray-500 italic">No documents were required for this task.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {approveModal.task?.requiredDocuments?.map((doc, idx) => (
                                    <div key={idx} className="text-sm flex items-center justify-between bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
                                        <span className="font-semibold text-gray-700">{doc.documentName}</span>
                                        {doc.isUploaded && doc.fileUrl ? (
                                            <a href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${doc.fileUrl}`} target="_blank" rel="noreferrer" className="text-[#0B3A2C] hover:text-emerald-600 font-bold underline text-xs px-3 py-1 bg-gray-50 rounded-full">View File</a>
                                        ) : (
                                            <span className="text-xs text-red-500 italic">Not uploaded</span>
                                        )}
                                    </div>
                                ))}
                                </div>
                            )}
                        </div>

                        {/* Remarks History */}
                        {approveModal.task?.remarks?.length > 0 && (
                            <div>
                                <h3 className="font-bold text-sm text-gray-800 mb-3 border-b pb-2">Messages & Remarks History</h3>
                                <div className="space-y-3">
                                    {approveModal.task.remarks.map((rmk, idx) => (
                                        <div key={idx} className="bg-yellow-50/30 p-3 rounded-lg border border-yellow-100/50 text-sm">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1 border-b border-yellow-100/50 pb-1 gap-1 sm:gap-0">
                                                <span className="font-bold text-gray-700 text-xs">
                                                    {rmk.addedBy?.name ? `${rmk.addedBy.name} (${rmk.addedBy.role?.name || 'Employee'})` : 'User'}
                                                </span>
                                                <span className="text-[10px] text-gray-500 font-mono">{new Date(rmk.addedAt || rmk.createdAt || rmk.date || Date.now()).toLocaleString()}</span>
                                            </div>
                                            <p className="text-gray-700 mt-1 whitespace-pre-wrap text-xs">{rmk.remarkText || rmk.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Form */}
                        {approveModal.task?.status === 'Submitted' ? (
                            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mt-2">
                                <h3 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Manager Decision</h3>
                                <form onSubmit={handleApproveSubmit}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-2">Decision <span className="text-red-500">*</span></label>
                                            <select
                                                value={approveStatus}
                                                onChange={(e) => setApproveStatus(e.target.value)}
                                                className="w-full px-3 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                                            >
                                                <option value="Approved">Approve (Move to Next Step)</option>
                                                <option value="Rejected">Reject (Send back to Employee)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 mb-2">Feedback / Remarks</label>
                                            <textarea
                                                rows="2"
                                                value={approveRemark}
                                                onChange={(e) => setApproveRemark(e.target.value)}
                                                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 resize-none"
                                                placeholder="Add constructive feedback..."
                                            ></textarea>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => setApproveModal({ isOpen: false, task: null })} className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                                        <button type="submit" className="px-5 py-2 text-sm font-bold bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 shadow-sm transition-colors">Confirm Decision</button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-2 flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-700">Task Status: <span className="uppercase text-[#0B3A2C]">{approveModal.task?.status}</span></span>
                                <button type="button" onClick={() => setApproveModal({ isOpen: false, task: null })} className="px-5 py-2 text-sm font-bold bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg transition-colors">Close View</button>
                            </div>
                        )}
                    </div>
                </div>
                </div>
            )}
            {/* Assign Task Modal */}
            {assignModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
                <div className="bg-white rounded-none shadow-2xl w-full max-w-sm p-6 border-t-4 border-[#0B3A2C]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Assign Task</h2>
                        <button 
                            onClick={() => {
                                setAssignModal({ isOpen: false, taskId: null, projectId: null });
                                setSelectedReferenceDocs([]);
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleAssignSubmit}>
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Select Employee <span className="text-red-500">*</span></label>
                        <select
                        required
                        value={assigneeId}
                        onChange={(e) => setAssigneeId(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B3A2C]"
                        >
                        <option value="">-- Select Employee --</option>
                        {users.map(u => (
                            <option key={u._id} value={u._id}>{u.name} ({u.role?.name || u.department || 'Staff'})</option>
                        ))}
                        </select>
                    </div>
                    
                    {projectDocuments.length > 0 && (
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-700 mb-2">Attach Reference Documents</label>
                            <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-100 rounded-lg p-2 bg-gray-50">
                                {projectDocuments.map((doc, idx) => {
                                    const isSelected = selectedReferenceDocs.some(d => d.fileUrl === doc.fileUrl);
                                    return (
                                        <label key={idx} className={`flex items-center gap-2 p-2 rounded cursor-pointer border ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-transparent hover:bg-gray-100'}`}>
                                            <input 
                                                type="checkbox" 
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedReferenceDocs([...selectedReferenceDocs, { documentName: doc.documentName, fileUrl: doc.fileUrl }]);
                                                    } else {
                                                        setSelectedReferenceDocs(selectedReferenceDocs.filter(d => d.fileUrl !== doc.fileUrl));
                                                    }
                                                }}
                                                className="rounded text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-gray-800">{doc.documentName}</span>
                                                <span className="text-[10px] text-gray-500">Source: {doc.source}</span>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={() => {
                            setAssignModal({ isOpen: false, taskId: null, projectId: null });
                            setSelectedReferenceDocs([]);
                        }} className="px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-1.5 text-xs font-semibold bg-[#0B3A2C] text-white rounded-lg hover:bg-opacity-90 transition-colors">Confirm Assign</button>
                    </div>
                    </form>
                </div>
                </div>
            )}

            {/* Multi-Task Assignment Modal */}
            {multiAssignModal.isOpen && multiAssignModal.project && (
                <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col border-t-4 border-[#0B3A2C]">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/90">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-[#0B3A2C]" />
                                    Assign Multiple Tasks
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Project: <span className="font-semibold text-gray-800">{multiAssignModal.project?.customerName}</span>
                                </p>
                            </div>
                            <button 
                                onClick={() => {
                                    setMultiAssignModal({ isOpen: false, project: null });
                                    setSelectedReferenceDocs([]);
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Notice & Quick tool */}
                        <div className="px-6 py-3 bg-emerald-50/70 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="text-xs text-emerald-900 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0"></span>
                                <span>
                                    <strong>Note:</strong> Sabhi tasks ko assign karna mandatory nahi hai. Jin tasks ko assign karna chahte hain unke liye employee select karein, baaki unassigned rahenge.
                                </span>
                            </div>
                            {/* Quick set all */}
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] font-semibold text-gray-600 whitespace-nowrap">Set all active to:</span>
                                <select
                                    value={quickAssigneeAll}
                                    onChange={(e) => setQuickAssigneeAll(e.target.value)}
                                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B3A2C]"
                                >
                                    <option value="">-- Select Employee --</option>
                                    {users.map(u => (
                                        <option key={u._id} value={u._id}>{u.name} ({u.role?.name || u.department || 'Staff'})</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={handleApplyQuickAssignAll}
                                    disabled={!quickAssigneeAll}
                                    className="px-2.5 py-1 text-xs font-bold bg-[#0B3A2C] text-white rounded-lg hover:bg-[#124b39] disabled:opacity-50 transition-all"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>

                        {/* Task list body */}
                        <form onSubmit={handleMultiAssignSubmit} className="flex-1 overflow-hidden flex flex-col">
                            <div className="p-6 overflow-y-auto space-y-4 flex-1">
                                <div className="space-y-3">
                                    {allTasks.filter(t => t.project?._id === multiAssignModal.project._id).map((task) => {
                                        const isCompleted = task.status === 'Completed' || task.status === 'Approved';
                                        const currentVal = multiAssignments[task._id] || '';

                                        return (
                                            <div 
                                                key={task._id} 
                                                className={`p-4 rounded-xl border transition-all ${
                                                    isCompleted 
                                                        ? 'bg-gray-50 border-gray-200 opacity-60' 
                                                        : currentVal 
                                                            ? 'bg-emerald-50/40 border-emerald-200 shadow-xs' 
                                                            : 'bg-white border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-700">
                                                                Step {task.stepNumber}
                                                            </span>
                                                            <h4 className="text-sm font-bold text-gray-900">{task.taskName}</h4>
                                                            <span className="text-[10px] font-medium text-gray-500">
                                                                (TAT: {task.tatHours || 24}h)
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                                task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                                task.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                                task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                {task.status}
                                                            </span>
                                                        </div>
                                                        {task.description && (
                                                            <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                                                        )}
                                                    </div>

                                                    <div className="w-full sm:w-64 shrink-0">
                                                        {isCompleted ? (
                                                            <div className="text-xs font-semibold text-emerald-700 px-3 py-2 bg-emerald-50 rounded-lg text-center">
                                                                ✓ Completed by {task.assignedTo?.name || 'Staff'}
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                                                                    Assign To:
                                                                </label>
                                                                <select
                                                                    value={currentVal}
                                                                    onChange={(e) => {
                                                                        setMultiAssignments({
                                                                            ...multiAssignments,
                                                                            [task._id]: e.target.value
                                                                        });
                                                                    }}
                                                                    className={`w-full px-3 py-2 text-xs font-medium rounded-lg border focus:outline-none transition-all ${
                                                                        currentVal 
                                                                            ? 'border-emerald-500 bg-white text-emerald-950 font-semibold' 
                                                                            : 'border-gray-200 bg-gray-50 text-gray-600'
                                                                    }`}
                                                                >
                                                                    <option value="">-- Leave Unassigned (Optional) --</option>
                                                                    {users.map(u => (
                                                                        <option key={u._id} value={u._id}>
                                                                            {u.name} ({u.role?.name || u.department || 'Staff'})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Reference Documents */}
                                {projectDocuments.length > 0 && (
                                    <div className="mt-6 pt-4 border-t border-gray-100">
                                        <label className="block text-xs font-bold text-gray-700 mb-2">
                                            Attach Reference Documents to Newly Assigned Tasks
                                        </label>
                                        <div className="max-h-36 overflow-y-auto space-y-2 border border-gray-200 rounded-xl p-3 bg-gray-50/50">
                                            {projectDocuments.map((doc, idx) => {
                                                const isSelected = selectedReferenceDocs.some(d => d.fileUrl === doc.fileUrl);
                                                return (
                                                    <label 
                                                        key={idx} 
                                                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-colors ${
                                                            isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-transparent hover:bg-gray-100'
                                                        }`}
                                                    >
                                                        <input 
                                                            type="checkbox" 
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedReferenceDocs([...selectedReferenceDocs, { documentName: doc.documentName, fileUrl: doc.fileUrl }]);
                                                                } else {
                                                                    setSelectedReferenceDocs(selectedReferenceDocs.filter(d => d.fileUrl !== doc.fileUrl));
                                                                }
                                                            }}
                                                            className="rounded text-emerald-600 focus:ring-emerald-500"
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-semibold text-gray-800">{doc.documentName}</span>
                                                            <span className="text-[10px] text-gray-500">Source: {doc.source}</span>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between shrink-0">
                                <div className="text-xs text-gray-600 font-medium">
                                    <span className="font-bold text-gray-900">
                                        {Object.values(multiAssignments).filter(v => v && v.trim() !== '').length}
                                    </span> tasks configured to assign
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setMultiAssignModal({ isOpen: false, project: null });
                                            setSelectedReferenceDocs([]);
                                        }}
                                        className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSavingMultiAssign || Object.values(multiAssignments).filter(v => v && v.trim() !== '').length === 0}
                                        className="px-5 py-2 text-xs font-bold bg-[#0B3A2C] text-white rounded-lg hover:bg-[#124b39] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
                                    >
                                        {isSavingMultiAssign ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                        Confirm & Assign Tasks
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Assign Modal for Selected Rows */}
            {bulkAssignModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border-t-4 border-[#0B3A2C]">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Assign Selected Tasks</h2>
                                <p className="text-xs text-gray-500">{selectedProjectTaskIds.length} tasks selected</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setBulkAssignModal(false);
                                    setBulkAssigneeId('');
                                }}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleBulkAssignSubmit}>
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Select Employee <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={bulkAssigneeId}
                                    onChange={(e) => setBulkAssigneeId(e.target.value)}
                                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B3A2C]"
                                >
                                    <option value="">-- Select Employee --</option>
                                    {users.map(u => (
                                        <option key={u._id} value={u._id}>{u.name} ({u.role?.name || u.department || 'Staff'})</option>
                                    ))}
                                </select>
                            </div>

                            {projectDocuments.length > 0 && (
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-gray-700 mb-2">Attach Reference Documents</label>
                                    <div className="max-h-36 overflow-y-auto space-y-2 border border-gray-100 rounded-lg p-2 bg-gray-50">
                                        {projectDocuments.map((doc, idx) => {
                                            const isSelected = selectedReferenceDocs.some(d => d.fileUrl === doc.fileUrl);
                                            return (
                                                <label key={idx} className={`flex items-center gap-2 p-2 rounded cursor-pointer border ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-transparent hover:bg-gray-100'}`}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedReferenceDocs([...selectedReferenceDocs, { documentName: doc.documentName, fileUrl: doc.fileUrl }]);
                                                            } else {
                                                                setSelectedReferenceDocs(selectedReferenceDocs.filter(d => d.fileUrl !== doc.fileUrl));
                                                            }
                                                        }}
                                                        className="rounded text-emerald-600 focus:ring-emerald-500"
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold text-gray-800">{doc.documentName}</span>
                                                        <span className="text-[10px] text-gray-500">Source: {doc.source}</span>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 mt-4">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setBulkAssignModal(false);
                                        setBulkAssigneeId('');
                                    }} 
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSavingMultiAssign || !bulkAssigneeId}
                                    className="px-4 py-2 text-xs font-bold bg-[#0B3A2C] text-white rounded-lg hover:bg-[#124b39] disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {isSavingMultiAssign ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                    Assign {selectedProjectTaskIds.length} Tasks
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Equipments Modal */}
            {equipmentModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-none shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border-t-4 border-amber-500">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/80">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Manage Installed Hardware</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Project: <span className="font-semibold text-gray-700">{equipmentModal.project?.customerName}</span></p>
                            </div>
                            <button 
                                onClick={() => setEquipmentModal({ isOpen: false, project: null })}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-none transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            <form onSubmit={handleSaveEquipments}>
                                <div className="space-y-4 mb-6">
                                    {equipments.map((eq, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row gap-3 items-end bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <div className="flex-1 w-full">
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Item Name</label>
                                                <input 
                                                    type="text" 
                                                    required
                                                    value={eq.itemName}
                                                    onChange={(e) => handleEquipmentChange(idx, 'itemName', e.target.value)}
                                                    placeholder="e.g. Solar Battery 150Ah"
                                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-amber-500"
                                                />
                                            </div>
                                            <div className="flex-1 w-full">
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Serial Number</label>
                                                <input 
                                                    type="text" 
                                                    required
                                                    value={eq.serialNumber}
                                                    onChange={(e) => handleEquipmentChange(idx, 'serialNumber', e.target.value)}
                                                    placeholder="e.g. SN-12345678"
                                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-amber-500"
                                                />
                                            </div>
                                            <div className="w-full sm:w-20">
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Qty</label>
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    required
                                                    value={eq.quantity}
                                                    onChange={(e) => handleEquipmentChange(idx, 'quantity', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-amber-500"
                                                />
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => handleRemoveEquipmentRow(idx)}
                                                className="p-2 mb-0.5 text-red-500 hover:bg-red-100 rounded transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                
                                <button
                                    type="button"
                                    onClick={handleAddEquipmentRow}
                                    className="mb-6 px-3 py-1.5 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded flex items-center gap-1.5 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Another Item
                                </button>

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button 
                                        type="button" 
                                        onClick={() => setEquipmentModal({ isOpen: false, project: null })} 
                                        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSavingEquipments}
                                        className="px-4 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white rounded transition-colors flex items-center gap-2"
                                    >
                                        {isSavingEquipments ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        Save Hardware Details
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Project Modal */}
            {assignProjectModal.isOpen && assignProjectModal.project && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border-t-4 border-[#0B3A2C]">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">Assign Project</h3>
                                <p className="text-xs text-gray-500 mt-0.5">{assignProjectModal.project.customerName}</p>
                            </div>
                            <button
                                onClick={() => setAssignProjectModal({ isOpen: false, project: null })}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAssignProjectSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Select Employee / Project Manager
                                </label>
                                <select
                                    value={projectAssigneeId}
                                    onChange={(e) => setProjectAssigneeId(e.target.value)}
                                    required
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3A2C]/20 focus:border-[#0B3A2C]"
                                >
                                    <option value="">-- Choose Employee --</option>
                                    {users.map(u => (
                                        <option key={u._id} value={u._id}>
                                            {u.name} ({u.role?.name || u.department || 'Staff'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setAssignProjectModal({ isOpen: false, project: null })}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingProjectAssign || !projectAssigneeId}
                                    className="px-5 py-2 text-xs font-bold bg-[#0B3A2C] text-white rounded-lg hover:bg-[#124b39] transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                                >
                                    {isSavingProjectAssign ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                    Save Assignment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
