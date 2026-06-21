import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  BookOpen, 
  UserCircle, 
  Users, 
  Calendar, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  MessageSquare,
  Settings,
  FileText,
  Camera,
  Sparkles,
  GraduationCap
} from "lucide-react";
import { UserRole } from "../types";
import { motion } from "motion/react";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onLogout: () => void;
  role: UserRole;
  branding: { name: string; logo: string | null };
}

export default function Sidebar({ isOpen, setIsOpen, onLogout, role, branding }: SidebarProps) {
  const location = useLocation();

  const menuItems = [
    { title: "Dashboard", icon: Home, path: "/", roles: ["admin", "guru", "siswa", "guest"] },
    { title: "Profil Jurusan", icon: Sparkles, path: "/profile-jurusan", roles: ["admin", "guru", "siswa", "guest"] },
    { title: "Materi Belajar", icon: BookOpen, path: "/materials", roles: ["admin", "guru", "siswa", "guest"] },
    { title: "CP & ATP", icon: FileText, path: "/curriculum", roles: ["admin", "guru", "siswa"] },
    { title: "Dokumentasi Jurusan", icon: Camera, path: "/documentation", roles: ["admin", "guru", "siswa", "guest"] },
    { title: "UKK Jurusan", icon: GraduationCap, path: "/ukk-jurusan", roles: ["admin", "guru", "siswa", "guest"] },
    { title: "Data Guru", icon: UserCircle, path: "/teachers", roles: ["admin", "guru"] },
    { title: "Data Siswa", icon: Users, path: "/students", roles: ["admin", "guru"] },
    { title: "Jadwal", icon: Calendar, path: "/schedule", roles: ["admin", "guru", "siswa"] },
    { title: "Forum Diskusi", icon: MessageSquare, path: "/forum", roles: ["admin", "guru", "siswa"] },
    { title: "Pengaturan", icon: Settings, path: "/settings", roles: ["admin", "guru", "siswa"] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <div 
      className={`fixed top-0 left-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-50 ${
        isOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'
      }`}
      id="sidebar"
    >
      <div className="flex items-center justify-between p-6 h-20">
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 overflow-hidden"
          >
            {branding.logo ? (
              <img src={branding.logo} alt="Logo" className="w-10 h-10 object-contain ring-2 ring-yellow-400 rounded-lg p-1 bg-white" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-10 h-10 brand-gradient rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 border-b-2 border-yellow-400">
                 <BookOpen size={20} className="text-white" />
              </div>
            )}
            <span className="text-xl font-bold text-slate-800 tracking-tight whitespace-nowrap">
              {branding.name}
            </span>
          </motion.div>
        )}
        {!isOpen && (
           <div className="mx-auto">
             {branding.logo ? (
               <img src={branding.logo} alt="Logo" className="w-10 h-10 object-contain ring-2 ring-yellow-400 rounded-lg p-1 bg-white" referrerPolicy="no-referrer" />
             ) : (
               <div className="w-10 h-10 brand-gradient rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 border-b-2 border-yellow-400">
                 <BookOpen size={20} className="text-white" />
               </div>
             )}
           </div>
        )}
      </div>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-24 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full p-1 shadow-md hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors z-50 text-slate-400 hidden lg:block"
        id="sidebar-toggle"
      >
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      <nav className="mt-8 px-4 flex flex-col gap-2 overflow-y-auto h-[calc(100vh-280px)] scrollbar-hide">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setIsOpen(false);
                }
              }}
              className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'brand-gradient text-white font-bold shadow-lg shadow-blue-200' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
              title={!isOpen ? item.title : ""}
            >
              <item.icon size={20} className={`${isActive ? 'text-white' : 'opacity-60 group-hover:opacity-100 transition-all text-slate-400 group-hover:text-indigo-500'}`} />
              {isOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs font-black uppercase tracking-widest"
                >
                  {item.title}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-4 left-0 w-full px-4 space-y-4">

        <button 
          onClick={onLogout}
          className="flex items-center gap-4 p-3 rounded-xl w-full text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-all duration-200"
          title={!isOpen ? "Logout" : ""}
        >
          <LogOut size={20} className="opacity-60" />
          {isOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] font-black uppercase tracking-widest"
            >
              Keluar
            </motion.span>
          )}
        </button>
      </div>
    </div>
  );
}
