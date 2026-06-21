import { Bell, Search, Moon, Sun, User as UserIcon, Menu } from "lucide-react";
import { User } from "../types";

interface NavbarProps {
  user: User;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  branding: { name: string; logo: string | null };
  darkMode: boolean;
  onToggleDark: () => void;
}

export default function Navbar({ user, sidebarOpen, onToggleSidebar, branding, darkMode, onToggleDark }: NavbarProps) {
  return (
    <header 
      className={`h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-all duration-300`}
      id="navbar"
    >
      <div className="flex items-center justify-between px-4 sm:px-8 h-full">
        <div className="flex items-center gap-2 lg:gap-0">
          <button 
            onClick={onToggleSidebar}
            className="lg:hidden p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 mr-1"
            title="Menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2 w-full max-w-[180px] xs:max-w-xs sm:max-w-md">
            <Search size={18} className="text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Cari..." 
              className="bg-transparent border-none outline-none w-full text-sm text-slate-600 dark:text-slate-300 placeholder:text-slate-400 font-medium"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] text-slate-400 font-mono shadow-sm shrink-0">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={onToggleDark}
            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-yellow-400"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button className="relative p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 hover:text-blue-600">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-yellow-400 rounded-full border-2 border-white dark:border-slate-900"></span>
          </button>
          
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

          <div className="flex items-center gap-4 pl-2">
            <div className="text-right hidden lg:block">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{user.name}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">{user.role === 'admin' ? 'Administrator' : user.role === 'guru' ? 'Tenaga Pendidik' : 'Peserta Didik'}</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-sm shadow-slate-200 dark:shadow-none">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-sm font-black text-slate-400 uppercase">{user.name.charAt(0)}</span>
                )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
