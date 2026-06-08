import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Users, LayoutDashboard, Settings, LogOut, GraduationCap, Presentation, Calendar, FileText } from "lucide-react";
import { logoutAdmin } from "./api/auth.api";

// Pages
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import StudentManage from "./pages/StudentManage";
import EducatorManage from "./pages/EducatorManage";
import EventsManage from "./pages/EventsManage";
import ReportsManage from "./pages/ReportsManage";
import OurPeoples from "./pages/OurPeoples";

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logoutAdmin();
  };

  const navItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Students", path: "/admin/students", icon: GraduationCap },
    { name: "Educators", path: "/admin/educators", icon: Presentation },
    { name: "Events", path: "/admin/events", icon: Calendar },
    { name: "Educator Reports", path: "/admin/reports", icon: FileText },
  ];

  return (
    <div className="dark min-h-screen bg-[#030008] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-white/[0.02] backdrop-blur-xl hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
            Admin Panel
          </h1>
          <p className="text-xs text-white/50 mt-1 uppercase tracking-widest">SteamBuddies</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition ${
                  isActive 
                  ? "bg-white/10 text-white font-bold" 
                  : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-2xl transition text-sm font-semibold"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

// Protected Route Guard
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("steambuddies_token");
  const userStr = localStorage.getItem("steambuddies_user");
  
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    if (user.role !== "admin") {
      return <Navigate to="/login" replace />;
    }
  } catch (e) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/our-peoples" element={<OurPeoples />} />
        
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="students" element={<StudentManage />} />
          <Route path="educators" element={<EducatorManage />} />
          <Route path="events" element={<EventsManage />} />
          <Route path="reports" element={<ReportsManage />} />
        </Route>

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
