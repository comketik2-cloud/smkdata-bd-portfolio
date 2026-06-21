import React, { useState, useEffect } from "react";
import { User } from "../types";
import { Plus, Search, GraduationCap, Trash2, Edit, Loader2, Users, ChevronRight, Filter, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Student {
  id: string;
  name: string;
  nis: string;
  grade: string;
  status: string;
  academicYear?: string;
}

export default function Students({ user }: { user: User }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("Semua");
  const [academicFilter, setAcademicFilter] = useState("Semua");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [isManualYear, setIsManualYear] = useState(false);
  const [isManualRombel, setIsManualRombel] = useState(false);

  const defaultYears = [
    "2026/2027",
    "2027/2028",
    "2028/2029",
    "2029/2030",
    "2031/2032",
    "2032/2033",
    "2033/2034",
    "2034/2035",
    "2035/2036",
    "2036/2037"
  ];
  const academicYears = Array.from(new Set([
    ...defaultYears,
    ...students.map(s => s.academicYear).filter(Boolean) as string[]
  ])).sort((a, b) => b.localeCompare(a));

  const defaultGrades = [
    ...Array.from({ length: 10 }, (_, i) => `X BD ${i + 1}`),
    ...Array.from({ length: 10 }, (_, i) => `XI BD ${i + 1}`),
    ...Array.from({ length: 10 }, (_, i) => `XII BD ${i + 1}`),
  ];
  const gradeOptions = Array.from(new Set([
    ...defaultGrades,
    ...students.map(s => s.grade).filter(Boolean) as string[]
  ]));

  const [formData, setFormData] = useState({ name: "", nis: "", grade: "X BD 1", status: "Aktif", academicYear: "2026/2027" });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/students");
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchStudents();
        setShowAddModal(false);
        setFormData({ name: "", nis: "", grade: "X BD 1", status: "Aktif", academicYear: "2026/2027" });
      }
    } catch (error) { console.error(error); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      const res = await fetch(`/api/students/${editingStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingStudent)
      });
      if (res.ok) {
        fetchStudents();
        setShowEditModal(false);
      }
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data siswa ini?")) return;
    try {
      await fetch(`/api/students/${id}`, { method: "DELETE" });
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (error) { console.error(error); }
  };

  const filtered = students.filter(s => {
    const sYear = s.academicYear || "2026/2027";
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                         s.nis.includes(search) ||
                         s.grade.toLowerCase().includes(search.toLowerCase());
    const matchesGrade = gradeFilter === "Semua" || s.grade === gradeFilter;
    const matchesAcademic = academicFilter === "Semua" || sYear === academicFilter;
    return matchesSearch && matchesGrade && matchesAcademic;
  });

  const stats = {
    total: students.length,
    kelasX: students.filter(s => s.grade.startsWith("X ")).length,
    kelasXI: students.filter(s => s.grade.startsWith("XI ")).length,
    kelasXII: students.filter(s => s.grade.startsWith("XII ")).length,
  };

  const rombelSummary = students.reduce((acc: any, s) => {
    acc[s.grade] = (acc[s.grade] || 0) + 1;
    return acc;
  }, {});

  const sortedRombels = Object.keys(rombelSummary).sort((a,b) => {
    const aMatch = a.match(/(\d+)/);
    const bMatch = b.match(/(\d+)/);
    if (aMatch && bMatch) return parseInt(aMatch[0]) - parseInt(bMatch[0]);
    return a.localeCompare(b);
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 uppercase tracking-tight">Database Siswa</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Kelola data induk siswa Jurusan Bisnis Digital secara terpusat.</p>
        </div>
        {(user.role === "admin" || user.role === "guru") && (
          <button 
            onClick={() => { setIsManualYear(false); setIsManualRombel(false); setShowAddModal(true); }}
            className="brand-gradient text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={18} /> Daftarkan Siswa
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Populasi", value: stats.total, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Siswa Kelas X", value: stats.kelasX, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Siswa Kelas XI", value: stats.kelasXI, icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Siswa Kelas XII", value: stats.kelasXII, icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-3xl p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`p-4 ${stat.bg} rounded-2xl ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              <h3 className="text-3xl font-display font-light text-slate-800 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        <button 
          onClick={() => setGradeFilter("Semua")}
          className={`shrink-0 px-6 py-4 rounded-2xl border transition-all flex flex-col items-start gap-1 min-w-[140px] shadow-sm ${
            gradeFilter === "Semua" ? 'brand-gradient border-transparent text-white shadow-indigo-100' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'
          }`}
        >
          <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Global</span>
          <div className="flex justify-between w-full items-center">
            <span className="text-xs font-bold">Semua Rombel</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${gradeFilter === "Semua" ? 'bg-white/20' : 'bg-slate-50 text-slate-500'}`}>{stats.total}</span>
          </div>
        </button>
        {sortedRombels.map(rombel => (
          <button 
            key={rombel} 
            onClick={() => setGradeFilter(rombel)}
            className={`shrink-0 px-6 py-4 rounded-2xl border transition-all flex flex-col items-start gap-1 min-w-[140px] shadow-sm ${
              gradeFilter === rombel ? 'brand-gradient border-transparent text-white shadow-indigo-100' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'
            }`}
          >
            <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Rombel</span>
            <div className="flex justify-between w-full items-center">
              <span className="text-xs font-bold">{rombel}</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${gradeFilter === rombel ? 'bg-white/20' : 'bg-slate-50 text-slate-500'}`}>{rombelSummary[rombel]}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-4 flex flex-col md:flex-row gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari Nama Siswa atau NIS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-4 text-slate-700 outline-none focus:border-indigo-500/50 transition-all font-bold text-sm placeholder:text-slate-400 shadow-inner"
          />
        </div>
        <div className="w-full md:w-64">
           <select 
            value={academicFilter} 
            onChange={(e) => setAcademicFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-slate-700 outline-none focus:border-indigo-500/50 transition-all font-bold text-sm appearance-none cursor-pointer shadow-inner"
           >
              <option value="Semua">Semua Tahun Pelajaran</option>
              {academicYears.map(y => <option key={y} value={y}>TP {y}</option>)}
           </select>
        </div>
        <div className="w-full md:w-64">
           <select 
            value={gradeFilter} 
            onChange={(e) => setGradeFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-slate-700 outline-none focus:border-indigo-500/50 transition-all font-bold text-sm appearance-none cursor-pointer shadow-inner"
           >
              <option value="Semua">Filter Per Kelas</option>
              {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {loading ? (
            <div className="col-span-full py-32 flex flex-col items-center gap-6">
              <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Menghubungkan ke Pusat Data...</p>
            </div>
          ) : filtered.map((s) => (
            <motion.div 
              key={s.id} 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white border border-slate-100 rounded-[2.5rem] p-8 relative group overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 border border-slate-100 hover:border-indigo-200"
            >
              <div className="absolute top-0 right-0 w-32 h-32 brand-gradient opacity-0 group-hover:opacity-5 blur-3xl -mr-16 -mt-16 transition-all duration-700"></div>
              <div className="flex items-start justify-between mb-8 relative z-10">
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-indigo-600 group-hover:brand-gradient group-hover:text-white transition-all shadow-inner">
                  <GraduationCap size={32} />
                </div>
                {(user.role === "admin" || user.role === "guru") && (
                  <div className="flex gap-2 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    <button 
                      onClick={() => { setIsManualYear(false); setIsManualRombel(false); setEditingStudent(s); setShowEditModal(true); }}
                      className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:shadow-lg transition-all"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(s.id)}
                      className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-rose-600 hover:shadow-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors uppercase tracking-tight leading-tight">{s.name}</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                   <p className="text-[10px] font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg uppercase tracking-widest border border-slate-100 group-hover:border-indigo-100 transition-all">NIS: {s.nis}</p>
                   <p className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase tracking-widest border border-indigo-100">{s.grade}</p>
                   <p className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg uppercase tracking-widest border border-amber-100">TP: {s.academicYear || "2025/2026"}</p>
                </div>
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className={`text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-sm ${
                    s.status === "Aktif" ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : 'text-amber-600 bg-amber-50 border border-amber-100'
                  }`}>
                    {s.status}
                  </span>
                  <button className="text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-all uppercase tracking-[0.2em] flex items-center gap-2 group/btn">
                    Profil Lengkap <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
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
                    {showAddModal ? 'Daftarkan Siswa' : 'Perbarui Siswa'}
                 </h2>
                 <button onClick={() => showAddModal ? setShowAddModal(false) : setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
                    <X size={20} />
                 </button>
               </div>
               <form onSubmit={showAddModal ? handleAdd : handleEdit} className="space-y-8 overflow-y-auto pr-2 scrollbar-hide flex-1">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Identitas Lengkap</label>
                    <input type="text" value={showAddModal ? formData.name : editingStudent?.name} onChange={(e) => showAddModal ? setFormData({...formData, name: e.target.value}) : setEditingStudent({...editingStudent!, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all text-sm font-bold shadow-sm" placeholder="Nama Lengkap..." required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nomor Induk (NIS)</label>
                    <input type="text" value={showAddModal ? formData.nis : editingStudent?.nis} onChange={(e) => showAddModal ? setFormData({...formData, nis: e.target.value}) : setEditingStudent({...editingStudent!, nis: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all text-sm font-bold shadow-sm" placeholder="NIS Siswa..." required />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Kelas & Rombel</label>
                       <select 
                         value={isManualRombel ? "manual" : (showAddModal ? formData.grade : (editingStudent?.grade || "X BD 1"))} 
                         onChange={(e) => {
                           const val = e.target.value;
                           if (val === "manual") {
                             setIsManualRombel(true);
                             if (showAddModal) {
                               setFormData({...formData, grade: ""});
                             } else if (editingStudent) {
                               setEditingStudent({...editingStudent, grade: ""});
                             }
                           } else {
                             setIsManualRombel(false);
                             if (showAddModal) {
                               setFormData({...formData, grade: val});
                             } else if (editingStudent) {
                               setEditingStudent({...editingStudent, grade: val});
                             }
                           }
                         }} 
                         className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none text-sm font-bold cursor-pointer"
                       >
                         {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
                         <option value="manual">+ Ketik Manual (Rombel Baru)...</option>
                       </select>
                       {isManualRombel && (
                         <input 
                           type="text"
                           placeholder="Tulis Rombel Baru, Contoh: XII BD 11"
                           value={showAddModal ? formData.grade : (editingStudent?.grade || "")}
                           onChange={(e) => {
                             const val = e.target.value;
                             if (showAddModal) {
                               setFormData({...formData, grade: val});
                             } else if (editingStudent) {
                               setEditingStudent({...editingStudent, grade: val});
                             }
                           }}
                           className="w-full bg-indigo-50/50 border border-indigo-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500 text-sm font-bold shadow-inner mt-2"
                           required
                         />
                       )}
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Status Hunian</label>
                       <select value={showAddModal ? formData.status : editingStudent?.status} onChange={(e) => showAddModal ? setFormData({...formData, status: e.target.value}) : setEditingStudent({...editingStudent!, status: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none text-sm font-bold cursor-pointer">
                         {["Aktif", "Lulus", "PKL", "Pindah"].map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                    </div>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tahun Pelajaran (TP)</label>
                     <select 
                       value={isManualYear ? "manual" : (showAddModal ? formData.academicYear : (editingStudent?.academicYear || "2026/2027"))} 
                       onChange={(e) => {
                         const val = e.target.value;
                         if (val === "manual") {
                           setIsManualYear(true);
                           if (showAddModal) {
                             setFormData({...formData, academicYear: ""});
                           } else if (editingStudent) {
                             setEditingStudent({...editingStudent, academicYear: ""});
                           }
                         } else {
                           setIsManualYear(false);
                           if (showAddModal) {
                             setFormData({...formData, academicYear: val});
                           } else if (editingStudent) {
                             setEditingStudent({...editingStudent, academicYear: val});
                           }
                         }
                       }} 
                       className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none text-sm font-bold cursor-pointer font-bold shadow-sm"
                     >
                       {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                       <option value="manual">+ Ketik Manual (TP Baru)...</option>
                     </select>
                     {isManualYear && (
                       <input 
                         type="text"
                         placeholder="Tulis Tahun Ajaran Baru, Contoh: 2028/2029"
                         value={showAddModal ? formData.academicYear : (editingStudent?.academicYear || "")}
                         onChange={(e) => {
                           const val = e.target.value;
                           if (showAddModal) {
                             setFormData({...formData, academicYear: val});
                           } else if (editingStudent) {
                             setEditingStudent({...editingStudent, academicYear: val});
                           }
                         }}
                         className="w-full bg-indigo-50/50 border border-indigo-200 text-slate-800 rounded-2xl p-5 outline-none focus:border-indigo-500 text-sm font-bold shadow-inner mt-2"
                         required
                       />
                     )}
                  </div>
                  <div className="pt-6 flex gap-4">
                    <button type="button" onClick={() => showAddModal ? setShowAddModal(false) : setShowEditModal(false)} className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all border border-slate-200 rounded-2xl">Batalkan</button>
                    <button type="submit" className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] brand-gradient text-white rounded-2xl shadow-xl shadow-indigo-100 hover:opacity-90 transition-all active:scale-95">Simpan Data</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
