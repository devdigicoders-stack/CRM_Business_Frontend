import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Loader2, X, Building2, User, Phone, CheckCircle2, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../api/axiosConfig';

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
    
    const [viewProjectModal, setViewProjectModal] = useState({ isOpen: false, project: null });
    const [approveModal, setApproveModal] = useState({ isOpen: false, task: null });
    const [assignModal, setAssignModal] = useState({ isOpen: false, taskId: null });
    const [assigneeId, setAssigneeId] = useState('');
    const [users, setUsers] = useState([]);
    
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
        remarks: ''
    });

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

    useEffect(() => {
        checkUser();
        fetchProjects();
        fetchClosedWonLeads();
        fetchUsers();
    }, []);

    const hasPermission = (perm) => {
        if (userProfile?.role?.name === 'Admin') return true;
        return permissions.includes(perm);
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
                assignedTo: assigneeId
            });
            toast.success('Task assigned successfully!');
            setAssignModal({ isOpen: false, taskId: null });
            
            // Re-fetch tasks
            const taskRes = await apiClient.get('/operations/tasks');
            setAllTasks(taskRes.data || []);
            fetchProjects();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign task');
        }
    };

    const handleOpenCreateModal = () => {
        setFormData({ leadId: '', customerName: '', quotationId: '', remarks: '' });
        setIsCreateModalOpen(true);
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
                <button
                    onClick={handleOpenCreateModal}
                    className="bg-[#0B3A2C] hover:bg-[#124b39] text-white px-3 sm:px-4 py-2 rounded-xl transition-all shadow-sm font-semibold text-sm inline-flex items-center gap-1.5 sm:gap-2 shrink-0"
                >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">Create Project</span>
                    <span className="sm:hidden">Create</span>
                </button>
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
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-400 uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="py-3.5 px-4">Customer</th>
                                    <th className="py-3.5 px-4">Ops Head</th>
                                    <th className="py-3.5 px-4">Workflow Stage</th>
                                    <th className="py-3.5 px-4">Step</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {projects.map(project => {
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
                                            <div className="flex items-center gap-1.5 text-gray-700">
                                                <User className="w-3.5 h-3.5 text-gray-400" />
                                                {project.operationHead?.name || 'Unknown'}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-gray-600 font-medium">
                                            {project.workflowStage}
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
                                            <button
                                                onClick={() => setViewProjectModal({ isOpen: true, project })}
                                                className="px-3 py-1.5 bg-[#0B3A2C]/10 text-[#0B3A2C] hover:bg-[#0B3A2C] hover:text-white text-xs font-bold rounded transition-colors inline-flex items-center gap-1.5"
                                            >
                                                View Tasks
                                            </button>
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
                                        rows="3"
                                    ></textarea>
                                </div>

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
            {viewProjectModal.isOpen && viewProjectModal.project && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-none shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col max-h-[90vh] border-t-4 border-[#0B3A2C]">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/80">
                            <div>
                                <h3 className="text-lg font-bold text-[#0B3A2C]">Project Tasks: <span className="text-gray-900">{viewProjectModal.project.customerName}</span></h3>
                                <p className="text-xs text-gray-500 mt-1">Workflow Stage: <span className="font-semibold text-gray-700">{viewProjectModal.project.workflowStage}</span> | Overall Status: <span className="font-semibold text-gray-700">{viewProjectModal.project.status}</span></p>
                            </div>
                            <button 
                                onClick={() => setViewProjectModal({ isOpen: false, project: null })}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-none transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto overflow-x-auto p-4 sm:p-6">
                            <table className="w-full text-left text-[10px] sm:text-xs min-w-[500px]">
                                <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-semibold">
                                    <tr>
                                        <th className="py-2 sm:py-3 px-2 sm:px-4">Task Details</th>
                                        <th className="py-2 sm:py-3 px-2 sm:px-4">Assignee</th>
                                        <th className="py-2 sm:py-3 px-2 sm:px-4">Status</th>
                                        <th className="py-2 sm:py-3 px-2 sm:px-4">Deadline</th>
                                        <th className="py-2 sm:py-3 px-2 sm:px-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {allTasks.filter(t => t.project?._id === viewProjectModal.project._id).map((task) => (
                                        <tr key={task._id} className="hover:bg-gray-50">
                                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                                                <div className="font-bold text-gray-900">{task.taskName}</div>
                                                <div className="text-[10px] text-gray-500">Step {task.stepNumber}</div>
                                            </td>
                                            <td className="py-2 sm:py-3 px-2 sm:px-4">
                                                {task.assignedTo ? (
                                                    <span className="font-semibold">{task.assignedTo.name}</span>
                                                ) : (
                                                    <span className="text-gray-400 italic">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="py-2 sm:py-3 px-2 sm:px-4 flex flex-col items-start gap-1">
                                                <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                    task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                    task.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                    task.status === 'Rejected' ? 'bg-red-100 text-red-700' :
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
                                                
                                                {/* Assign Task Button */}
                                                {hasPermission('create_task') && task.status === 'Pending' && task.project?.currentStep === task.stepNumber && (
                                                    <button
                                                        onClick={() => setAssignModal({ isOpen: true, taskId: task._id })}
                                                        className="px-3 py-1 bg-amber-500 text-white text-[10px] uppercase font-bold rounded hover:bg-amber-600 transition-colors"
                                                    >
                                                        Assign Task
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {allTasks.filter(t => t.project?._id === viewProjectModal.project._id).length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="text-center py-6 text-gray-500">No tasks generated for this project yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
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
                            onClick={() => setAssignModal({ isOpen: false, taskId: null })}
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
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setAssignModal({ isOpen: false, taskId: null })} className="px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-1.5 text-xs font-semibold bg-[#0B3A2C] text-white rounded-lg hover:bg-opacity-90 transition-colors">Confirm Assign</button>
                    </div>
                    </form>
                </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
