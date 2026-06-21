import React, { useState, useEffect } from "react";
import { User } from "../types";
import { Calendar, Clock, MapPin, User as UserIcon, Loader2, ChevronRight, Plus, Edit, Trash2, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Schedule {
  id: string;
  day: string;
  time: string;
  subject: string;
  teacher: string;
}

export default function Schedules({ user }: { user: User }) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState("Semua");
  const [teacherFilter, setTeacherFilter] = useState("Semua");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const days = ["Sabtu", "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
  const teachers = Array.from(new Set(schedules.map(s => s.teacher))).sort();

  const [formData, setFormData] = useState({ 
    day: "Sabtu", 
    time: "08:00 - 10:00", 
    subject: "", 
    teacher: "" 
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/schedules");
      const data = await response.json();
      setSchedules(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchSchedules();
        setShowAddModal(false);
        setFormData({ day: "Sabtu", time: "08:00 - 10:00", subject: "", teacher: "" });
      }
    } catch (error) { console.error(error); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;
    try {
      const res = await fetch(`/api/schedules/${editingSchedule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingSchedule)
      });
      if (res.ok) {
        fetchSchedules();
        setShowEditModal(false);
      }
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus jadwal ini?")) return;
    try {
      await fetch(`/api/schedules/${id}`, { method: "DELETE" });
      setSchedules(prev => prev.filter(s => s.id !== id));
    } catch (error) { console.error(error); }
  };

  const filteredSchedules = schedules.filter(s => {
    const matchesSearch = s.teacher.toLowerCase().includes(search.toLowerCase()) || 
                         s.subject.toLowerCase().includes(search.toLowerCase());
    const matchesDay = dayFilter === "Semua" || s.day === dayFilter;
    const matchesTeacher = teacherFilter === "Semua" || s.teacher === teacherFilter;
    return matchesSearch && matchesDay && matchesTeacher;
  });

  if (loading) {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center gap-6">
         <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Sinkronisasi Jadwal...</p>
       </div>
     );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 uppercase tracking-tight">Jadwal Akademik</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Kalender sekolah dan agenda harian Bisnis Digital.</p>
        </div>
        {user.role === "admin" && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="brand-gradient text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={18} /> Tambah Jadwal
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-4 flex flex-col md:flex-row gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari Nama Guru atau Mata Pelajaran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-4 text-slate-700 outline-none focus:border-indigo-500/50 transition-all font-bold text-sm placeholder:text-slate-400 shadow-inner"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
           <select 
            value={dayFilter} 
            onChange={(e) => setDayFilter(e.target.value)}
            className="flex-1 md:w-40 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-700 outline-none font-bold text-sm appearance-none cursor-pointer shadow-inner"
           >
              <option value="Semua">Semua Hari</option>
              {days.map(d => <option key={d} value={d}>{d}</option>)}
           </select>
           <select 
            value={teacherFilter} 
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="flex-1 md:w-64 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-700 outline-none font-bold text-sm appearance-none cursor-pointer shadow-inner"
           >
              <option value="Semua">Filter Per Guru</option>
              {teachers.map(t => <option key={t} value={t}>{t}</option>)}
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {(dayFilter === "Semua" ? days : [dayFilter]).map((day) => {
          const dayItems = filteredSchedules.filter(s => s.day === day);
          if (dayFilter === "Semua" && dayItems.length === 0 && search === "") return null;
          return (
            <div key={day} className="space-y-6">
              <div className="flex items-center gap-6">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-[0.3em]">{day}</h2>
                <div className="flex-1 h-px bg-slate-100"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                  {dayItems.length > 0 ? dayItems.map((item) => (
                    <motion.div 
                      key={item.id} 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white border border-slate-100 rounded-[2.5rem] p-8 group hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 brand-gradient opacity-0 group-hover:opacity-5 blur-3xl -mr-16 -mt-16 transition-all duration-700"></div>
                      <div className="flex justify-between items-start mb-8 relative z-10">
                        <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:brand-gradient group-hover:text-white transition-all shadow-inner">
                          <Clock size={24} />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <span className="text-[10px] font-black text-slate-400 border border-slate-100 px-3 py-1 rounded-lg uppercase tracking-widest">{item.time}</span>
                           {user.role === "admin" && (
                             <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                <button onClick={() => { setEditingSchedule(item); setShowEditModal(true); }} className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:shadow-lg transition-all"><Edit size={16} /></button>
                                <button onClick={() => handleDelete(item.id)} className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 hover:shadow-lg transition-all"><Trash2 size={16} /></button>
                             </div>
                           )}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors uppercase tracking-tight leading-tight relative z-10">{item.subject}</h3>
                      <div className="flex items-center gap-3 text-slate-500 mb-8 relative z-10">
                        <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center">
                          <UserIcon size={12} />
                        </div>
                        <span className="text-xs font-bold">{item.teacher}</span>
                      </div>
                      <div className="pt-6 border-t border-slate-100 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <MapPin size={14} className="text-indigo-500" /> Lab Digital 1
                        </div>
                        <button className="text-indigo-600 p-2 bg-indigo-50 rounded-xl hover:brand-gradient hover:text-white transition-all shadow-sm"><ChevronRight size={20} /></button>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="col-span-full py-16 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
                      Tidak ada jadwal terdaftar
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals Add/Edit with Light theme */}
      <AnimatePresence>
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 max-w-lg w-full rounded-[2.5rem] p-10 shadow-2xl relative flex flex-col max-h-[90vh]">
               <div className="flex justify-between items-center mb-10 relative z-10">
                 <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4">
                    <div className="p-3 brand-gradient rounded-2xl text-white shadow-lg shadow-indigo-100">
                      {showAddModal ? <Plus size={22} /> : <Edit size={22} />}
                    </div>
                    {showAddModal ? 'Tambah Jadwal' : 'Perbarui Jadwal'}
                 </h2>
                 <button onClick={() => showAddModal ? setShowAddModal(false) : setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
                    <X size={20} />
                 </button>
               </div>
               <form onSubmit={showAddModal ? handleAdd : handleEdit} className="space-y-8 overflow-y-auto pr-2 scrollbar-hide flex-1">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Hari Teoretis</label>
                       <select value={showAddModal ? formData.day : editingSchedule?.day} onChange={(e) => showAddModal ? setFormData({...formData, day: e.target.value}) : setEditingSchedule({...editingSchedule!, day: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none text-sm font-bold cursor-pointer">
                         {days.map(d => <option key={d} value={d}>{d}</option>)}
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Waktu Sessi</label>
                       <input type="text" value={showAddModal ? formData.time : editingSchedule?.time} onChange={(e) => showAddModal ? setFormData({...formData, time: e.target.value}) : setEditingSchedule({...editingSchedule!, time: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all text-sm font-bold shadow-sm" placeholder="Contoh: 08:00 - 10:00" required />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nama Mata Pelajaran</label>
                    <input type="text" value={showAddModal ? formData.subject : editingSchedule?.subject} onChange={(e) => showAddModal ? setFormData({...formData, subject: e.target.value}) : setEditingSchedule({...editingSchedule!, subject: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all text-sm font-bold shadow-sm" placeholder="Misal: Bisnis Digital" required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nama Guru Pengajar</label>
                    <input type="text" value={showAddModal ? formData.teacher : editingSchedule?.teacher} onChange={(e) => showAddModal ? setFormData({...formData, teacher: e.target.value}) : setEditingSchedule({...editingSchedule!, teacher: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all text-sm font-bold shadow-sm" placeholder="Nama Lengkap Guru..." required />
                  </div>
                  <div className="pt-6 flex gap-4">
                    <button type="button" onClick={() => showAddModal ? setShowAddModal(false) : setShowEditModal(false)} className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all border border-slate-200 rounded-2xl">Batal</button>
                    <button type="submit" className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] brand-gradient text-white rounded-2xl shadow-xl shadow-indigo-100 hover:opacity-90 transition-all active:scale-95">Simpan Jadwal</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
