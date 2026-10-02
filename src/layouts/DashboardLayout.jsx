import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, Users, UserCircle, Briefcase, CheckSquare, 
    Calendar as CalendarIcon, Shield, Building2,
    Settings, Bell, User, Menu, LogOut, Key, ClipboardList, Trophy, Package, CreditCard, Wallet, Receipt
} from 'lucide-react';
import apiClient from '../api/axiosConfig';

const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: null },
    // 'Leads' - shown to Admin, Sales Manager, Operation Head (anyone with view_leads or create_lead)
    { name: 'Leads', path: '/dashboard/leads', icon: UserCircle, permission: 'view_leads' },
    { name: 'Quotation', path: '/dashboard/sales', icon: Briefcase, permission: 'view_quotations' },
    { name: 'Projects', path: '/dashboard/projects', icon: Briefcase, permission: 'view_projects' },
    { name: 'Tasks & Activities', path: '/dashboard/tasks', icon: CheckSquare, permission: null },
    { name: 'Calendar', path: '/dashboard/calendar', icon: CalendarIcon, permission: 'view_calendar' },
    { name: 'Products', path: '/dashboard/products', icon: Package, permission: 'manage_products' },
    { name: 'Payments', path: '/dashboard/payments', icon: CreditCard, permission: 'view_payments' },
    { name: 'Users', path: '/dashboard/users', icon: Shield, permission: 'view_users' },
    { name: 'Incentives', path: '/dashboard/incentives', icon: Trophy, permission: 'add_incentive' },
    { name: 'Roles & Permissions', path: '/dashboard/roles', icon: Key, permission: 'view_roles' },
    { name: 'Departments', path: '/dashboard/departments', icon: Building2, permission: null },
    { name: 'Task Templates', path: '/dashboard/task-templates', icon: ClipboardList, permission: 'manage_settings' },

    { name: 'Profile', path: '/dashboard/profile', icon: User, permission: null },
    { name: 'My Earnings', path: '/dashboard/my-earnings', icon: Wallet, permission: null },
    { name: 'My Expenses', path: '/dashboard/my-expenses', icon: Receipt, permission: null },
    { name: 'Manage Expenses', path: '/dashboard/manage-expenses', icon: Receipt, permission: 'manage_expenses' },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings, permission: 'update_settings' },
];

const DashboardLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState(null);

    // Close mobile menu when navigating to a new route
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location]);

    // Fetch user profile to get roles and permissions
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await apiClient.get('/auth/profile');
                setUser(res.data.user);
            } catch (err) {
                console.error("Error fetching profile", err);
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = () => {
        // Remove authentication token
        localStorage.removeItem('token');
        // Optional: you can also clear other auth-related local storage items here
        
        // Redirect to login page
        navigate('/');
    };

    return (
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
            
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity" 
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-50
                bg-[#0B3A2C] text-gray-300 flex flex-col h-full 
                transition-all duration-300 ease-in-out shadow-xl md:shadow-none
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                ${isCollapsed ? 'md:w-[84px]' : 'w-64'}
            `}>
                {/* Logo Area */}
                <div className="py-4 flex items-center justify-center border-b border-[#124b39]/50 shrink-0 overflow-hidden min-h-[100px]">
                    <div className={`flex items-center px-4 w-full justify-center`}>
                        <div className={`transition-all duration-300 overflow-hidden flex items-center justify-center w-full`}>
                            <img 
                                src="/logo.png" 
                                alt="CRM Pro" 
                                className={`transition-all duration-300 object-contain bg-white p-2 rounded-xl shadow-md ${isCollapsed ? 'w-12 h-12' : 'w-full h-auto max-h-[120px] max-w-[240px]'}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                    {navItems.filter(item => {
                        const isAdmin = user?.role?.name === 'Admin';
                        const isSalesExec = user?.role?.name === 'Sales Executive';
                        const userPermissions = user?.role?.permissions || [];
                        const hasManageLeads = isAdmin || userPermissions.includes('manage_leads');

                        // 'Leads' → hide from Sales Executive if they only have my_leads_only, but show if they actually have view_leads or create_lead
                        if (item.permission === 'view_leads') {
                            return isAdmin || userPermissions.includes('view_leads') || userPermissions.includes('create_lead');
                        }

                        if (item.name === 'Users') {
                            return isAdmin || userPermissions.includes('manage_employees');
                        }

                        // No permission required = show to all
                        if (!item.permission) return true;

                        // Admin sees everything
                        if (isAdmin) return true;

                        // Otherwise check exact permission
                        return userPermissions.includes(item.permission);
                    }).map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link 
                                key={item.name} 
                                to={item.path}
                                title={isCollapsed ? item.name : ''}
                                className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                                    isActive 
                                    ? 'bg-emerald-700 text-white shadow-sm' 
                                    : 'hover:bg-[#124b39] hover:text-white'
                                } ${isCollapsed ? 'md:justify-center' : 'gap-3'}`}
                            >
                                <Icon className={`shrink-0 ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${isActive ? 'text-white' : 'text-emerald-400/80 transition-colors'}`} />
                                <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                                    isCollapsed ? 'md:w-0 md:opacity-0' : 'w-auto opacity-100'
                                }`}>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="p-3 mt-auto shrink-0 border-t border-[#124b39]/50">
                    <button 
                        onClick={handleLogout}
                        title={isCollapsed ? 'Logout' : ''}
                        className={`flex items-center w-full px-3 py-3 rounded-lg transition-all duration-200 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 ${isCollapsed ? 'md:justify-center' : 'gap-3'}`}
                    >
                        <LogOut className={`shrink-0 ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
                        <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                            isCollapsed ? 'md:w-0 md:opacity-0' : 'w-auto opacity-100'
                        }`}>
                            Logout
                        </span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-300 relative">
                
                {/* Top Header */}
                <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6 shrink-0 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] z-10">
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Toggle */}
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg md:hidden transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        
                        {/* Desktop Sidebar Toggle */}
                        <button 
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg hidden md:block transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Link to="/dashboard/profile" className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 pr-4 rounded-full transition-colors border border-transparent hover:border-gray-200">
                            <img src={user?.profileImage ? (user.profileImage.startsWith('http') ? user.profileImage : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${user.profileImage}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0D8ABC&color=fff`} alt="User" className="w-9 h-9 rounded-full object-cover shadow-sm" />
                            <div className="text-sm hidden sm:block">
                                <p className="font-bold text-gray-800 leading-tight">{user?.name || "Loading..."}</p>
                                <p className="text-[11px] text-gray-500 font-medium">{user?.role?.name || "User"}</p>
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Page Content (Outlet) */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 bg-[#f8fafc]">
                    {(() => {
                        // Find matching route in navItems
                        const currentRoute = navItems.find(item => 
                            location.pathname === item.path || 
                            (item.path !== '/dashboard' && location.pathname.startsWith(item.path + '/'))
                        );

                        if (currentRoute && user) {
                            const isAdmin = user?.role?.name === 'Admin';
                            const userPermissions = user?.role?.permissions || [];
                            let hasAccess = false;

                            if (currentRoute.permission === 'view_leads') {
                                hasAccess = isAdmin || userPermissions.includes('view_leads') || userPermissions.includes('create_lead');
                            } else if (currentRoute.name === 'Users') {
                                hasAccess = isAdmin || userPermissions.includes('manage_employees');
                            } else if (!currentRoute.permission || isAdmin) {
                                hasAccess = true;
                            } else {
                                hasAccess = userPermissions.includes(currentRoute.permission);
                            }

                            if (!hasAccess) {
                                return (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <div className="text-red-500 mb-4 bg-red-100 p-4 rounded-full">
                                            <Shield className="w-12 h-12" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
                                        <p className="text-gray-500 max-w-md">You don't have the required permissions ({currentRoute.permission}) to view this page. Please contact your administrator.</p>
                                    </div>
                                );
                            }
                        }
                        
                        return <Outlet />;
                    })()}
                </main>
            </div>

        </div>
    );
};

export default DashboardLayout;
