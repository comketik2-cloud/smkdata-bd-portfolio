import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Shield, 
  User as UserIcon, 
  Globe, 
  Layout, 
  Save, 
  CheckCircle2, 
  Camera, 
  Smartphone, 
  Monitor, 
  Mail, 
  Lock, 
  Palette, 
  Languages,
  Upload,
  Image as ImageIcon,
  Moon,
  Sun,
  Database
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SettingsProps {
  branding: { name: string; logo: string | null };
  onBrandingChange: (branding: { name: string; logo: string | null }) => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

export default function Settings({ branding, onBrandingChange, darkMode, onToggleDark }: SettingsProps) {
  const [activeTab, setActiveTab] = useState("Profil Akun");
  const [username, setUsername] = useState("admin_bd");
  const [email, setEmail] = useState("admin@school.id");
  const [bio, setBio] = useState("Administrator Sistem Informasi Bisnis Digital SMK Darut Taqwa.");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Profile Picture
  const [profilePic, setProfilePic] = useState<string | null>(null);
  
  // Database Status State
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; error: string | null; host: string } | null>(null);
  const [isRefreshingDb, setIsRefreshingDb] = useState(false);
  
  // Fetch DB Status
  const fetchDbStatus = async () => {
    setIsRefreshingDb(true);
    try {
      const res = await fetch("/api/firebase-status");
      const data = await res.json();
      setDbStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshingDb(false);
    }
  };

  useEffect(() => {
    fetchDbStatus();
  }, []);
  
  // Branding State
  const [appName, setAppName] = useState(branding.name);
  const [appLogo, setAppLogo] = useState<string | null>(branding.logo);

  useEffect(() => {
    // Sync if branding prop changes
    setAppName(branding.name);
    setAppLogo(branding.logo);
  }, [branding]);

  useEffect(() => {
    // Fetch profile from local storage user
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUsername(u.name);
      setEmail(u.email);
      setProfilePic(u.avatar || null);
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
    // Save Branding if it was changed
    try {
      const res = await fetch("/api/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: appName, logo: appLogo })
      });
      if (res.ok) {
        onBrandingChange({ name: appName, logo: appLogo });
      }
      
      // Update local storage user if profile changed
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const u = JSON.parse(savedUser);
        const updatedUser = { ...u, name: username, email: email, avatar: profilePic };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error(err);
    }

    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAppLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { label: "Profil Akun", icon: UserIcon },
    { label: "Sistem Branding", icon: Layout },
    { label: "Koneksi Firebase", icon: Database },
    { label: "Notifikasi", icon: Bell },
    { label: "Keamanan", icon: Shield },
    { label: "Tampilan", icon: Palette },
    { label: "Bahasa", icon: Globe },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-800 uppercase tracking-tight">Pengaturan Sistem</h1>
          <p className="text-slate-500 text-sm font-medium">Konfigurasi akun dan kustomisasi branding aplikasi Anda.</p>
        </div>
        <AnimatePresence>
          {showSuccess && (
            <motion.div 
               initial={{ opacity: 0, x: 20 }} 
               animate={{ opacity: 1, x: 0 }} 
               exit={{ opacity: 0, x: 20 }}
               className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-2 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100"
            >
               <CheckCircle2 size={14} /> Berhasil Diperbarui
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
            {tabs.map((item) => (
                <button 
                  key={item.label} 
                  onClick={() => setActiveTab(item.label)}
                  className={`flex-1 md:flex-none flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                    activeTab === item.label 
                      ? 'brand-gradient border-transparent text-white shadow-xl shadow-indigo-100' 
                      : 'text-slate-500 bg-white border-slate-200 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200'
                  }`}
                >
                    <item.icon size={18} className={activeTab === item.label ? 'text-white' : 'text-slate-400'} />
                    {item.label}
                </button>
            ))}
        </div>

        <div className="md:col-span-3 space-y-6">
            <div className="glass-card rounded-3xl p-8 space-y-10">
                
                {activeTab === "Profil Akun" && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-8">
                        <div className="relative group">
                          <div className="w-28 h-28 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-indigo-500 transition-all cursor-pointer overflow-hidden shadow-inner">
                              {profilePic ? (
                                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <UserIcon size={40} className="group-hover:scale-110 transition-transform opacity-40" />
                              )}
                          </div>
                          <label className="absolute -bottom-2 -right-2 w-10 h-10 brand-gradient rounded-2xl flex items-center justify-center text-white shadow-xl border-4 border-white cursor-pointer hover:scale-110 transition-all">
                            <Camera size={16} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleProfilePicChange} />
                          </label>
                        </div>
                        <div>
                            <h3 className="text-slate-800 font-bold text-xl uppercase tracking-tight">Foto Profil Karyawan</h3>
                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-2 leading-relaxed">Profil ini ditampilkan secara resmi<br />di seluruh dashboard institusi.</p>
                            <div className="mt-4 flex gap-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-all bg-indigo-50 px-4 py-2 rounded-xl cursor-pointer inline-block">Unggah Baru
                                  <input type="file" className="hidden" accept="image/*" onChange={handleProfilePicChange} />
                                </label>
                                <button onClick={() => setProfilePic(null)} className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-all">Hapus Foto</button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                              <UserIcon size={12} /> Nama Lengkap
                            </label>
                            <input 
                              type="text" 
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm text-slate-700 outline-none focus:border-indigo-500/50 transition-all font-bold placeholder:text-slate-300 shadow-sm" 
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                              <Mail size={12} /> Email Institusi
                            </label>
                            <input 
                              type="email" 
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm text-slate-700 outline-none focus:border-indigo-500/50 transition-all font-bold placeholder:text-slate-300 shadow-sm" 
                            />
                        </div>
                        <div className="space-y-3 sm:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Visi & Biografi Singkat</label>
                            <textarea 
                              rows={4} 
                              value={bio}
                              onChange={(e) => setBio(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm text-slate-700 outline-none focus:border-indigo-500/50 transition-all resize-none font-medium leading-relaxed shadow-sm" 
                            />
                        </div>
                    </div>
                  </div>
                )}

                {activeTab === "Sistem Branding" && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-8">
                        <div className="relative group">
                          <div className="w-28 h-28 rounded-3xl bg-blue-50 border-2 border-dashed border-blue-200 flex items-center justify-center text-blue-400 group-hover:border-blue-500 transition-all cursor-pointer overflow-hidden shadow-inner">
                              {appLogo ? (
                                <img src={appLogo} alt="Logo App" className="w-full h-full object-contain p-4" referrerPolicy="no-referrer" />
                              ) : (
                                <ImageIcon size={40} className="group-hover:scale-110 transition-transform opacity-40" />
                              )}
                          </div>
                          <label className="absolute -bottom-2 -right-2 w-10 h-10 brand-gradient rounded-2xl flex items-center justify-center text-white shadow-xl border-4 border-white cursor-pointer hover:scale-110 transition-all">
                            <Upload size={16} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                          </label>
                        </div>
                        <div>
                            <h3 className="text-slate-800 font-bold text-xl uppercase tracking-tight">Logo Institusi SMK</h3>
                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-2 leading-relaxed">Logo ini akan muncul di sidebar dan laporan.<br />Gunakan latar transparan (PNG).</p>
                            <div className="mt-4 flex gap-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-all bg-blue-50 px-4 py-2 rounded-xl cursor-pointer inline-block">Unggah Logo
                                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                                </label>
                                <button onClick={() => setAppLogo(null)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Gunakan Default</button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nama Aplikasi / Institusi</label>
                        <input 
                          type="text" 
                          value={appName}
                          onChange={(e) => setAppName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-xl text-slate-800 outline-none focus:border-blue-500/50 transition-all font-black" 
                        />
                        <p className="text-[9px] font-bold text-slate-400 italic">Nama ini akan menjadi identitas utama pada dashboard.</p>
                    </div>
                  </div>
                )}

                 {activeTab === "Koneksi Firebase" && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-slate-800 font-bold text-xl uppercase tracking-tight flex items-center gap-2">
                        <Database className="text-blue-600" size={22} /> Detail Koneksi Firebase Firestore
                      </h3>
                      <button 
                        onClick={fetchDbStatus} 
                        disabled={isRefreshingDb}
                        className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 transition-all px-4 py-2 rounded-xl"
                      >
                        {isRefreshingDb ? "Menguji..." : "Uji Koneksi Ulang"}
                      </button>
                    </div>

                    <div className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50 space-y-4 shadow-inner">
                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status Koneksi</span>
                        {dbStatus?.connected ? (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                            Terhubung (Sukses)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-rose-100 text-rose-600 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                            Gagal Tersambung
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Project Firebase ID</span>
                        <span className="text-xs text-slate-600 font-mono select-all">portfolio-bd-500115</span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Auth Domain / Host</span>
                        <span className="text-xs text-slate-600 font-mono select-all">{dbStatus?.host || "portfolio-bd-500115.firebaseapp.com"}</span>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Provider Server</span>
                        <span className="text-xs text-slate-600 font-mono">Google Cloud Firestore</span>
                      </div>
                    </div>

                    {!dbStatus?.connected && dbStatus?.error && (
                      <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl space-y-2">
                        <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider">Detail Error Autentikasi:</h4>
                        <pre className="text-xs text-rose-500 font-mono whitespace-pre-wrap bg-white/40 p-4 rounded-2xl border border-rose-100/50">
                          {dbStatus.error}
                        </pre>
                        <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider mt-2">
                          💡 Pastikan kredensial Firebase Firestore Anda dikonfigurasi dengan benar di file lingkungan.
                        </p>
                      </div>
                    )}

                    {dbStatus?.connected && (
                      <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-3xl space-y-2">
                        <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
                          🎉 Penyimpanan Sinkron Berhasil!
                        </h4>
                        <p className="text-[11px] text-emerald-600 font-medium leading-relaxed">
                          Aplikasi Anda sekarang aktif membackup dan menyinkronkan seluruh perubahan data (materi, profil, kurikulum, forum, dll.) secara langsung ke dokumen <code className="font-mono bg-emerald-100/50 px-1 rounded">/app_state/master_state</code> di database Google Cloud Firestore. Jika Anda me-restart atau me-refresh server, progress tidak akan pernah hilang.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "Notifikasi" && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-slate-800 font-bold text-xl uppercase tracking-tight">Pusat Notifikasi</h3>
                    <div className="space-y-4">
                      {[
                        { title: "Notifikasi Sistem", desc: "Berita penting seputar update aplikasi." },
                        { title: "Aktivitas Mentor", desc: "Dapatkan pesan jika ada feedback tugas." },
                        { title: "Pengumuman Baru", desc: "Akses berita terbaru dari sekolah." }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-indigo-200 transition-all">
                          <div>
                            <p className="text-sm font-bold text-slate-700">{item.title}</p>
                            <p className="text-xs text-slate-400 mt-1 font-medium">{item.desc}</p>
                          </div>
                          <div className="w-12 h-6 bg-indigo-600 rounded-full relative cursor-pointer shadow-inner">
                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "Keamanan" && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-slate-800 font-bold text-xl uppercase tracking-tight">Privasi & Keamanan</h3>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Kata Sandi Saat Ini</label>
                        <div className="relative">
                          <input type="password" value="********" readOnly className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm text-slate-400 outline-none font-bold" />
                          <Lock size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" />
                        </div>
                      </div>
                      <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl">
                        <h4 className="text-xs font-bold text-rose-600 mb-2">Autentikasi Dua Faktor (2FA)</h4>
                        <p className="text-[11px] text-rose-500 font-medium mb-4">Tambahkan lapisan keamanan ekstra dengan menghubungkan ke smartphone Anda.</p>
                        <button className="text-[10px] font-black uppercase tracking-widest bg-rose-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-rose-100 hover:bg-rose-600 transition-all">Aktifkan Sekarang</button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "Tampilan" && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-slate-800 dark:text-slate-100 font-bold text-xl uppercase tracking-tight">Kustomisasi Tampilan</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div 
                        onClick={() => darkMode && onToggleDark()}
                        className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                          !darkMode 
                            ? 'border-blue-500 bg-white shadow-xl shadow-blue-50' 
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 opacity-60'
                        }`}
                      >
                        <Monitor size={30} className={!darkMode ? 'text-blue-500 mb-4' : 'text-slate-400 mb-4'} />
                        <p className={`text-xs font-bold ${!darkMode ? 'text-slate-800' : 'text-slate-400'}`}>Mode Terang {!darkMode && '(Aktif)'}</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">Warna-warni & Bersih</p>
                      </div>
                      <div 
                        onClick={() => !darkMode && onToggleDark()}
                        className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                          darkMode 
                            ? 'border-blue-500 bg-slate-900 shadow-xl shadow-blue-900/40' 
                            : 'border-slate-200 bg-slate-50 opacity-60'
                        }`}
                      >
                        <Moon size={30} className={darkMode ? 'text-blue-500 mb-4' : 'text-slate-400 mb-4'} />
                        <p className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-400'}`}>Mode Gelap {darkMode && '(Aktif)'}</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">Fokus & Elegan</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Warna Aksen Utama</p>
                       <div className="flex gap-4">
                          {['#004a99', '#22c55e', '#facc15', '#f59e0b'].map(c => (
                            <div key={c} style={{ backgroundColor: c }} className={`w-10 h-10 rounded-xl cursor-pointer shadow-lg hover:scale-110 transition-all ${c==='#004a99' ? 'border-4 border-white dark:border-slate-800 ring-2 ring-blue-500' : ''}`} />
                          ))}
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === "Bahasa" && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-slate-800 font-bold text-xl uppercase tracking-tight">Bahasa & Lokasi</h3>
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Bahasa Antarmuka</label>
                        <div className="relative">
                          <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm text-slate-700 outline-none font-bold appearance-none">
                            <option>Bahasa Indonesia (Default)</option>
                            <option>English (US)</option>
                          </select>
                          <Languages size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Zona Waktu (Timezone)</label>
                        <div className="relative">
                          <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm text-slate-700 outline-none font-bold appearance-none">
                             <option>(GMT+07:00) Jakarta, Bangkok, Hanoi</option>
                          </select>
                          <Globe size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-10 border-t border-slate-100 flex justify-end gap-4">
                    <button 
                      onClick={() => {
                        window.location.reload();
                      }}
                      className="bg-white text-slate-400 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-slate-200 hover:bg-slate-50 hover:text-slate-600 transition-all shadow-sm"
                    >
                      Reset Ulang
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="brand-gradient hover:opacity-90 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl shadow-indigo-100 active:scale-95 transition-all"
                    >
                        {isSaving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                        ) : (
                          <Save size={18} />
                        )}
                        {isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </motion.div>
  );
}
