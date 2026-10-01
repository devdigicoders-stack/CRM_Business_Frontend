import React, { useState } from 'react';
import { 
  Download, Filter, TrendingUp, TrendingDown, 
  DollarSign, Users, Briefcase, Activity, Calendar
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const revenueData = [
  { month: 'Jan', revenue: 4000, target: 3000 },
  { month: 'Feb', revenue: 5500, target: 4000 },
  { month: 'Mar', revenue: 4800, target: 4500 },
  { month: 'Apr', revenue: 7500, target: 5000 },
  { month: 'May', revenue: 8200, target: 6000 },
  { month: 'Jun', revenue: 9500, target: 7500 },
];

const sourceData = [
  { name: 'Website', value: 45 },
  { name: 'Referral', value: 25 },
  { name: 'Social', value: 20 },
  { name: 'Direct', value: 10 },
];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6366f1'];

const Reports = () => {
  const [timeRange] = useState('Last 6 Months');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Detailed insights into your business performance</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold shadow-sm hover:bg-gray-50 transition-colors">
            <Calendar className="w-4 h-4 text-gray-500" /> {timeRange}
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0B3A2C] text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-[#0a2f23] transition-colors">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Revenue', value: '$84,520', icon: DollarSign, trend: '+12.5%', isUp: true },
          { title: 'New Customers', value: '1,245', icon: Users, trend: '+8.2%', isUp: true },
          { title: 'Active Deals', value: '142', icon: Briefcase, trend: '-2.4%', isUp: false },
          { title: 'Conversion Rate', value: '24.8%', icon: Activity, trend: '+4.1%', isUp: true },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-[#eefcf5] text-[#0B3A2C] rounded-xl group-hover:scale-110 transition-transform duration-300">
                <stat.icon className="w-6 h-6" />
              </div>
              <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${stat.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                {stat.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stat.trend}
              </span>
            </div>
            <h3 className="text-gray-500 text-sm font-semibold">{stat.title}</h3>
            <p className="text-3xl font-black text-gray-900 mt-1 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Revenue vs Target</h3>
              <p className="text-xs text-gray-500 mt-0.5">Monthly performance comparison</p>
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B3A2C" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0B3A2C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 600 }} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" name="Actual Revenue" stroke="#0B3A2C" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="target" name="Target" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Sources Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Lead Sources</h3>
            <p className="text-xs text-gray-500 mt-0.5">Where your customers come from</p>
          </div>
          
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold', color: '#111827' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-auto space-y-3 pt-4 border-t border-gray-50">
            {sourceData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-md shadow-sm" style={{ backgroundColor: COLORS[index] }}></div>
                  <span className="text-sm font-medium text-gray-600">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Reports;
