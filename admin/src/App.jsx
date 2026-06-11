import React, { useEffect, useState } from "react";
import logo from "./assets/logo.png";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Users, LayoutDashboard, Settings, LogOut, GraduationCap, Presentation, Calendar, FileText, Menu, X } from "lucide-react";
import { logoutAdmin } from "./api/auth.api";
import { motion, AnimatePresence } from "framer-motion";

// Pages
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import StudentManage from "./pages/StudentManage";
import EducatorManage from "./pages/EducatorManage";
import EventsManage from "./pages/EventsManage";
import ReportsManage from "./pages/ReportsManage";
import OurPeoples from "./pages/OurPeoples";

function SidebarContent({ navigate, location, handleLogout }) {
  const navItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Students", path: "/admin/students", icon: GraduationCap },
    { name: "Educators", path: "/admin/educators", icon: Presentation },
    { name: "Events", path: "/admin/events", icon: Calendar },
    { name: "Educator Reports", path: "/admin/reports", icon: FileText },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 flex flex-col items-start gap-2">
        <img src={logo} alt="Steam Buddies Logo" className="w-12 h-12 object-contain" />
        <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
          Admin Panel
        </h1>
        <p className="text-xs text-white/50 mt-1 uppercase tracking-widest">SteamBuddies</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
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
    </div>
  );
}

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    logoutAdmin();
  };

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <div className="dark min-h-screen bg-[#030008] text-white flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.02] backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Steam Buddies Logo" className="w-8 h-8 object-contain" />
          <h1 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
            Admin
          </h1>
        </div>
        <button onClick={() => setDrawerOpen(true)} className="p-2 bg-white/5 border border-white/10 rounded-xl">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-white/[0.02] backdrop-blur-xl hidden md:flex flex-col h-screen sticky top-0">
        <SidebarContent navigate={navigate} location={location} handleLogout={handleLogout} />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-[#0a0614] border-r border-white/10 z-50 md:hidden flex flex-col shadow-2xl"
            >
              <button
                onClick={() => setDrawerOpen(false)}
                className="absolute top-4 right-4 p-2 bg-white/5 border border-white/10 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent navigate={navigate} location={location} handleLogout={handleLogout} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:h-screen md:overflow-y-auto">
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
