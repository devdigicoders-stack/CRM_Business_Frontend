import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Sales from './pages/Sales';
import ClosedWonLeads from './pages/ClosedWonLeads';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Users from './pages/Users';
import Roles from './pages/Roles';
import Departments from './pages/Departments';
import TaskTemplates from './pages/TaskTemplates';

import Settings from './pages/Settings';
import Profile from './pages/Profile';
import MyLeads from './pages/MyLeads';
import PublicQuotationView from './pages/PublicQuotationView';
import Products from './pages/Products';
import Projects from './pages/Projects';
import Payments from './pages/Payments';

import './App.css';

function App() {
  return (
    <BrowserRouter>
      {/* Toast Notifications Provider */}
      <ToastContainer position="top-right" autoClose={3000} />
      
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Default dashboard page */}
          <Route index element={<Dashboard />} />
          
          {/* Nested pages */}
          <Route path="leads" element={<Leads />} />
          <Route path="sales" element={<Sales />} />
          <Route path="closed-won" element={<ClosedWonLeads />} />
          <Route path="projects" element={<Projects />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="users" element={<Users />} />
          <Route path="payments" element={<Payments />} />
          <Route path="roles" element={<Roles />} />
          <Route path="departments" element={<Departments />} />
          <Route path="task-templates" element={<TaskTemplates />} />

          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="my-leads" element={<MyLeads />} />
          <Route path="products" element={<Products />} />
        </Route>
        
        {/* Public Quotation View (Accessible by clients via WhatsApp/Email link without login) */}
        <Route path="/view-quote/:quotationNumber" element={<PublicQuotationView />} />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
