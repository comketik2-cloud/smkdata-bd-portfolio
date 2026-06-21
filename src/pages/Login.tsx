import React, { useState } from "react";
import { User, UserRole } from "../types";
import { LogIn, Lock, Mail, Github, Chrome, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("admin");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onLogin(data.user);
      } else {
        setError(data.error || "Autentikasi gagal. Silakan periksa kembali email dan kata sandi Anda.");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi Hambatan Jaringan. Silakan coba kembali beberapa saat lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 overflow-hidden relative">
      {/* Immersive Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/5 rounded-full blur-[120px] animate-pulse [animation-delay:2s]"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white border border-slate-100 shadow-2xl rounded-[2.5rem] p-8 sm:p-12 relative z-10"
      >
        <div className="text-center mb-12">
          <div className="w-20 h-20 brand-gradient rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl shadow-blue-100 mb-8 font-black text-2xl">
            DATA
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-2 uppercase tracking-[0.2em]">SISTEM LOGIN</h1>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest leading-relaxed">Platform Akademik Bisnis Digital<br/>SMK Daruttaqwa</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 pl-1">Identitas Pengguna</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <Mail size={18} />
              </div>
              <input 
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email / NIS / NIP"
                className="w-full bg-slate-50 border border-slate-100 text-slate-800 placeholder:text-slate-300 rounded-2xl py-4.5 pl-14 pr-6 outline-none focus:border-indigo-600 transition-all font-bold text-sm shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 pl-1">Kata Sandi</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-100 text-slate-800 placeholder:text-slate-300 rounded-2xl py-4.5 pl-14 pr-6 outline-none focus:border-indigo-600 transition-all font-bold text-sm shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 pl-1 text-center block">Masuk Sebagai</label>
            <div className="grid grid-cols-2 gap-3">
              {(['admin', 'guru', 'siswa', 'guest'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    role === r 
                      ? 'brand-gradient border-blue-500 text-white shadow-lg shadow-blue-100' 
                      : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100/60 text-rose-600 text-[10px] font-black uppercase tracking-wider leading-relaxed text-center animate-bounce">
              ⚠️ {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full brand-gradient text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-3 mt-6 group uppercase tracking-[0.2em] text-xs hover:scale-105 active:scale-95 ${
              isLoading ? "opacity-50 cursor-not-allowed scale-95" : ""
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4.5 w-4.5 border-3 border-white border-t-transparent rounded-full animate-spin"></span>
                Memproses...
              </span>
            ) : (
              <>
                <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                Autentikasi Sekarang
              </>
            )}
          </button>
        </form>

        <div className="mt-12 flex items-center gap-4">
          <div className="flex-1 h-px bg-slate-100"></div>
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Opsi Integrasi</span>
          <div className="flex-1 h-px bg-slate-100"></div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-3 py-4 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-all text-[10px] font-black uppercase tracking-wider text-slate-500 shadow-sm">
            <Chrome size={16} className="text-rose-500" />
            Google
          </button>
          <button className="flex items-center justify-center gap-3 py-4 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-all text-[10px] font-black uppercase tracking-wider text-slate-500 shadow-sm">
            <Github size={16} className="text-slate-800" />
            GitHub
          </button>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
            Bantuan Akses? <a href="https://wa.me/6288989971063?text=Halo%20Admin%20IT%20Bisnis%20Digital%20SMK%20Darut%20Taqwa.%20Saya%20kesulitan%20mengakses%20akun%20saya." target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Hubungi Admin IT</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
