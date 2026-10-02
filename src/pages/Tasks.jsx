import React, { useState, useEffect } from 'react';
import { CheckSquare, User, Clock, AlertCircle, FileText, Check, X, ArrowRight, Play, Upload } from 'lucide-react';
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
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [userProfile, setUserProfile] = useState(null);
  const [permissions, setPermissions] = useState([]);

  // Modals state
  const [assignModal, setAssignModal] = useState({ isOpen: false, taskId: null });
  const [submitModal, setSubmitModal] = useState({ isOpen: false, task: null });
  const [approveModal, setApproveModal] = useState({ isOpen: false, task: null });
  const [viewModal, setViewModal] = useState({ isOpen: false, task: null });

  // Form states
  const [assigneeId, setAssigneeId] = useState('');
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

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/operations/tasks');
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
      case 'Completed': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Completed</span>;
      case 'Rejected': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Rejected</span>;
      case 'Overdue': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Overdue</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const hasPermission = (perm) => {
    if (userProfile?.role?.name === 'Admin') return true;
    return permissions.includes(perm);
  };

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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50/50">
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
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Loading tasks...</td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No tasks found.</td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{task.project?.customerName}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 mt-1">
                        Step {task.stepNumber} <span className="mx-1">•</span> 
                        {task.project?.currentStep === task.stepNumber ? 
                          <span className="text-green-600 font-medium">Active Step</span> : 
                          (task.project?.currentStep > task.stepNumber ? "Passed" : "Locked")
                        }
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{task.taskName}</div>
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

                      {/* Ops Head / Authorized: Assign Task */}
                      {hasPermission('create_task') && task.status === 'Pending' && task.project?.currentStep === task.stepNumber && (
                        <button
                          onClick={() => setAssignModal({ isOpen: true, taskId: task._id })}
                          className="px-3 py-1.5 bg-[#0B3A2C] text-white text-sm rounded-lg hover:bg-opacity-90 transition-colors"
                        >
                          Assign Task
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
                      <a href={`http://localhost:5000${doc.fileUrl}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View File</a>
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
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Task Name</p>
                <p className="text-base font-semibold text-gray-900">{viewModal.task.taskName}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Description</p>
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
                          <a href={doc.fileUrl.startsWith('http') ? doc.fileUrl : `http://localhost:5000${doc.fileUrl}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">View Link</a>
                        ) : (
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">Pending</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Tasks;
