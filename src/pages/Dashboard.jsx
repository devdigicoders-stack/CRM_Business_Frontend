import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Briefcase, IndianRupee,
  CheckCircle2, Clock, AlertTriangle, TrendingUp,
  FileText, Target, ArrowUpRight, Loader2,
  CheckSquare, XCircle, RotateCcw, Activity
} from 'lucide-react';
import apiClient from '../api/axiosConfig';

// ─── Stat Card ──────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = 'emerald', onClick }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue:    'bg-blue-50 text-blue-600 border-blue-100',
    amber:   'bg-amber-50 text-amber-600 border-amber-100',
    red:     'bg-red-50 text-red-600 border-red-100',
    purple:  'bg-purple-50 text-purple-600 border-purple-100',
    indigo:  'bg-indigo-50 text-indigo-600 border-indigo-100',
    green:   'bg-green-50 text-green-600 border-green-100',
    orange:  'bg-orange-50 text-orange-600 border-orange-100',
  };
  return (
    <div
      onClick={onClick}
      className={`bg-white p-3 sm:p-5 rounded-xl border border-gray-100 shadow-sm flex items-center sm:items-start gap-2 sm:gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl border flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] sm:text-xs text-gray-500 font-medium truncate">{label}</p>
        <p className="text-base sm:text-2xl font-bold text-gray-900 mt-0.5 truncate">{value ?? '—'}</p>
        {sub && <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
};

// ─── Section Header ──────────────────────────────────────────
const Section = ({ title, children }) => (
  <div>
    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">{title}</h2>
    {children}
  </div>
);

// ─── Status Badge ─────────────────────────────────────────────
const Badge = ({ status }) => {
  const map = {
    'Pending':   'bg-gray-100 text-gray-600',
    'New':       'bg-gray-100 text-gray-600',
    'In Progress':'bg-blue-100 text-blue-700',
    'Submitted': 'bg-yellow-100 text-yellow-700',
    'Completed': 'bg-green-100 text-green-700',
    'Rejected':  'bg-red-100 text-red-700',
    'Closed-Won':'bg-emerald-100 text-emerald-700',
    'Closed-Lost':'bg-red-100 text-red-700',
    'Contacted': 'bg-blue-100 text-blue-700',
    'Approved':  'bg-green-100 text-green-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────
const Dashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(stored);
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/dashboard/master');
      setData(res.data.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-[#0B3A2C] animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="text-center py-20 text-gray-400">Failed to load dashboard.</div>
  );

  const role = data.role;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
            {greeting()}, {user?.name || 'User'}! 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Here's your overview for today.</p>
        </div>
        <div className="self-start sm:self-auto">
          <span className="px-3 py-1.5 bg-[#0B3A2C]/10 text-[#0B3A2C] rounded-full text-xs font-bold whitespace-nowrap">{role}</span>
        </div>
      </div>

      {/* ────── ADMIN DASHBOARD ────── */}
      {role === 'Admin' && (
        <>
          <Section title="Leads Overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Total Leads" value={data.leads?.total} color="blue" />
              <StatCard icon={Clock} label="Pending / New" value={data.leads?.pending} color="amber" />
              <StatCard icon={Activity} label="In Progress" value={data.leads?.inProgress} color="indigo" />
              <StatCard icon={CheckCircle2} label="Closed Won" value={data.leads?.closedWon} color="emerald" />
            </div>
          </Section>

          <Section title="Quotations">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard icon={FileText} label="Total Quotations" value={data.quotations?.total} color="purple" />
              <StatCard icon={Clock} label="Pending Approval" value={data.quotations?.pending} color="amber" />
              <StatCard icon={CheckCircle2} label="Approved" value={data.quotations?.approved} color="emerald" />
            </div>
          </Section>

          <Section title="Projects">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Briefcase} label="Total Projects" value={data.projects?.total} color="blue" />
              <StatCard icon={Activity} label="Active" value={data.projects?.active} color="indigo" />
              <StatCard icon={CheckCircle2} label="Completed" value={data.projects?.completed} color="green" />
              <StatCard icon={Clock} label="Pending" value={data.projects?.pending} color="amber" />
            </div>
          </Section>

          <Section title="Tasks">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={CheckSquare} label="Pending" value={data.tasks?.pending} color="amber" />
              <StatCard icon={Activity} label="In Progress" value={data.tasks?.inProgress} color="blue" />
              <StatCard icon={Clock} label="Awaiting Approval" value={data.tasks?.submitted} color="purple" />
              <StatCard icon={AlertTriangle} label="Overdue" value={data.tasks?.overdue} color="red" />
            </div>
          </Section>

          <Section title="Payments & Revenue">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={IndianRupee} label="Total Invoiced" value={`₹${(data.payments?.totalRevenue || 0).toLocaleString('en-IN')}`} color="blue" />
              <StatCard icon={TrendingUp} label="Collected" value={`₹${(data.payments?.totalCollected || 0).toLocaleString('en-IN')}`} color="green" />
              <StatCard icon={Clock} label="Pending Amount" value={`₹${(data.payments?.totalPending || 0).toLocaleString('en-IN')}`} color="red" />
              <StatCard icon={Users} label="Pending Accounts" value={data.payments?.pendingCount} color="amber" />
            </div>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Leads */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-4 text-sm">Recent Leads</h3>
              {data.recentLeads?.length > 0 ? (
                <div className="space-y-3">
                  {data.recentLeads.map((l, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{l.customerName}</p>
                        <p className="text-xs text-gray-400">{l.contactNumber}</p>
                      </div>
                      <Badge status={l.status} />
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-gray-400">No leads found.</p>}
            </div>

            {/* Overdue Tasks */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-4 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" /> Overdue Tasks
              </h3>
              {data.overdueTasksList?.length > 0 ? (
                <div className="space-y-3">
                  {data.overdueTasksList.map((t, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{t.taskName}</p>
                        <p className="text-xs text-gray-400">{t.assignedTo?.name} · {t.project?.customerName}</p>
                      </div>
                      <Badge status={t.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">No overdue tasks!</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ────── SALES DASHBOARD ────── */}
      {role !== 'Admin' && data.leads && !data.projects && (
        <>
          <Section title="My Leads">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Users} label="My Total Leads" value={data.leads?.myTotal} color="blue" />
              <StatCard icon={Clock} label="Pending / New" value={data.leads?.pending} color="amber" />
              <StatCard icon={Activity} label="In Progress" value={data.leads?.inProgress} color="indigo" />
              <StatCard icon={CheckCircle2} label="Closed Won" value={data.leads?.closedWon} color="emerald" />
            </div>
          </Section>

          <Section title="My Quotations & Revenue">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard icon={FileText} label="My Quotations" value={data.quotations?.myTotal} color="purple" />
              <StatCard icon={Clock} label="Pending Approval" value={data.quotations?.pending} color="amber" />
              <StatCard icon={TrendingUp} label="My Revenue" value={`₹${(data.revenue || 0).toLocaleString('en-IN')}`} color="green" />
            </div>
          </Section>

          {/* Recent leads */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-4 text-sm">My Recent Leads</h3>
            {data.recentLeads?.length > 0 ? (
              <div className="space-y-3">
                {data.recentLeads.map((l, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{l.customerName}</p>
                      <p className="text-xs text-gray-400">{l.contactNumber}</p>
                    </div>
                    <Badge status={l.status} />
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-gray-400">No leads yet.</p>}
          </div>
        </>
      )}

      {/* ────── OPERATION HEAD DASHBOARD ────── */}
      {role !== 'Admin' && data.projects && (
        <>
          <Section title="My Projects">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Briefcase} label="My Projects" value={data.projects?.my} color="blue" />
              <StatCard icon={Activity} label="Active" value={data.projects?.active} color="indigo" />
              <StatCard icon={CheckCircle2} label="Completed" value={data.projects?.completed} color="green" />
              <StatCard icon={Clock} label="Pending" value={data.projects?.pending} color="amber" />
            </div>
          </Section>

          <Section title="Task Status">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={CheckSquare} label="Tasks Assigned" value={data.tasks?.assigned} color="blue" />
              <StatCard icon={Clock} label="Awaiting My Approval" value={data.tasks?.pendingApproval} color="purple" />
              <StatCard icon={CheckCircle2} label="Completed" value={data.tasks?.completed} color="green" />
              <StatCard icon={AlertTriangle} label="Overdue" value={data.tasks?.overdue} color="red" />
            </div>
          </Section>

          <Section title="Payments">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard icon={IndianRupee} label="Total Revenue" value={`₹${(data.payments?.totalRevenue || 0).toLocaleString('en-IN')}`} color="blue" />
              <StatCard icon={TrendingUp} label="Collected" value={`₹${(data.payments?.totalCollected || 0).toLocaleString('en-IN')}`} color="green" />
              <StatCard icon={Clock} label="Pending Amount" value={`₹${(data.payments?.totalPending || 0).toLocaleString('en-IN')}`} color="red" />
            </div>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pending Approval */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-4 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" /> Awaiting Approval
              </h3>
              {data.pendingApprovalList?.length > 0 ? (
                <div className="space-y-3">
                  {data.pendingApprovalList.map((t, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{t.taskName}</p>
                        <p className="text-xs text-gray-400">{t.assignedTo?.name} · {t.project?.customerName}</p>
                      </div>
                      <Badge status="Submitted" />
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-gray-400">No tasks pending approval.</p>}
            </div>

            {/* Overdue */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-4 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" /> Overdue Tasks
              </h3>
              {data.overdueTasksList?.length > 0 ? (
                <div className="space-y-3">
                  {data.overdueTasksList.map((t, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{t.taskName}</p>
                        <p className="text-xs text-gray-400">{t.assignedTo?.name} · {t.project?.customerName}</p>
                      </div>
                      <Badge status={t.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">All tasks on track!</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ────── EMPLOYEE DASHBOARD ────── */}
      {role !== 'Admin' && !data.leads && !data.projects && data.tasks && (
        <>
          <Section title="My Tasks">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={CheckSquare} label="Total Tasks" value={data.tasks?.total} color="blue" />
              <StatCard icon={Clock} label="Pending" value={data.tasks?.pending} color="amber" />
              <StatCard icon={Activity} label="In Progress" value={data.tasks?.inProgress} color="indigo" />
              <StatCard icon={ArrowUpRight} label="Submitted" value={data.tasks?.submitted} color="purple" />
            </div>
          </Section>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard icon={CheckCircle2} label="Completed" value={data.tasks?.completed} color="green" />
            <StatCard icon={XCircle} label="Rejected" value={data.tasks?.rejected} color="red" />
            <StatCard icon={AlertTriangle} label="Overdue" value={data.tasks?.overdue} color="red" />
          </div>

          {/* Recent Tasks */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-4 text-sm">My Recent Tasks</h3>
            {data.recentTasks?.length > 0 ? (
              <div className="space-y-3">
                {data.recentTasks.map((t, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{t.taskName}</p>
                      <p className="text-xs text-gray-400">{t.project?.customerName}</p>
                      {t.isTATBreached && <span className="text-[10px] text-red-500 font-bold">⚠ TAT Breached</span>}
                    </div>
                    <Badge status={t.status} />
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-gray-400">No tasks assigned yet.</p>}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
