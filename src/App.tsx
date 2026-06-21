/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { User } from "./types";
import Dashboard from "./pages/Dashboard";
import Materials from "./pages/Materials";
import Teachers from "./pages/Teachers";
import Students from "./pages/Students";
import Schedule from "./pages/Schedule";
import Curriculum from "./pages/Curriculum";
import Forum from "./pages/Forum";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import DocumentationPage from "./pages/Documentation";
import ProfilJurusanPage from "./pages/ProfilJurusan";
import UkkJurusanPage from "./pages/UkkJurusan";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Chatbot from "./components/Chatbot";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [branding, setBranding] = useState({ name: "BISNIS DIGITAL", logo: null });
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileSize = window.innerWidth < 1024;
      setIsMobile(isMobileSize);
      setSidebarOpen(!isMobileSize);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Check local storage for dark mode preference
    const isDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem("darkMode", String(newVal));
    if (newVal) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    // Auto login check or session
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Fetch branding
    fetch("/api/branding")
      .then(res => res.json())
      .then(data => {
        if (data && data.name) {
          setBranding(data);
        }
      })
      .catch(err => console.error("Branding fetch error:", err));
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <div className={`min-h-screen flex bg-slate-50 text-slate-700 dark:bg-brand-bg-dark dark:text-slate-200 transition-colors duration-300`}>
        {/* Backdrop for mobile */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        <Sidebar 
          isOpen={sidebarOpen} 
          setIsOpen={setSidebarOpen} 
          onLogout={handleLogout} 
          role={user.role}
          branding={branding}
        />
        
        <main className={`flex-1 transition-all duration-300 ${isMobile ? 'ml-0' : (sidebarOpen ? 'ml-64' : 'ml-20')}`}>
          <Navbar 
            user={user} 
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            branding={branding}
            darkMode={darkMode}
            onToggleDark={toggleDarkMode}
          />
          
          <div className="p-4 sm:p-6 pb-24">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Dashboard user={user} branding={branding} />} />
                <Route path="/materials" element={<Materials user={user} branding={branding} />} />
                <Route path="/teachers" element={<Teachers user={user} />} />
                <Route path="/students" element={<Students user={user} />} />
                <Route path="/schedule" element={<Schedule user={user} />} />
                <Route path="/curriculum" element={<Curriculum user={user} />} />
                <Route path="/forum" element={<Forum user={user} />} />
                <Route path="/documentation" element={<DocumentationPage user={user} branding={branding} />} />
                <Route path="/profile-jurusan" element={<ProfilJurusanPage user={user} />} />
                <Route path="/ukk-jurusan" element={<UkkJurusanPage user={user} />} />
                <Route path="/settings" element={<Settings branding={branding} onBrandingChange={setBranding} darkMode={darkMode} onToggleDark={toggleDarkMode} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </div>

          <Chatbot />

          {/* Floating Account Status Widget - Bottom Right */}
          <div className="fixed bottom-24 right-6 z-40 max-w-[180px] w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/85 shadow-xl flex flex-col gap-1 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] text-slate-700 dark:text-slate-300">
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Status Akun</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-indigo-50 dark:bg-slate-800 rounded-lg text-indigo-600 dark:text-indigo-400 font-extrabold capitalize text-[10px] tracking-wide">
                {user.role === 'admin' ? '🔑 Admin' : user.role === 'guru' ? '🎓 Guru' : '🎒 Siswa'}
              </div>
              <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider truncate transition-colors">{user.role}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-4/5 bg-gradient-to-r from-blue-600 via-indigo-500 to-yellow-400"></div>
            </div>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

