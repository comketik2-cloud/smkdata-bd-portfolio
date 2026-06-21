import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../types";
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Bell, 
  Clock, 
  ChevronRight,
  TrendingDown,
  LayoutDashboard,
  CalendarDays,
  Target,
  Plus,
  Trash2,
  Edit,
  Loader2,
  MessageSquare,
  Instagram,
  Facebook,
  Music,
  ShoppingBag,
  Upload,
  Paperclip,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";

const data = [
  { name: "Jan", visitors: 1450, pageViews: 3200 },
  { name: "Feb", visitors: 1820, pageViews: 4100 },
  { name: "Mar", visitors: 2400, pageViews: 6300 },
  { name: "Apr", visitors: 2100, pageViews: 5800 },
  { name: "May", visitors: 2850, pageViews: 8200 },
  { name: "Jun", visitors: 3900, pageViews: 11400 },
];

const barData = [
  { name: "Siswa", value: 1284, color: "#6366f1" },
  { name: "Materi", value: 482, color: "#a855f7" },
  { name: "Progress", value: 78.4, color: "#10b981" },
  { name: "Proyek", value: 15, color: "#f59e0b" },
];

interface DashboardProps {
  user: User;
  branding: { name: string; logo: string | null };
}

export default function Dashboard({ user, branding }: DashboardProps) {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [agendas, setAgendas] = useState<any[]>([]);
  const [stats, setStats] = useState({
      students: 1284,
      materials: 482,
      teachers: 32,
      discussions: 0
  });
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddAnn, setShowAddAnn] = useState(false);
  const [showEditAnn, setShowEditAnn] = useState(false);
  const [showDetailAnn, setShowDetailAnn] = useState<any>(null);
  const [editingAnn, setEditingAnn] = useState<any>(null);
  const [annForm, setAnnForm] = useState({ title: "", content: "", fileUrl: "", fileName: "" });
  const [annUploading, setAnnUploading] = useState(false);
  const [editAnnUploading, setEditAnnUploading] = useState(false);

  const [showAddAgenda, setShowAddAgenda] = useState(false);
  const [showEditAgenda, setShowEditAgenda] = useState(false);
  const [editingAgenda, setEditingAgenda] = useState<any>(null);
  const [agendaForm, setAgendaForm] = useState({ title: "", date: "", time: "", desc: "", color: "bg-indigo-500", fileUrl: "", fileName: "" });
  const [agendaUploading, setAgendaUploading] = useState(false);
  const [editAgendaUploading, setEditAgendaUploading] = useState(false);

  const fetchAnnouncements = () => {
    fetch("/api/announcements").then(res => res.json()).then(data => setAnnouncements(data));
  };

  const fetchAgendas = () => {
    fetch("/api/agendas").then(res => res.json()).then(data => setAgendas(data));
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchAgendas();
    
    // Fetch counts for dynamic stats
    Promise.all([
        fetch("/api/students").then(res => res.json()).catch(() => []),
        fetch("/api/materials").then(res => res.json()).catch(() => []),
        fetch("/api/teachers").then(res => res.json()).catch(() => []),
        fetch("/api/forum").then(res => res.json()).catch(() => [])
    ]).then(([s, m, t, f]) => {
        const activeDiscussions = f.filter((p: any) => p.repliesCount > 0).length;
        setStats({
            students: s.length,
            materials: m.length,
            teachers: t.length,
            discussions: activeDiscussions
        });
        setLoading(false);
    });
  }, []);

  const handleAnnFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (isEdit) setEditAnnUploading(true);
    else setAnnUploading(true);
    
    const formData = new FormData();
    formData.append("files", e.target.files[0]);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data && data.length > 0) {
        if (isEdit) {
          setEditingAnn((prev: any) => ({
            ...prev,
            fileUrl: data[0].url,
            fileName: data[0].name
          }));
        } else {
          setAnnForm(prev => ({
            ...prev,
            fileUrl: data[0].url,
            fileName: data[0].name
          }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isEdit) setEditAnnUploading(false);
      else setAnnUploading(false);
    }
  };

  const handleAgendaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (isEdit) setEditAgendaUploading(true);
    else setAgendaUploading(true);
    
    const formData = new FormData();
    formData.append("files", e.target.files[0]);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data && data.length > 0) {
        if (isEdit) {
          setEditingAgenda((prev: any) => ({
            ...prev,
            fileUrl: data[0].url,
            fileName: data[0].name
          }));
        } else {
          setAgendaForm(prev => ({
            ...prev,
            fileUrl: data[0].url,
            fileName: data[0].name
          }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isEdit) setEditAgendaUploading(false);
      else setAgendaUploading(false);
    }
  };

  const handleAddAnn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...annForm, author: user.name, color: "bg-indigo-500" })
      });
      if (res.ok) {
        fetchAnnouncements();
        setShowAddAnn(false);
        setAnnForm({ title: "", content: "", fileUrl: "", fileName: "" });
      }
    } catch (e) { console.error(e); }
  };

  const handleEditAnn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnn) return;
    try {
      const res = await fetch(`/api/announcements/${editingAnn.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAnn)
      });
      if (res.ok) {
        fetchAnnouncements();
        setShowEditAnn(false);
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteAnn = async (id: string) => {
    if (!confirm("Hapus pengumuman?")) return;
    try {
      await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (e) { console.error(e); }
  };

  const handleAddAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/agendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agendaForm)
      });
      if (res.ok) {
        fetchAgendas();
        setShowAddAgenda(false);
        setAgendaForm({ title: "", date: "", time: "", desc: "", color: "bg-indigo-500", fileUrl: "", fileName: "" });
      }
    } catch (e) { console.error(e); }
  };

  const handleEditAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgenda) return;
    try {
      const res = await fetch(`/api/agendas/${editingAgenda.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAgenda)
      });
      if (res.ok) {
        fetchAgendas();
        setShowEditAgenda(false);
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteAgenda = async (id: string) => {
    if (!confirm("Hapus agenda?")) return;
    try {
      await fetch(`/api/agendas/${id}`, { method: "DELETE" });
      setAgendas(prev => prev.filter(a => a.id !== id));
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
       <div className="min-h-screen flex flex-col items-center justify-center gap-4">
         <Loader2 size={40} className="animate-spin text-indigo-500" />
         <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Sinkronisasi Database...</p>
       </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 brand-gradient rounded-3xl p-10 text-white shadow-2xl shadow-blue-100 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-400/20 blur-3xl -mr-32 -mt-32 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400/10 blur-3xl -ml-24 -mb-24"></div>
        <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-1.5 tracking-tight uppercase leading-tight">
              BISNIS DIGITAL SMK DARUT TAQWA PURWOSARI PASURUAN
            </h1>
            <p className="text-amber-300 font-semibold text-xs mb-4 flex items-center gap-1.5 uppercase tracking-wider">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-300 animate-ping"></span>
              Jl. Pesantren No. 01 Sengonagung, Purwosari, Pasuruan, Jawa Timur 67162
            </p>
            <p className="text-blue-50 text-sm opacity-90 max-w-2xl font-medium">Selamat Datang kembali, <span className="font-black underline decoration-2 underline-offset-4 decoration-yellow-400">{user.name}</span>. Mari kembangkan potensi di SMK Daruttaqwa!</p>
            <div className="mt-8 flex flex-wrap gap-4">
                <button onClick={() => navigate("/materials")} className="bg-white text-blue-800 px-8 py-3 rounded-2xl font-black text-[10px] shadow-2xl shadow-blue-900/10 hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.2em] border-b-4 border-yellow-400">Katalog Materi</button>
                <button onClick={() => navigate("/students")} className="bg-white/20 backdrop-blur-md border border-white/30 px-8 py-3 rounded-2xl font-black text-[10px] hover:bg-white/30 transition-all uppercase tracking-[0.2em]">Analitik Siswa</button>
            </div>
        </div>
        <div className="absolute right-0 top-0 w-80 h-full bg-white opacity-5 -mr-16 shrink-0 skew-x-12 group-hover:-mr-8 transition-all duration-1000"></div>
        <LayoutDashboard size={140} className="absolute right-10 bottom-[-30px] opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Siswa Aktif", value: stats.students.toString(), icon: Users, change: "Total", color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Materi Terbit", value: stats.materials.toString(), icon: BookOpen, change: "Katalog", color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Tenaga Pengajar", value: stats.teachers.toString(), icon: TrendingUp, change: "SDM", color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Diskusi & Forum Aktif", value: stats.discussions.toString(), icon: MessageSquare, change: "Siswa Aktif", color: "text-orange-600", bg: "bg-orange-50" },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-2xl p-7 hover:shadow-2xl hover:border-indigo-100 transition-all border border-slate-100 group"
          >
            <div className="flex items-center justify-between mb-6">
              <div className={`${stat.bg} p-4 rounded-2xl ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">
                {stat.change}
              </div>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.1em]">{stat.label}</p>
            <h3 className="text-4xl font-display font-light mt-2 text-slate-800 tracking-tighter">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-8 border border-slate-100 shadow-xl shadow-slate-100/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight uppercase">Analisis Pengunjung Web</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Lalulintas & Interaksi Kunjungan Jurusan</p>
            </div>
            <div className="flex flex-wrap items-center gap-6">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></div>
                  <div className="text-left">
                    <span className="block text-[8px] font-black text-slate-400 uppercase leading-none">Pengunjung Unik (Total: 14.120)</span>
                    <span className="text-xs font-black text-indigo-600 leading-none">Visitors</span>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                  <div className="text-left">
                    <span className="block text-[8px] font-black text-slate-400 uppercase leading-none">Penayangan Halaman (Total: 39.000)</span>
                    <span className="text-xs font-black text-emerald-600 leading-none">Page Views</span>
                  </div>
               </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000005" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.05)' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                />
                <Area type="monotone" name="Pengunjung" dataKey="visitors" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorVisitors)" />
                <Area type="monotone" name="Penayangan" dataKey="pageViews" stroke="#10b981" strokeWidth={3} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPageViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Bar Chart */}
        <div className="glass-card rounded-2xl p-8 border border-slate-100 shadow-xl shadow-slate-100/50">
          <h4 className="font-black text-slate-800 mb-8 uppercase tracking-widest text-[10px]">Peta Distribusi Data</h4>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#64748b', textTransform: 'uppercase'}} width={70} />
                <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={20}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 space-y-4">
             {barData.map((item, i) => (
                <div key={i} className="group">
                   <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-indigo-600 transition-colors">{item.name}</span>
                      <span className="text-xs font-black text-slate-700">{item.value}</span>
                   </div>
                   <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(item.value / 1500) * 100}%`, backgroundColor: item.color }}></div>
                   </div>
                </div>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
        {/* Announcements */}
        <div className="glass-card rounded-2xl p-8 border border-slate-100 shadow-xl shadow-slate-100/50">
          <div className="flex items-center justify-between mb-8">
            <h4 className="font-black text-slate-800 uppercase tracking-[0.2em] text-[10px]">Warta Digital Darut Taqwa</h4>
            {(user.role === "admin" || user.role === "guru") && (
              <button 
                onClick={() => setShowAddAnn(true)}
                className="brand-gradient text-white p-2.5 rounded-xl shadow-lg shadow-indigo-100 hover:scale-110 active:scale-95 transition-all"
              >
                <Plus size={18} />
              </button>
            )}
          </div>
          <div className="space-y-4">
            <AnimatePresence>
              {announcements.map((ann) => (
                <motion.div 
                  key={ann.id} 
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setShowDetailAnn(ann)}
                  className="flex gap-5 p-5 bg-white border border-slate-100 rounded-2xl hover:border-indigo-400/30 hover:shadow-xl hover:shadow-indigo-50 transition-all cursor-pointer group"
                >
                    <div className={`w-1.5 h-10 rounded-full mt-0.5 shrink-0 brand-gradient`}></div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-sm text-slate-700 font-bold group-hover:text-indigo-600 transition-colors uppercase tracking-tight leading-tight">{ann.title}</p>
                          {(user.role === "admin" || user.role === "guru") && (
                             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                                <button onClick={(e) => { e.stopPropagation(); setEditingAnn(ann); setShowEditAnn(true); }} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"><Edit size={14} /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteAnn(ann.id); }} className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                             </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                           <p className="text-[9px] text-indigo-500 uppercase font-black tracking-widest">{ann.author}</p>
                           <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                           <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">{new Date(ann.date).toLocaleDateString()}</p>
                           {ann.fileUrl && (
                             <>
                               <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                               <span className="flex items-center gap-1 text-[9px] text-emerald-600 font-extrabold uppercase tracking-widest">
                                 <Paperclip size={11} />
                                 Ada Dokumen
                               </span>
                             </>
                           )}
                        </div>
                    </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Agendas */}
        <div className="glass-card rounded-2xl p-8 border border-slate-100 shadow-xl shadow-slate-100/50">
          <div className="flex items-center justify-between mb-8">
            <h4 className="font-black text-slate-800 uppercase tracking-[0.2em] text-[10px]">Agenda & Tenggat Waktu</h4>
            {(user.role === "admin" || user.role === "guru") && (
              <button 
                onClick={() => setShowAddAgenda(true)}
                className="brand-gradient text-white p-2.5 rounded-xl shadow-lg shadow-indigo-100 hover:scale-110 active:scale-95 transition-all"
              >
                <Plus size={18} />
              </button>
            )}
          </div>
          <div className="space-y-6">
            <AnimatePresence>
              {agendas.map((event) => (
                <motion.div 
                  key={event.id} 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex gap-6 items-start group"
                >
                  <div className={`text-center min-w-[60px] py-3 rounded-2xl border border-slate-100 bg-slate-50 text-slate-400 group-hover:brand-gradient group-hover:text-white group-hover:border-transparent transition-all shadow-sm group-hover:shadow-lg group-hover:shadow-indigo-100`}>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] leading-none mb-1.5 transition-all">{event.date.split(' ')[1]}</p>
                      <p className="text-2xl font-black leading-none tracking-tighter transition-all">{event.date.split(' ')[0]}</p>
                  </div>
                  <div className="flex-1 pb-6 border-b border-slate-100 last:border-0 relative">
                      <div className="flex justify-between items-start">
                        <h4 className={`font-bold transition-colors text-slate-700 group-hover:text-indigo-600 uppercase tracking-tight leading-tight`}>{event.title}</h4>
                        {(user.role === "admin" || user.role === "guru") && (
                           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                              <button onClick={() => { setEditingAgenda(event); setShowEditAgenda(true); }} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"><Edit size={14} /></button>
                              <button onClick={() => handleDeleteAgenda(event.id)} className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                           </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none">{event.time || "Sepanjang Hari"}</p>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2 leading-relaxed line-clamp-1 group-hover:line-clamp-none transition-all">{event.desc}</p>
                      {event.fileUrl && (
                        <div className="mt-3">
                          <a 
                            href={event.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#059669] bg-[#ecfdf5] hover:bg-[#d1fae5] px-3.5 py-2 border border-[#a7f3d0]/60 rounded-xl transition-all"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileText size={12} className="text-[#10b981]" />
                            Unduh Lampiran: {event.fileName || "Dokumen"}
                          </a>
                        </div>
                      )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Social Media Links Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-100/50 mt-8"
      >
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] bg-indigo-50 px-3.5 py-1.5 rounded-full inline-block mb-3">Terhubung Bersama Kami</span>
          <h3 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">Kanal Media Sosial & Official Store</h3>
          <p className="text-slate-500 text-xs mt-2 leading-relaxed">
            Ikuti berbagai keseruan belajar, konten promosi kreatif, video live selling, dan toko praktik siswa Bisnis Digital SMK Darut Taqwa Sengonagung.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              name: "Instagram",
              handle: "@business_skada",
              url: "https://www.instagram.com/business_skada?igsh=ZmFkcm1uYm4xeXhw",
              desc: "Dokumentasi kegiatan, infografis, & postingan harian seru siswa.",
              icon: Instagram,
              color: "hover:border-pink-500/30 hover:shadow-pink-50",
              badgeColor: "bg-pink-50 text-pink-600",
              iconBg: "bg-pink-500 text-white"
            },
            {
              name: "Facebook",
              handle: "Bisnis Digital - SKADA",
              url: "https://www.facebook.com/share/1BWrVY7R2G/",
              desc: "Komunitas akademik, wawasan bisnis, & album galeri kegiatan.",
              icon: Facebook,
              color: "hover:border-blue-500/30 hover:shadow-blue-50",
              badgeColor: "bg-blue-50 text-blue-600",
              iconBg: "bg-blue-600 text-white"
            },
            {
              name: "TikTok",
              handle: "@bisnis.digital.smkdt",
              url: "https://www.tiktok.com/@bisnis.digital.smkdt?_r=1&_t=ZS-96WFYniZEos",
              desc: "Media live commerce siswa & kreasi video campaign pendek.",
              icon: Music,
              color: "hover:border-slate-800/20 hover:shadow-slate-100",
              badgeColor: "bg-slate-100 text-slate-800",
              iconBg: "bg-slate-900 text-white"
            },
            {
              name: "Shopee Store",
              handle: "athaya1616",
              url: "https://shopee.co.id/athaya1616",
              desc: "Toko resmi kewirausahaan siswa dengan produk-produk buatan mandiri.",
              icon: ShoppingBag,
              color: "hover:border-orange-500/30 hover:shadow-orange-50",
              badgeColor: "bg-orange-50 text-orange-600",
              iconBg: "bg-orange-500 text-white"
            }
          ].map((social, idx) => (
            <a 
              key={idx}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block bg-slate-50/50 hover:bg-white border border-slate-100 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl ${social.color} group relative overflow-hidden`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-xl ${social.iconBg} transform group-hover:scale-110 transition-transform`}>
                  <social.icon size={22} />
                </div>
                <div>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${social.badgeColor}`}>
                    {social.name}
                  </span>
                  <p className="text-slate-800 font-bold text-sm mt-1">{social.handle}</p>
                </div>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed font-semibold">{social.desc}</p>
              
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-indigo-500">
                <span className="text-[9px] font-black uppercase tracking-widest">Kunjungi Platform</span>
                <ChevronRight size={14} className="transform group-hover:translate-x-1.5 transition-transform" />
              </div>
            </a>
          ))}
        </div>
      </motion.div>

      {/* Modals for Announcements */}
      <AnimatePresence>
        {showAddAnn && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 max-w-lg w-full rounded-3xl p-8 shadow-2xl relative overflow-hidden">
               <h2 className="text-xl font-bold text-slate-800 mb-8 uppercase tracking-[0.2em] flex items-center gap-4">
                  <div className="p-2.5 brand-gradient rounded-xl text-white">
                    <Plus size={20} />
                  </div>
                  Buat Pengumuman Baru
               </h2>
               <form onSubmit={handleAddAnn} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tajuk Informasi</label>
                    <input value={annForm.title} onChange={(e) => setAnnForm({...annForm, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all text-sm font-bold shadow-sm" placeholder="Judul Pengumuman..." required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Konten Berita</label>
                    <textarea value={annForm.content} onChange={(e) => setAnnForm({...annForm, content: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all text-sm min-h-[160px] font-medium leading-relaxed shadow-sm" placeholder="Tulis rincian pengumuman disini..." required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Dokumen Lampiran (Opsional)</label>
                    <div className="relative border border-dashed border-slate-200 hover:border-indigo-400/50 rounded-2xl p-5 bg-slate-50 flex flex-col items-center justify-center transition-all">
                      <input 
                        type="file" 
                        onChange={(e) => handleAnnFileUpload(e, false)} 
                        className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      />
                      <Upload size={24} className="text-slate-400 mb-2" />
                      {annUploading ? (
                        <p className="text-xs text-indigo-500 font-bold animate-pulse">Mengunggah file...</p>
                      ) : annForm.fileUrl ? (
                        <p className="text-xs text-emerald-650 font-black truncate max-w-full">✓ {annForm.fileName}</p>
                      ) : (
                        <p className="text-xs text-slate-400 font-semibold text-center">Tarik file atau klik untuk memilih dokumen pengumuman</p>
                      )}
                    </div>
                  </div>
                  <div className="pt-4 flex gap-4">
                    <button type="button" onClick={() => setShowAddAnn(false)} className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all border border-slate-200 rounded-2xl">Batal</button>
                    <button type="submit" className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] brand-gradient text-white rounded-2xl shadow-xl shadow-indigo-100 hover:opacity-90 transition-all active:scale-95">Terbitkan</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}

        {showEditAnn && editingAnn && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 max-w-lg w-full rounded-3xl p-8 shadow-2xl relative overflow-hidden">
               <h2 className="text-xl font-bold text-slate-800 mb-8 uppercase tracking-[0.2em] flex items-center gap-4">
                  <div className="p-2.5 brand-gradient rounded-xl text-white">
                    <Edit size={20} />
                  </div>
                  Perbarui Informasi
               </h2>
               <form onSubmit={handleEditAnn} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Judul Baru</label>
                    <input value={editingAnn.title} onChange={(e) => setEditingAnn({...editingAnn, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all text-sm font-bold shadow-sm" required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Update Konten</label>
                    <textarea value={editingAnn.content} onChange={(e) => setEditingAnn({...editingAnn, content: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all text-sm min-h-[160px] font-medium leading-relaxed shadow-sm" required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Dokumen Lampiran Baru (Opsional)</label>
                    <div className="relative border border-dashed border-slate-200 hover:border-indigo-400/50 rounded-2xl p-5 bg-slate-50 flex flex-col items-center justify-center transition-all">
                      <input 
                        type="file" 
                        onChange={(e) => handleAnnFileUpload(e, true)} 
                        className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      />
                      <Upload size={24} className="text-slate-400 mb-2" />
                      {editAnnUploading ? (
                        <p className="text-xs text-indigo-500 font-bold animate-pulse">Mengunggah file...</p>
                      ) : editingAnn.fileUrl ? (
                        <p className="text-xs text-emerald-650 font-black truncate max-w-full">✓ {editingAnn.fileName}</p>
                      ) : (
                        <p className="text-xs text-slate-400 font-semibold text-center">Tarik file atau klik untuk memilih dokumen pengumuman baru</p>
                      )}
                    </div>
                  </div>
                  <div className="pt-4 flex gap-4">
                    <button type="button" onClick={() => setShowEditAnn(false)} className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all border border-slate-200 rounded-2xl">Batal</button>
                    <button type="submit" className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] brand-gradient text-white rounded-2xl shadow-xl shadow-indigo-100 hover:opacity-90 transition-all active:scale-95">Simpan Perubahan</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}

        {showDetailAnn && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDetailAnn(null)}>
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }} 
               animate={{ opacity: 1, scale: 1 }} 
               className="bg-white border border-slate-200 max-w-2xl w-full rounded-3xl p-10 shadow-2xl relative overflow-hidden"
               onClick={e => e.stopPropagation()}
            >
               <div className="flex justify-between items-start mb-8">
                  <div>
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] bg-indigo-50 px-3 py-1.5 rounded-full mb-4 block w-fit">Informasi Jurusan BD</span>
                    <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight leading-tight">{showDetailAnn.title}</h2>
                    <div className="flex items-center gap-3 mt-3">
                       <p className="text-[10px] text-indigo-600 uppercase font-black tracking-widest">{showDetailAnn.author}</p>
                       <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                       <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{new Date(showDetailAnn.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowDetailAnn(null)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-all">
                    <Plus size={24} className="rotate-45" />
                  </button>
               </div>
               <div className="text-slate-600 space-y-6 text-sm leading-relaxed max-h-[50vh] overflow-y-auto pr-4 scrollbar-hide py-2 font-medium">
                  {showDetailAnn.content.split('\n').map((line: string, i: number) => (
                    <p key={i}>{line}</p>
                  )) || "Informasi mendalam sedang disiapkan."}
               </div>
               {showDetailAnn.fileUrl && (
                 <div className="mt-6 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center justify-between">
                   <div className="flex items-center gap-3 max-w-[75%]">
                     <div className="p-2.5 bg-[#ecfdf5] text-emerald-600 rounded-xl">
                       <FileText size={20} />
                     </div>
                     <div className="text-left overflow-hidden">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Dokumen Lampiran</p>
                       <p className="text-xs font-bold text-slate-700 mt-1 truncate">{showDetailAnn.fileName || "Dokumen Pengumuman"}</p>
                     </div>
                   </div>
                   <a 
                     href={showDetailAnn.fileUrl} 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="text-[9px] font-black uppercase tracking-widest text-white bg-emerald-500 hover:bg-emerald-600 px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 shrink-0"
                   >
                     Buka File
                   </a>
                 </div>
               )}
               <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end">
                  <button onClick={() => setShowDetailAnn(null)} className="text-[10px] font-black uppercase tracking-[0.2em] brand-gradient text-white px-8 py-3 rounded-xl shadow-lg shadow-indigo-50 active:scale-95 transition-all">Tutup Berita</button>
               </div>
            </motion.div>
          </div>
        )}

        {/* Agenda Modals */}
        {showAddAgenda && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 max-w-lg w-full rounded-3xl p-8 shadow-2xl relative overflow-hidden">
               <h2 className="text-xl font-bold text-slate-800 mb-8 uppercase tracking-[0.2em] flex items-center gap-4">
                  <div className="p-2.5 brand-gradient rounded-xl text-white">
                    <CalendarDays size={20} />
                  </div>
                  Tambahkan Agenda
               </h2>
               <form onSubmit={handleAddAgenda} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Judul Agenda</label>
                    <input value={agendaForm.title} onChange={(e) => setAgendaForm({...agendaForm, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all text-sm font-bold shadow-sm" placeholder="Nama Agenda..." required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tanggal</label>
                        <input value={agendaForm.date} onChange={(e) => setAgendaForm({...agendaForm, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all text-sm font-bold shadow-sm" placeholder="Contoh: 20 Mei" required />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Waktu</label>
                        <input value={agendaForm.time} onChange={(e) => setAgendaForm({...agendaForm, time: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all text-sm font-bold shadow-sm" placeholder="08:00 - selesai" />
                     </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Deskripsi & Lokasi</label>
                    <textarea value={agendaForm.desc} onChange={(e) => setAgendaForm({...agendaForm, desc: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all text-sm shadow-sm" rows={3} placeholder="Berikan rincian singkat lokasi atau instruksi..." />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Dokumen Lampiran Pendukung (Opsional)</label>
                    <div className="relative border border-dashed border-slate-200 hover:border-indigo-400/50 rounded-2xl p-5 bg-slate-50 flex flex-col items-center justify-center transition-all">
                      <input 
                        type="file" 
                        onChange={(e) => handleAgendaFileUpload(e, false)} 
                        className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      />
                      <Upload size={24} className="text-slate-400 mb-2" />
                      {agendaUploading ? (
                        <p className="text-xs text-indigo-500 font-bold animate-pulse">Mengunggah file...</p>
                      ) : agendaForm.fileUrl ? (
                        <p className="text-xs text-emerald-650 font-black truncate max-w-full">✓ {agendaForm.fileName}</p>
                      ) : (
                        <p className="text-xs text-slate-400 font-semibold text-center">Tarik file atau klik untuk memilih dokumen pengumuman/agenda</p>
                      )}
                    </div>
                  </div>
                  <div className="pt-4 flex gap-4">
                    <button type="button" onClick={() => setShowAddAgenda(false)} className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all border border-slate-200 rounded-2xl">Batal</button>
                    <button type="submit" className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] brand-gradient text-white rounded-2xl shadow-xl shadow-indigo-100 hover:opacity-90 transition-all">Simpan Agenda</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}

        {showEditAgenda && editingAgenda && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 max-w-lg w-full rounded-3xl p-8 shadow-2xl relative overflow-hidden">
               <h2 className="text-xl font-bold text-slate-800 mb-8 uppercase tracking-[0.2em] flex items-center gap-4">
                  <div className="p-2.5 brand-gradient rounded-xl text-white">
                    <Edit size={20} />
                  </div>
                  Ubah Detail Agenda
               </h2>
               <form onSubmit={handleEditAgenda} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Judul Agenda</label>
                    <input value={editingAgenda.title} onChange={(e) => setEditingAgenda({...editingAgenda, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all text-sm font-bold shadow-sm" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tanggal</label>
                        <input value={editingAgenda.date} onChange={(e) => setEditingAgenda({...editingAgenda, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all text-sm font-bold shadow-sm" required />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Waktu</label>
                        <input value={editingAgenda.time} onChange={(e) => setEditingAgenda({...editingAgenda, time: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all text-sm font-bold shadow-sm" />
                     </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Deksripsi Update</label>
                    <textarea value={editingAgenda.desc} onChange={(e) => setEditingAgenda({...editingAgenda, desc: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all text-sm shadow-sm" rows={3} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Dokumen Lampiran Baru (Opsional)</label>
                    <div className="relative border border-dashed border-slate-200 hover:border-indigo-400/50 rounded-2xl p-5 bg-slate-50 flex flex-col items-center justify-center transition-all">
                      <input 
                        type="file" 
                        onChange={(e) => handleAgendaFileUpload(e, true)} 
                        className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      />
                      <Upload size={24} className="text-slate-400 mb-2" />
                      {editAgendaUploading ? (
                        <p className="text-xs text-indigo-500 font-bold animate-pulse">Mengunggah file...</p>
                      ) : editingAgenda.fileUrl ? (
                        <p className="text-xs text-emerald-650 font-black truncate max-w-full">✓ {editingAgenda.fileName}</p>
                      ) : (
                        <p className="text-xs text-slate-400 font-semibold text-center">Tarik file atau klik untuk memilih dokumen pengumuman/agenda baru</p>
                      )}
                    </div>
                  </div>
                  <div className="pt-4 flex gap-4">
                    <button type="button" onClick={() => setShowEditAgenda(false)} className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all border border-slate-200 rounded-2xl">Batal</button>
                    <button type="submit" className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] brand-gradient text-white rounded-2xl shadow-xl shadow-indigo-100 hover:opacity-90 transition-all">Simpan Update</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
