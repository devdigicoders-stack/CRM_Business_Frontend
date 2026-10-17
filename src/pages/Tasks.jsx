import React, { useState, useEffect } from 'react';
import { CheckSquare, User, Clock, AlertCircle, FileText, Check, X, ArrowRight, Play, Upload, Eye, Search, Users, UserPlus, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
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
    return <span className="text-xs font-semibold text-emerald-600">Task {status}</span>;
  }

  const isReviewTimer = status === 'Submitted' && submittedAt;
  const targetDateDisplay = isReviewTimer
    ? new Date(new Date(submittedAt).getTime() + (reviewHours * 60 * 60 * 1000))
    : new Date(dueDate);

  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500 mb-0.5">
        {isReviewTimer ? 'Review By:' : ''} <br/> {targetDateDisplay.toLocaleString()}
      </span>
      <span className={`font-mono text-xs font-bold px-2 py-1 rounded-md inline-block w-max mt-0.5 ${timeLeft === 'Overdue' ? 'bg-red-50 text-red-600 border border-red-100' : (isReviewTimer ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100')}`}>
        {isReviewTimer ? '🔍' : '⏰'} {timeLeft}
      </span>
    </div>
  );
};

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('Open'); // 'Open' by default, or 'Completed'
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [userProfile, setUserProfile] = useState(null);
  const [permissions, setPermissions] = useState([]);

  // Modals state
  const [assignModal, setAssignModal] = useState({ isOpen: false, taskId: null });
  const [submitModal, setSubmitModal] = useState({ isOpen: false, task: null });
  const [approveModal, setApproveModal] = useState({ isOpen: false, task: null });
  const [viewModal, setViewModal] = useState({ isOpen: false, task: null });
  const [bulkAssignModal, setBulkAssignModal] = useState({ isOpen: false });

  // Form states
  const [assigneeId, setAssigneeId] = useState('');
  const [bulkAssigneeId, setBulkAssigneeId] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [isSavingBulkAssign, setIsSavingBulkAssign] = useState(false);
  const [submitDocs, setSubmitDocs] = useState({}); // { docName: url }
  const [submitRemark, setSubmitRemark] = useState('');
  const [approveStatus, setApproveStatus] = useState('Approved');
  const [approveRemark, setApproveRemark] = useState('');

  useEffect(() => {
    checkUser();
    fetchTasks();
  }, []);

  const checkUser = async () => {
    try {
      const res = await apiClient.get('/auth/profile');
      const user = res.data.user;
      setUserProfile(user);
      setPermissions(user?.role?.permissions || []);
      
      // Fetch users if they have permission to assign tasks or are Admin
      if (user?.role?.name === 'Admin' || (user?.role?.permissions || []).includes('create_task')) {
        fetchUsers();
      }
    } catch (err) {
      console.error("Error fetching profile", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get('/auth/users?all=true');
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users");
    }
  };

  const fetchTasks = async (tab = activeTab) => {
    setIsLoading(true);
    try {
      const params = {};
      if (tab === 'Open') params.status = 'open';
      else if (tab === 'Completed') params.status = 'Completed';
      else if (tab === 'All') params.status = 'All';

      const res = await apiClient.get('/operations/tasks', { params });
      setTasks(res.data);
    } catch (error) {
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Assign Task (Ops Head)
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put(`/operations/tasks/${assignModal.taskId}/assign`, {
        assignedTo: assigneeId
      });
      toast.success('Task assigned successfully!');
      setAssignModal({ isOpen: false, taskId: null });
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign task');
    }
  };

  // Bulk Assign Multiple Tasks (Ops Head)
  const handleBulkAssignSubmit = async (e) => {
    e.preventDefault();
    if (!bulkAssigneeId) {
      return toast.warning("Please select an employee.");
    }
    if (selectedTaskIds.length === 0) {
      return toast.warning("No tasks selected.");
    }

    try {
      setIsSavingBulkAssign(true);
      const res = await apiClient.put('/operations/tasks/assign-multiple', {
        taskIds: selectedTaskIds,
        assignedTo: bulkAssigneeId
      });
      toast.success(res.data.message || 'Tasks assigned successfully!');
      setBulkAssignModal({ isOpen: false });
      setSelectedTaskIds([]);
      setBulkAssigneeId('');
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign tasks');
    } finally {
      setIsSavingBulkAssign(false);
    }
  };

  // 2. Submit Task (Employee)
  const handleSubmitWork = async (e) => {
    e.preventDefault();
    const task = submitModal.task;
    
    // Validation
    const allFilled = task.requiredDocuments.every(doc => submitDocs[doc.documentName] instanceof File);
    if (task.requiredDocuments.length > 0 && !allFilled) {
      return toast.error("Please provide all required documents.");
    }

    try {
      const formData = new FormData();
      if (submitRemark) formData.append('remarkText', submitRemark);
      
      task.requiredDocuments.forEach(doc => {
          if (submitDocs[doc.documentName]) {
             formData.append(doc.documentName, submitDocs[doc.documentName]);
          }
      });

      await apiClient.put(`/operations/tasks/${task._id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Task submitted for approval!');
      setSubmitModal({ isOpen: false, task: null });
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit task');
    }
  };

  // 3. Approve Task (Ops Head)
  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put(`/operations/tasks/${approveModal.task._id}/approve`, {
        status: approveStatus,
        remarkText: approveRemark
      });
      toast.success(`Task ${approveStatus.toLowerCase()} successfully!`);
      setApproveModal({ isOpen: false, task: null });
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process approval');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">Pending</span>;
      case 'In Progress': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">In Progress</span>;
      case 'Submitted': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Pending Approval</span>;
      case 'Completed': 
      case 'Approved':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Closed (Approved)</span>;
      case 'Rejected': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Rejected</span>;
      case 'Overdue': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Overdue</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const hasPermission = (perm) => {
    if (userProfile?.role?.name === 'Admin') return true;
    return permissions.includes(perm);
  };

  const filteredTasks = tasks.filter(task => {
    // When on Open tab, strictly hide Completed and Approved tasks
    if (activeTab === 'Open' && (task.status === 'Completed' || task.status === 'Approved')) {
      return false;
    }
    if (activeTab === 'Completed' && task.status !== 'Completed' && task.status !== 'Approved') {
      return false;
    }
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (task.project?.customerName && task.project.customerName.toLowerCase().includes(q)) ||
      (task.taskName && task.taskName.toLowerCase().includes(q)) ||
      (task.department?.name && task.department.name.toLowerCase().includes(q)) ||
      (task.assignedTo?.name && task.assignedTo.name.toLowerCase().includes(q)) ||
      (task.status && task.status.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
            <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6 text-[#0B3A2C] shrink-0" />
            Project Tasks
          </h1>
          <p className="text-[11px] sm:text-sm text-gray-500 mt-1">Manage project workflows and approvals</p>
        </div>
      </div>

      {/* Task Status Tabs (Open Tasks by Default) */}
      <div className="flex border-b border-gray-200 gap-4 sm:gap-6 bg-white px-4 pt-3 rounded-xl shadow-sm border border-gray-100">
        <button
          type="button"
          onClick={() => {
            setActiveTab('Open');
            fetchTasks('Open');
          }}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'Open'
              ? 'border-[#0B3A2C] text-[#0B3A2C]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>Open Tasks</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            activeTab === 'Open' ? 'bg-[#0B3A2C]/10 text-[#0B3A2C]' : 'bg-gray-100 text-gray-600'
          }`}>
            {activeTab === 'Open' ? filteredTasks.length : tasks.filter(t => t.status !== 'Completed' && t.status !== 'Approved').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('Completed');
            fetchTasks('Completed');
          }}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'Completed'
              ? 'border-[#0B3A2C] text-[#0B3A2C]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span>Completed</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search tasks by customer, task name, assignee..." 
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
          Showing <span className="font-bold text-gray-900">{filteredTasks.length}</span> of {tasks.length} Tasks
        </div>
      </div>

      {/* Bulk selection action bar */}
      {selectedTaskIds.length > 0 && hasPermission('create_task') && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            <span><strong>{selectedTaskIds.length}</strong> tasks selected (Assigning all tasks is optional)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setBulkAssigneeId('');
                setBulkAssignModal({ isOpen: true });
              }}
              className="px-3.5 py-1.5 bg-[#0B3A2C] text-white rounded-lg text-xs font-bold hover:bg-[#124b39] transition-all flex items-center gap-1.5 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Assign Selected Tasks ({selectedTaskIds.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedTaskIds([])}
              className="px-3 py-1.5 bg-white text-gray-600 border border-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50/50">
                {hasPermission('create_task') && (
                  <th className="px-3 sm:px-4 py-3 sm:py-4 w-10 text-center">
                    <input 
                      type="checkbox"
                      checked={
                        filteredTasks.length > 0 &&
                        filteredTasks.filter(t => t.status !== 'Completed' && t.status !== 'Approved').length > 0 &&
                        filteredTasks.filter(t => t.status !== 'Completed' && t.status !== 'Approved').every(t => selectedTaskIds.includes(t._id))
                      }
                      onChange={(e) => {
                        const assignable = filteredTasks.filter(t => t.status !== 'Completed' && t.status !== 'Approved');
                        if (e.target.checked) {
                          setSelectedTaskIds(assignable.map(t => t._id));
                        } else {
                          setSelectedTaskIds([]);
                        }
                      }}
                      className="rounded text-[#0B3A2C] focus:ring-[#0B3A2C] cursor-pointer"
                      title="Select all assignable tasks"
                    />
                  </th>
                )}
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600 whitespace-nowrap">Project & Step</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600 whitespace-nowrap">Task Details</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600 whitespace-nowrap">Assignee</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600 whitespace-nowrap">Status</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600 whitespace-nowrap">Deadline</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-600 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={hasPermission('create_task') ? 7 : 6} className="px-6 py-8 text-center text-gray-500">Loading tasks...</td>
                </tr>
              ) : tasks.length === 0 || filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={hasPermission('create_task') ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                        <Check className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {searchTerm ? `No tasks match "${searchTerm}"` : (activeTab === 'Open' ? "No Open Tasks" : "No Completed Tasks")}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {activeTab === 'Open' ? "All assigned tasks have been completed. Great job!" : ""}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task._id} className="hover:bg-gray-50/50 transition-colors">
                    {hasPermission('create_task') && (
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-center">
                        {task.status !== 'Completed' && task.status !== 'Approved' ? (
                          <input 
                            type="checkbox"
                            checked={selectedTaskIds.includes(task._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTaskIds([...selectedTaskIds, task._id]);
                              } else {
                                setSelectedTaskIds(selectedTaskIds.filter(id => id !== task._id));
                              }
                            }}
                            className="rounded text-[#0B3A2C] focus:ring-[#0B3A2C] cursor-pointer"
                          />
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    )}
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div 
                        onClick={() => setViewModal({ isOpen: true, task })}
                        className="font-bold text-gray-900 hover:text-[#0B3A2C] cursor-pointer transition-colors"
                        title="Click to open task details"
                      >
                        {task.project?.customerName}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500 mt-1">
                        Step {task.stepNumber} <span className="mx-1">•</span> 
                        {task.project?.currentStep === task.stepNumber ? 
                          <span className="text-green-600 font-medium">Active Step</span> : 
                          (task.project?.currentStep > task.stepNumber ? "Passed" : "Locked")
                        }
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div 
                        onClick={() => setViewModal({ isOpen: true, task })}
                        className="font-semibold text-gray-900 hover:text-[#0B3A2C] cursor-pointer transition-colors"
                        title="Click to open task details"
                      >
                        {task.taskName}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500">{task.department?.name}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {task.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-700">{task.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {getStatusBadge(task.status)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {task.dueDate ? (
                        <CountdownTimer dueDate={task.dueDate} status={task.status} submittedAt={task.submittedAt} opsHeadReminderHours={task.opsHeadReminderHours} />
                      ) : (
                        <span className="text-[10px] sm:text-xs font-semibold px-2 py-1 bg-gray-50 text-gray-400 rounded-md border border-gray-100">Not set</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right flex justify-end gap-2 items-center whitespace-nowrap">
                      {/* View Task */}
                      <button
                        onClick={() => setViewModal({ isOpen: true, task })}
                        className="px-3 py-1.5 bg-gray-50 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
                      >
                        View
                      </button>

                      {/* Ops Head / Authorized: Assign or Reassign Task */}
                      {hasPermission('create_task') && task.status !== 'Completed' && task.status !== 'Approved' && (
                        <button
                          onClick={() => {
                            setAssigneeId(task.assignedTo?._id || '');
                            setAssignModal({ isOpen: true, taskId: task._id });
                          }}
                          className={`px-3 py-1.5 text-white text-xs font-bold rounded-lg transition-colors ${
                            task.assignedTo ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-[#0B3A2C] hover:bg-opacity-90'
                          }`}
                        >
                          {task.assignedTo ? 'Reassign' : 'Assign Task'}
                        </button>
                      )}

                      {/* Employee: Submit Task */}
                      {(task.status === 'In Progress' || task.status === 'Rejected') && task.assignedTo?._id === userProfile?._id && (
                        <button
                          onClick={() => {
                            setSubmitModal({ isOpen: true, task });
                            setSubmitDocs({});
                            setSubmitRemark('');
                          }}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Upload className="h-4 w-4" /> Submit Work
                        </button>
                      )}

                      {/* Ops Head / Authorized: Approve Task */}
                      {hasPermission('manage_project_workflow') && task.status === 'Submitted' && (
                        <button
                          onClick={() => setApproveModal({ isOpen: true, task })}
                          className="px-3 py-1.5 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Check className="h-4 w-4" /> Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Assign Modal */}
      {bulkAssignModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 border-t-4 border-[#0B3A2C]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#0B3A2C]" />
                  Assign Multiple Tasks
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Assigning <strong>{selectedTaskIds.length}</strong> selected tasks at once.
                </p>
              </div>
              <button 
                onClick={() => setBulkAssignModal({ isOpen: false })}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selected tasks mini list */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-1">Selected Tasks ({selectedTaskIds.length}):</label>
              <div className="max-h-36 overflow-y-auto space-y-1.5 border border-gray-100 rounded-lg p-2.5 bg-gray-50 text-xs">
                {tasks.filter(t => selectedTaskIds.includes(t._id)).map(t => (
                  <div key={t._id} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                    <div>
                      <span className="font-semibold text-gray-800">{t.taskName}</span>
                      <span className="text-[10px] text-gray-500 ml-1.5">({t.project?.customerName || 'Project'})</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded font-bold">
                      Step {t.stepNumber}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleBulkAssignSubmit}>
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Select Employee to Assign <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={bulkAssigneeId}
                  onChange={(e) => setBulkAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B3A2C]"
                >
                  <option value="">-- Choose Employee --</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.role?.name || u.department || 'Staff'})</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-[11px] text-emerald-800 mb-4">
                Assigning these tasks will set their status to "In Progress" and calculate their TAT deadlines. Assigning all tasks is optional.
              </div>

              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setBulkAssignModal({ isOpen: false })} 
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingBulkAssign || !bulkAssigneeId}
                  className="px-4 py-2 text-xs font-bold bg-[#0B3A2C] text-white rounded-lg hover:bg-[#124b39] disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {isSavingBulkAssign ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Confirm & Assign ({selectedTaskIds.length})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Assign Task</h2>
            <form onSubmit={handleAssignSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
                <select
                  required
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#0B3A2C]"
                >
                  <option value="">-- Choose Employee --</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.role?.name})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setAssignModal({ isOpen: false, taskId: null })} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#0B3A2C] text-white rounded-lg">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Task Modal */}
      {submitModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-none shadow-2xl w-full max-w-md overflow-hidden flex flex-col border-t-4 border-[#0B3A2C]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/80">
              <div>
                <h3 className="text-lg font-bold text-[#0B3A2C]">Submit Task Work</h3>
                <p className="text-xs text-gray-500 mt-1">Provide links/documents and complete this task.</p>
              </div>
              <button 
                onClick={() => setSubmitModal({ isOpen: false, task: null })}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-none transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="mb-5 p-4 bg-[#0B3A2C]/5 border border-[#0B3A2C]/10 rounded-lg">
                <h3 className="font-bold text-xs text-[#0B3A2C] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Required Documents
                </h3>
                {submitModal.task?.requiredDocuments?.length === 0 ? (
                  <p className="text-sm text-gray-500">No documents required for this step.</p>
                ) : (
                  <div className="space-y-4">
                    {submitModal.task?.requiredDocuments?.map((doc, idx) => (
                      <div key={idx}>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">{doc.documentName} <span className="text-red-500">*</span></label>
                        <input 
                          type="file"
                          required
                          className="w-full text-sm bg-white border border-gray-200 rounded-lg focus:border-[#0B3A2C] focus:ring-1 focus:ring-[#0B3A2C]/20 focus:outline-none transition-all file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-semibold file:bg-[#0B3A2C]/10 file:text-[#0B3A2C] hover:file:bg-[#0B3A2C]/20"
                          onChange={(e) => setSubmitDocs({...submitDocs, [doc.documentName]: e.target.files[0]})}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {submitModal.task?.referenceDocuments?.length > 0 && (
                <div className="mb-5 p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <h3 className="font-bold text-xs text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Eye className="w-4 h-4" /> Reference Documents (From Admin)
                  </h3>
                  <div className="space-y-2">
                    {submitModal.task.referenceDocuments.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white border border-emerald-100 p-2.5 rounded-xl">
                        <span className="text-sm font-medium text-gray-700">{doc.documentName}</span>
                        <a href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${doc.fileUrl}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">View Link</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmitWork}>
                <div className="mb-6">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Remarks (Optional)</label>
                  <textarea
                    rows="3"
                    value={submitRemark}
                    onChange={(e) => setSubmitRemark(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#0B3A2C] focus:ring-1 focus:ring-[#0B3A2C]/20 focus:outline-none resize-none transition-all"
                    placeholder="Any comments or notes for your manager..."
                  ></textarea>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setSubmitModal({ isOpen: false, task: null })} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-none transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-semibold bg-[#0B3A2C] hover:bg-[#124b39] text-white rounded-none shadow-sm flex items-center gap-2 transition-colors">
                    <Check className="w-4 h-4" />
                    Submit for Approval
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Approve Task Modal */}
      {approveModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Review Submitted Work</h2>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-sm text-gray-700 mb-2">Submitted Documents</h3>
              {approveModal.task?.requiredDocuments?.length === 0 ? (
                <p className="text-sm text-gray-500">No documents were required.</p>
              ) : (
                <ul className="space-y-2">
                  {approveModal.task?.requiredDocuments?.map((doc, idx) => (
                    <li key={idx} className="text-sm flex items-center justify-between bg-white p-2 border rounded">
                      <span className="font-medium">{doc.documentName}</span>
                      <a href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${doc.fileUrl}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View File</a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form onSubmit={handleApproveSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Decision</label>
                <select
                  value={approveStatus}
                  onChange={(e) => setApproveStatus(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#0B3A2C]"
                >
                  <option value="Approved">Approve (Move to Next Step)</option>
                  <option value="Rejected">Reject (Send back to Employee)</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback / Remarks</label>
                <textarea
                  rows="3"
                  value={approveRemark}
                  onChange={(e) => setApproveRemark(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-[#0B3A2C] resize-none"
                  placeholder="Feedback for the employee..."
                ></textarea>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setApproveModal({ isOpen: false, task: null })} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className={`px-4 py-2 text-white rounded-lg ${approveStatus === 'Approved' ? 'bg-green-600' : 'bg-red-600'}`}>
                  {approveStatus === 'Approved' ? 'Approve & Unlock Next' : 'Reject Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Task Modal */}
      {viewModal.isOpen && viewModal.task && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Task Details</h3>
              <button 
                  onClick={() => setViewModal({ isOpen: false, task: null })}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                  <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              {/* Project & Step Banner */}
              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Project Customer</p>
                  <p className="text-sm font-bold text-gray-900">{viewModal.task.project?.customerName || 'Project'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Workflow Step</span>
                  <span className="text-xs font-bold px-2 py-0.5 bg-emerald-700 text-white rounded-md">
                    Step {viewModal.task.stepNumber}
                  </span>
                </div>
              </div>

              {/* Closed Status Notice */}
              {(viewModal.task.status === 'Completed' || viewModal.task.status === 'Approved') && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>This task has been <strong>Approved & Closed</strong> on {new Date(viewModal.task.completedAt || viewModal.task.updatedAt).toLocaleDateString()}.</span>
                </div>
              )}

              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Task Name</p>
                <p className="text-base font-semibold text-gray-900">{viewModal.task.taskName}</p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">{viewModal.task.department?.name || 'Operations'} Department</p>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Description / Instructions</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {viewModal.task.description || 'No description provided.'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Assigned To</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {viewModal.task.assignedTo?.name || 'Unassigned'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Status</p>
                  <div className="mt-1">{getStatusBadge(viewModal.task.status)}</div>
                </div>
              </div>

              {viewModal.task.requiredDocuments?.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Required Documents</p>
                  <div className="space-y-2">
                    {viewModal.task.requiredDocuments.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 p-2.5 rounded-xl">
                        <span className="text-sm font-medium text-gray-700">{doc.documentName}</span>
                        {doc.isUploaded ? (
                          <a href={doc.fileUrl?.startsWith('http') ? doc.fileUrl : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${doc.fileUrl}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">View Link</a>
                        ) : (
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">Pending Upload</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewModal.task.referenceDocuments?.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Reference Documents</p>
                  <div className="space-y-2">
                    {viewModal.task.referenceDocuments.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-xl">
                        <span className="text-sm font-medium text-emerald-800">{doc.documentName}</span>
                        <a href={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${doc.fileUrl}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-700 bg-white border border-emerald-200 px-2 py-1 rounded-lg">View File</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with quick actions */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setViewModal({ isOpen: false, task: null })}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>

              {/* Quick Submit Work button if task is assigned to current user */}
              {(viewModal.task.status === 'In Progress' || viewModal.task.status === 'Rejected') && viewModal.task.assignedTo?._id === userProfile?._id && (
                <button
                  type="button"
                  onClick={() => {
                    const taskToSubmit = viewModal.task;
                    setViewModal({ isOpen: false, task: null });
                    setSubmitModal({ isOpen: true, task: taskToSubmit });
                    setSubmitDocs({});
                    setSubmitRemark('');
                  }}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Submit Work
                </button>
              )}

              {/* Quick Review / Approve button for Ops Head / Admin */}
              {hasPermission('manage_project_workflow') && viewModal.task.status === 'Submitted' && (
                <button
                  type="button"
                  onClick={() => {
                    const taskToApprove = viewModal.task;
                    setViewModal({ isOpen: false, task: null });
                    setApproveModal({ isOpen: true, task: taskToApprove });
                  }}
                  className="px-4 py-2 text-xs font-bold bg-[#0B3A2C] hover:bg-[#124b39] text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Review & Approve
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Tasks;
