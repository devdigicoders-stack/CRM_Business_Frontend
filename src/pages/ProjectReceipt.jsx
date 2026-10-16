import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/axiosConfig';
import { Loader2, Printer, ArrowLeft, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const ProjectReceipt = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProjectDetails = async () => {
            try {
                // We fetch all projects and find this one because the backend might not have a getProjectById route yet
                const res = await apiClient.get('/operations/projects');
                const found = res.data.find(p => p._id === id);
                if (found) {
                    setProject(found);
                } else {
                    toast.error("Project not found");
                }
            } catch (error) {
                console.error("Error fetching project for receipt:", error);
                toast.error("Failed to load project details");
            } finally {
                setIsLoading(false);
            }
        };
        fetchProjectDetails();
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-[#0B3A2C]" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-gray-50">
                <h2 className="text-xl font-bold mb-4">Receipt Not Found</h2>
                <button onClick={() => navigate(-1)} className="text-[#0B3A2C] underline">Go Back</button>
            </div>
        );
    }

    // Receipt is only available once project status is Completed
    if (project.status !== 'Completed') {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 text-center space-y-4 border-t-4 border-amber-500">
                    <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Receipt Not Available Yet</h2>
                    <p className="text-sm text-gray-600">
                        The final Installation & Handover Receipt can only be generated after the project execution is marked as <strong>Completed</strong>.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-xl text-left text-xs space-y-2 border border-gray-100">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Customer:</span> 
                            <strong className="text-gray-900">{project.customerName}</strong>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Current Status:</span> 
                            <span className="px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800">{project.status}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Workflow Stage:</span> 
                            <span className="font-semibold text-gray-700">{project.workflowStage || 'Pending Registration'}</span>
                        </div>
                    </div>
                    <div className="pt-2 flex justify-center">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="px-6 py-2.5 bg-[#0B3A2C] hover:bg-[#124b39] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 font-sans">
            <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-lg shadow-sm font-semibold transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={() => window.print()} className="flex items-center gap-2 bg-[#0B3A2C] hover:bg-[#124b39] text-white px-6 py-2 rounded-lg shadow-sm font-bold transition-colors">
                    <Printer className="w-4 h-4" /> Print Receipt
                </button>
            </div>

            {/* A4 Print Container */}
            <div className="max-w-4xl mx-auto bg-white shadow-xl print:shadow-none print:w-full print:max-w-none">
                <div className="p-10 border-t-8 border-[#0B3A2C]">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-8">
                        <div>
                            <img src="/logo.png" alt="Company Logo" className="h-20 object-contain mb-4" />
                            <h1 className="text-3xl font-extrabold text-[#0B3A2C] uppercase tracking-wider">Installation Receipt</h1>
                            <p className="text-sm font-medium text-gray-500 mt-1">Handover & Warranty Certificate</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-sm font-bold text-gray-900">RAM MILAN SINGH CHARITABLE TRUST</p>
                            <p className="text-xs text-gray-600">Uttar Pradesh, India</p>
                            <p className="text-xs font-semibold text-gray-800 mt-3">Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            <p className="text-xs font-semibold text-gray-800">Status: {project.status}</p>
                        </div>
                    </div>

                    {/* Customer Details */}
                    <div className="grid grid-cols-2 gap-8 mb-10">
                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                            <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Customer Details</h3>
                            <p className="text-lg font-bold text-gray-900 mb-1">{project.customerName}</p>
                            {project.lead?.contactNumber && <p className="text-sm text-gray-600 font-medium">{project.lead.contactNumber}</p>}
                            {project.lead?.address && <p className="text-sm text-gray-600 mt-1">{project.lead.address}</p>}
                        </div>
                        <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100">
                            <h3 className="text-[10px] font-extrabold text-emerald-600/70 uppercase tracking-widest mb-3">Project Information</h3>
                            <div className="space-y-2">
                                <p className="text-sm text-gray-800"><span className="font-semibold text-emerald-900">Project Started:</span> {new Date(project.startDate).toLocaleDateString()}</p>
                                <p className="text-sm text-gray-800"><span className="font-semibold text-emerald-900">Total Value:</span> ₹{project.paymentData?.totalAmount?.toLocaleString('en-IN') || 'N/A'}</p>
                                <p className="text-sm text-gray-800"><span className="font-semibold text-emerald-900">Operations Head:</span> {project.operationHead?.name || 'Assigned'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Hardware List */}
                    <div className="mb-12">
                        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-amber-500 rounded-full inline-block"></span>
                            Installed Hardware & Serial Numbers
                        </h3>
                        
                        {(!project.installedEquipments || project.installedEquipments.length === 0) ? (
                            <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-500 font-medium">No hardware details have been logged for this project yet.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-[#0B3A2C] text-white">
                                    <tr>
                                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider rounded-tl-lg">S.No</th>
                                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider">Item / Equipment Name</th>
                                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider">Serial Number</th>
                                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-center rounded-tr-lg">Qty</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 border-x border-b border-gray-100 rounded-b-lg">
                                    {project.installedEquipments.map((eq, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 px-4 text-sm font-semibold text-gray-500">{index + 1}</td>
                                            <td className="py-4 px-4 text-sm font-bold text-gray-900">{eq.itemName}</td>
                                            <td className="py-4 px-4 text-sm font-mono font-medium text-amber-600 bg-amber-50 inline-block mt-2 mb-2 ml-4 px-2 py-0.5 rounded">{eq.serialNumber}</td>
                                            <td className="py-4 px-4 text-sm font-bold text-gray-700 text-center">{eq.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-2 gap-8 mt-24">
                        <div className="text-center">
                            <div className="w-48 border-b-2 border-gray-300 mx-auto mb-2"></div>
                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Customer Signature</p>
                        </div>
                        <div className="text-center">
                            <div className="w-48 border-b-2 border-gray-300 mx-auto mb-2"></div>
                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Authorized Signatory</p>
                        </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="mt-16 pt-6 border-t border-gray-200 text-center">
                        <p className="text-xs text-gray-400 font-medium">This is a computer-generated receipt and does not require a physical signature.</p>
                        <p className="text-xs text-gray-400 mt-1">For warranty claims, please produce this certificate with the exact serial numbers matched.</p>
                    </div>

                </div>
            </div>
            
            <style jsx global>{`
                @media print {
                    body { background: white !important; }
                    .print\\:hidden { display: none !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:w-full { width: 100% !important; }
                    .print\\:max-w-none { max-width: none !important; }
                    @page { margin: 0; size: A4 portrait; }
                }
            `}</style>
        </div>
    );
};

export default ProjectReceipt;
