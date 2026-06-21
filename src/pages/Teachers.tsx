import React, { useState, useEffect } from "react";
import { User } from "../types";
import { Plus, Search, UserCheck, Shield, Trash2, Edit, Loader2, UserCircle, X, Upload } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Teacher {
  id: string;
  name: string;
  nip: string;
  spec: string;
  status: string;
  photoUrl?: string;
  academicYear?: string;
}

export default function Teachers({ user }: { user: User }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specFilter, setSpecFilter] = useState("Semua");
  const [academicFilter, setAcademicFilter] = useState("Semua");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const [isManualYear, setIsManualYear] = useState(false);
  const [uploading, setUploading] = useState(false);

  const defaultYears = [
    "2026/2027",
    "2027/2028",
    "2028/2029",
    "2029/2030",
    "2030/2031",
    "2031/2032",
    "2032/2033",
    "2033/2034",
    "2034/2035",
    "2035/2036",
    "2036/2037"
  ];
  const academicYears = Array.from(new Set([
    ...defaultYears,
    ...teachers.map(t => t.academicYear).filter(Boolean) as string[]
  ])).sort((a, b) => b.localeCompare(a));

  const specs = ["Digital Marketing", "E-Commerce", "Multimedia", "Bisnis", "Umum"];

  const [formData, setFormData] = useState({ name: "", nip: "", spec: "Digital Marketing", status: "Aktif", photoUrl: "", academicYear: "2026/2027" });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await fetch("/api/teachers");
      const data = await response.json();
      setTeachers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const formDataFile = new FormData();
    formDataFile.append("files", e.target.files[0]);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataFile,
      });
      const data = await res.json();
      if (data && data.length > 0) {
        if (showAddModal) {
          setFormData(prev => ({ ...prev, photoUrl: data[0].url }));
        } else if (editingTeacher) {
          setEditingTeacher(prev => prev ? { ...prev, photoUrl: data[0].url } : null);
        }
      }
    } catch (err) {
      console.error("Error uploading photo:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchTeachers();
        setShowAddModal(false);
        setFormData({ name: "", nip: "", spec: "Digital Marketing", status: "Aktif", photoUrl: "", academicYear: "2026/2027" });
      }
    } catch (error) { console.error(error); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    try {
      const res = await fetch(`/api/teachers/${editingTeacher.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTeacher)
      });
      if (res.ok) {
        fetchTeachers();
        setShowEditModal(false);
      }
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data guru ini?")) return;
    try {
      await fetch(`/api/teachers/${id}`, { method: "DELETE" });
      setTeachers(prev => prev.filter(t => t.id !== id));
    } catch (error) { console.error(error); }
  };

  const filtered = teachers.filter(t => {
    const tYear = t.academicYear || "2026/2027";
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.nip.includes(search);
    const matchesSpec = specFilter === "Semua" || t.spec === specFilter;
    const matchesAcademic = academicFilter === "Semua" || tYear === academicFilter;
    return matchesSearch && matchesSpec && matchesAcademic;
  });

  if (loading) {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center gap-6">
         <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Sinkronisasi Database Guru...</p>
       </div>
     );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 uppercase tracking-tight">SDM & Tenaga Pengajar</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Profil dan manajemen tenaga pendidik Jurusan Bisnis Digital.</p>
        </div>
        {user.role === "admin" && (
          <button 
            onClick={() => { setIsManualYear(false); setShowAddModal(true); }}
            className="brand-gradient text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={18} /> Daftarkan Guru
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-4 flex flex-col md:flex-row gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari Nama Guru atau NIP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-4 text-slate-700 outline-none focus:border-indigo-500/50 transition-all font-bold text-sm placeholder:text-slate-400 shadow-inner"
          />
        </div>
        <select 
          value={academicFilter} 
          onChange={(e) => setAcademicFilter(e.target.value)}
          className="md:w-64 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-700 outline-none font-bold text-sm appearance-none cursor-pointer shadow-inner"
        >
          <option value="Semua">Semua Tahun Pelajaran</option>
          {academicYears.map(y => <option key={y} value={y}>TP {y}</option>)}
        </select>
        <select 
          value={specFilter} 
          onChange={(e) => setSpecFilter(e.target.value)}
          className="md:w-64 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-700 outline-none font-bold text-sm appearance-none cursor-pointer shadow-inner"
        >
          <option value="Semua">Semua Spesialisasi</option>
          {specs.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <div className="col-span-full py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center gap-4 text-slate-400 opacity-50 shadow-inner">
               <UserCircle size={48} />
               <p className="text-[10px] font-black uppercase tracking-[0.3em]">Data tidak ditemukan</p>
            </div>
          ) : filtered.map((t) => (
            <motion.div 
              key={t.id} 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-100 rounded-[2.5rem] p-8 group hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 brand-gradient opacity-0 group-hover:opacity-5 blur-3xl -mr-16 -mt-16 transition-all duration-700"></div>
              <div className="flex items-start justify-between mb-8 relative z-10">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-blue-600 shadow-inner group-hover:brand-gradient group-hover:text-white transition-all shadow-sm overflow-hidden border-2 border-white">
                  {t.photoUrl ? (
                    <img src={t.photoUrl} alt={t.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle size={40} />
                  )}
                </div>
                {user.role === "admin" && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                    <button 
                      onClick={() => { setIsManualYear(false); setEditingTeacher(t); setShowEditModal(true); }}
                      className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:shadow-lg transition-all shadow-sm"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(t.id)}
                      className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 hover:shadow-lg transition-all shadow-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{t.name}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">NIP: {t.nip} • TP: {t.academicYear || "2026/2027"}</p>
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl uppercase tracking-widest border border-indigo-100">{t.spec}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${t.status === 'Aktif' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.status}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modals with Light theme */}
      <AnimatePresence>
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 max-w-lg w-full rounded-[2.5rem] p-10 shadow-2xl relative flex flex-col max-h-[90vh]">
               <div className="flex justify-between items-center mb-10 relative z-10">
                 <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4">
                    <div className="p-3 brand-gradient rounded-2xl text-white shadow-lg shadow-indigo-100">
                      {showAddModal ? <Plus size={22} /> : <Edit size={22} />}
                    </div>
                    {showAddModal ? 'Tambah Guru' : 'Perbarui Data'}
                 </h2>
                 <button onClick={() => showAddModal ? setShowAddModal(false) : setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
                    <X size={20} />
                 </button>
               </div>
               <form onSubmit={showAddModal ? handleAdd : handleEdit} className="space-y-8 overflow-y-auto pr-2 scrollbar-hide flex-1">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nama Lengkap & Gelar</label>
                    <input type="text" value={showAddModal ? formData.name : editingTeacher?.name} onChange={(e) => showAddModal ? setFormData({...formData, name: e.target.value}) : setEditingTeacher({...editingTeacher!, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all text-sm font-bold shadow-sm" placeholder="Contoh: Budi Santoso, S.Kom, M.T" required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">NIP / ID Pendidik</label>
                    <input type="text" value={showAddModal ? formData.nip : editingTeacher?.nip} onChange={(e) => showAddModal ? setFormData({...formData, nip: e.target.value}) : setEditingTeacher({...editingTeacher!, nip: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all text-sm font-bold shadow-sm" placeholder="Nomor Induk Pegawai..." required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      Foto Profil Guru (PNG, JPG, JPEG)
                    </label>
                    <div className="flex items-center gap-5 bg-slate-50 border border-slate-200 rounded-2xl p-5">
                      <div className="w-16 h-16 bg-white rounded-2xl border border-slate-100 shadow-inner flex items-center justify-center overflow-hidden flex-shrink-0">
                        {(showAddModal ? formData.photoUrl : editingTeacher?.photoUrl) ? (
                          <img 
                            src={showAddModal ? formData.photoUrl : editingTeacher?.photoUrl} 
                            alt="Pratinjau Guru" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <UserCircle size={32} className="text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        {uploading ? (
                          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
                            <Loader2 size={16} className="animate-spin" />
                            <span>Mengunggah foto...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            <label className="inline-flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 hover:border-indigo-200 font-black text-[10px] uppercase tracking-widest px-4 py-3 rounded-xl cursor-pointer transition-all self-start shadow-sm">
                              <Upload size={14} />
                              <span>Unggah Foto</span>
                              <input 
                                type="file" 
                                accept="image/png, image/jpeg, image/jpg" 
                                className="hidden" 
                                onChange={handleImageUpload} 
                              />
                            </label>
                            <p className="text-[9px] font-bold text-slate-400 leading-none">Format: PNG, JPG (Maksimal 5MB)</p>
                          </div>
                        )}
                      </div>
                      {(showAddModal ? formData.photoUrl : editingTeacher?.photoUrl) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (showAddModal) {
                              setFormData({ ...formData, photoUrl: "" });
                            } else if (editingTeacher) {
                              setEditingTeacher({ ...editingTeacher, photoUrl: "" });
                            }
                          }}
                          className="p-2 border border-rose-100 text-rose-500 hover:bg-rose-50 rounded-xl transition-all flex-shrink-0"
                          title="Hapus Foto"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Keahlian Utama (Bisa Isi Manual)</label>
                       <input 
                         list="spec-list"
                         value={showAddModal ? formData.spec : editingTeacher?.spec} 
                         onChange={(e) => showAddModal ? setFormData({...formData, spec: e.target.value}) : setEditingTeacher({...editingTeacher!, spec: e.target.value})} 
                         className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none text-sm font-bold shadow-sm"
                         placeholder="Pilih atau Ketik..."
                       />
                       <datalist id="spec-list">
                         {specs.map(s => <option key={s} value={s} />)}
                       </datalist>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Status Kepegawaian</label>
                       <select value={showAddModal ? formData.status : editingTeacher?.status} onChange={(e) => showAddModal ? setFormData({...formData, status: e.target.value}) : setEditingTeacher({...editingTeacher!, status: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none text-sm font-bold shadow-sm cursor-pointer">
                         {["Aktif", "Cuti", "Non-Aktif"].map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                    </div>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tahun Pelajaran (TP)</label>
                     <select 
                       value={isManualYear ? "manual" : (showAddModal ? formData.academicYear : (editingTeacher?.academicYear || "2026/2027"))} 
                       onChange={(e) => {
                         const val = e.target.value;
                         if (val === "manual") {
                           setIsManualYear(true);
                           if (showAddModal) {
                             setFormData({...formData, academicYear: ""});
                           } else if (editingTeacher) {
                             setEditingTeacher({...editingTeacher, academicYear: ""});
                           }
                         } else {
                           setIsManualYear(false);
                           if (showAddModal) {
                             setFormData({...formData, academicYear: val});
                           } else if (editingTeacher) {
                             setEditingTeacher({...editingTeacher, academicYear: val});
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
                         value={showAddModal ? formData.academicYear : (editingTeacher?.academicYear || "")}
                         onChange={(e) => {
                           const val = e.target.value;
                           if (showAddModal) {
                             setFormData({...formData, academicYear: val});
                           } else if (editingTeacher) {
                             setEditingTeacher({...editingTeacher, academicYear: val});
                           }
                         }}
                         className="w-full bg-indigo-50/50 border border-indigo-200 text-slate-800 rounded-2xl p-5 outline-none focus:border-indigo-500 text-sm font-bold shadow-inner mt-2"
                         required
                       />
                     )}
                  </div>
                  <div className="pt-6 flex gap-4">
                    <button type="button" onClick={() => showAddModal ? setShowAddModal(false) : setShowEditModal(false)} className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all border border-slate-200 rounded-2xl">Batal</button>
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

