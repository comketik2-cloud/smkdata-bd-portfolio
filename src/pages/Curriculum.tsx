import React, { useState, useEffect } from "react";
import { FileText, Plus, Search, Edit, Trash2, Loader2, CheckCircle, Clock, Eye, ChevronRight, X, Upload, File, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, Attachment } from "../types";

interface CurriculumItem {
  id: string;
  fase: string;
  grade: string;
  title: string;
  content: string;
  type: string;
  status: string;
  attachments?: Attachment[];
}

export default function Curriculum({ user }: { user: User }) {
  const [items, setItems] = useState<CurriculumItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<CurriculumItem | null>(null);
  const [editingItem, setEditingItem] = useState<CurriculumItem | null>(null);
  const [search, setSearch] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    fase: "Fase E",
    grade: "Kelas X",
    title: "",
    content: "",
    type: "CP",
    status: "Aktif"
  });

  useEffect(() => {
    fetchCurriculums();
  }, []);

  const fetchCurriculums = async () => {
    try {
      const res = await fetch("/api/curriculums");
      const data = await res.json();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const form = new FormData();
    Array.from(files).forEach((file) => {
      form.append("files", file as Blob);
    });

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });
      if (response.ok) {
        const uploadedFiles = await response.json();
        setAttachments([...attachments, ...uploadedFiles]);
      }
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Gagal mengunggah file. Silakan coba lagi.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleEditFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingItem) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const form = new FormData();
    Array.from(files).forEach((file) => {
      form.append("files", file as Blob);
    });

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });
      if (response.ok) {
        const uploadedFiles = await response.json();
        const currentAttachments = editingItem.attachments || [];
        setEditingItem({
          ...editingItem,
          attachments: [...currentAttachments, ...uploadedFiles]
        });
      }
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Gagal mengunggah file. Silakan coba lagi.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeEditAttachment = (index: number) => {
    if (!editingItem) return;
    const currentAttachments = editingItem.attachments || [];
    setEditingItem({
      ...editingItem,
      attachments: currentAttachments.filter((_, i) => i !== index)
    });
  };

  const openAttachment = (file: Attachment) => {
    if (file.url) {
      window.open(file.url, "_blank");
    } else {
      const mockUrl = `https://example.com/mock-file.${file.type.toLowerCase()}`;
      window.open(mockUrl, "_blank");
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/curriculums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          attachments
        })
      });
      if (res.ok) {
        fetchCurriculums();
        setShowAddModal(false);
        setFormData({ fase: "Fase E", grade: "Kelas X", title: "", content: "", type: "CP", status: "Aktif" });
        setAttachments([]);
      }
    } catch (e) { console.error(e); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const res = await fetch(`/api/curriculums/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem)
      });
      if (res.ok) {
        fetchCurriculums();
        setShowEditModal(false);
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus dokumen ini?")) return;
    try {
      await fetch(`/api/curriculums/${id}`, { method: "DELETE" });
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) { console.error(e); }
  };

  const filtered = items.filter(i => 
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.grade.toLowerCase().includes(search.toLowerCase()) ||
    i.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 uppercase tracking-tight">CP & ATP</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Struktur Kurikulum Merdeka Jurusan Bisnis Digital.</p>
        </div>
        {(user.role === "admin" || user.role === "guru") && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="brand-gradient text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={18} /> Dokumen Baru
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm">
        <div className="relative">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari Judul Capaian atau Alur Tujuan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-4 text-slate-700 outline-none focus:border-indigo-500/50 transition-all font-bold text-sm placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AnimatePresence>
          {loading ? (
            <div className="col-span-full py-32 flex flex-col items-center gap-6">
               <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Sinkronisasi Dokumen...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full py-32 flex flex-col items-center gap-6 opacity-30">
               <FileText size={64} className="text-slate-300" />
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Belum ada dokumen CP/ATP</p>
            </div>
          ) : filtered.map((item) => (
            <motion.div 
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => setShowDetailModal(item)}
              className="bg-white border border-slate-100 rounded-[2.5rem] p-8 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 brand-gradient opacity-0 group-hover:opacity-5 blur-3xl -mr-16 -mt-16 transition-all duration-700"></div>
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex items-center gap-5">
                   <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-indigo-600 group-hover:brand-gradient group-hover:text-white transition-all shadow-inner">
                      <FileText size={32} />
                   </div>
                   <div>
                      <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight text-lg leading-tight">{item.title}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">{item.fase}</span>
                        <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">{item.grade}</span>
                        <span className="text-[9px] font-black text-purple-500 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">{item.type}</span>
                      </div>
                   </div>
                </div>
                {(user.role === "admin" || user.role === "guru") && (
                   <div className="flex gap-2 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      <button onClick={(e) => { e.stopPropagation(); setEditingItem(item); setShowEditModal(true); }} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:shadow-lg transition-all"><Edit size={18} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-rose-600 hover:shadow-lg transition-all"><Trash2 size={18} /></button>
                   </div>
                )}
              </div>
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest flex items-center gap-2 shadow-sm ${
                    item.status === "Aktif" ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : 'text-amber-600 bg-amber-50 border border-amber-100'
                  }`}>
                    {item.status === "Aktif" ? <CheckCircle size={14} /> : <Clock size={14} />}
                    {item.status}
                  </span>
                  
                  {item.attachments && item.attachments.length > 0 && (
                    <div className="flex -space-x-2">
                      {item.attachments.slice(0, 3).map((_, idx) => (
                        <div key={idx} className="w-6 h-6 rounded-full bg-slate-100 border border-white flex items-center justify-center shadow-sm" title={_.name}>
                          <File size={10} className="text-indigo-500" />
                        </div>
                      ))}
                      {item.attachments.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[8px] font-bold text-slate-600 shadow-sm">
                          +{item.attachments.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <button className="text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-all uppercase tracking-[0.2em] flex items-center gap-2 group/btn">
                  Buka Dokumen <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modals for CP/ATP */}
      <AnimatePresence>
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 max-w-2xl w-full rounded-[2.5rem] p-10 shadow-2xl relative flex flex-col max-h-[90vh]">
               <div className="flex justify-between items-center mb-10 relative z-10">
                 <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4">
                    <div className="p-3 brand-gradient rounded-2xl text-white shadow-lg shadow-indigo-100">
                      {showAddModal ? <Plus size={22} /> : <Edit size={22} />}
                    </div>
                    {showAddModal ? 'Tambah Dokumen' : 'Perbarui Dokumen'}
                 </h2>
                 <button onClick={() => showAddModal ? setShowAddModal(false) : setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
                    <X size={24} />
                 </button>
               </div>
               <form onSubmit={showAddModal ? handleAdd : handleEdit} className="space-y-6 overflow-y-auto pr-2 scrollbar-hide flex-1">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Judul Dokumen</label>
                    <input type="text" value={showAddModal ? formData.title : editingItem?.title} onChange={(e) => showAddModal ? setFormData({...formData, title: e.target.value}) : setEditingItem({...editingItem!, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all text-sm font-bold shadow-sm" placeholder="Nama Dokumen..." required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Detail Konten / Alur Jelas</label>
                    <textarea value={showAddModal ? formData.content : editingItem?.content} onChange={(e) => showAddModal ? setFormData({...formData, content: e.target.value}) : setEditingItem({...editingItem!, content: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all text-sm min-h-[200px] font-medium leading-relaxed shadow-sm" placeholder="Paste konten dokumen disini..." required />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Kelas</label>
                       <select value={showAddModal ? formData.grade : editingItem?.grade} onChange={(e) => showAddModal ? setFormData({...formData, grade: e.target.value}) : setEditingItem({...editingItem!, grade: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-4 outline-none text-sm font-bold">
                        <option value="Kelas X">Kelas X</option>
                        <option value="Kelas XI">Kelas XI</option>
                        <option value="Kelas XII">Kelas XII</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Tipe</label>
                       <select value={showAddModal ? formData.type : editingItem?.type} onChange={(e) => showAddModal ? setFormData({...formData, type: e.target.value}) : setEditingItem({...editingItem!, type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-4 outline-none text-sm font-bold">
                        <option value="CP">CP</option>
                        <option value="ATP">ATP</option>
                        <option value="Modul">Modul</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Status</label>
                       <select value={showAddModal ? formData.status : editingItem?.status} onChange={(e) => showAddModal ? setFormData({...formData, status: e.target.value}) : setEditingItem({...editingItem!, status: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-4 outline-none text-sm font-bold">
                        <option value="Aktif">Aktif</option>
                        <option value="Draft">Draft</option>
                      </select>
                    </div>
                  </div>

                  {/* File Upload Section */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      Lampiran & Berkas Pendukung (Opsional)
                    </label>
                    <label 
                      htmlFor={showAddModal ? "curriculum-file-upload-add" : "curriculum-file-upload-edit"} 
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-400/30 transition-all group ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {isUploading ? (
                          <Loader2 className="w-8 h-8 mb-3 text-indigo-500 animate-spin" />
                        ) : (
                          <Upload className="w-8 h-8 mb-3 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                        )}
                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600">
                          {isUploading ? 'Sedang mengunggah...' : 'Klik atau seret file'}
                        </p>
                        <p className="text-[9px] font-bold text-slate-300 uppercase">PDF, PPT, DOC, atau ZIP (Maks 10MB)</p>
                      </div>
                      <input 
                        id={showAddModal ? "curriculum-file-upload-add" : "curriculum-file-upload-edit"} 
                        type="file" 
                        multiple 
                        className="hidden" 
                        onChange={showAddModal ? handleFileUpload : handleEditFileUpload} 
                        disabled={isUploading} 
                      />
                    </label>
                    
                    {showAddModal && attachments.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 max-h-32 overflow-y-auto scrollbar-hide">
                        {attachments.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-sm group">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <File size={14} className="text-indigo-500 min-w-[14px]" />
                              <p className="text-[10px] font-bold text-slate-600 truncate">{file.name}</p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => removeAttachment(idx)}
                              className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-300 hover:text-rose-500 transition-all"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {showEditModal && editingItem?.attachments && editingItem.attachments.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 max-h-32 overflow-y-auto scrollbar-hide">
                        {editingItem.attachments.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-sm group">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <File size={14} className="text-indigo-500 min-w-[14px]" />
                              <p className="text-[10px] font-bold text-slate-600 truncate">{file.name}</p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => removeEditAttachment(idx)}
                              className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-300 hover:text-rose-500 transition-all"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-6 flex gap-4">
                    <button type="button" onClick={() => showAddModal ? setShowAddModal(false) : setShowEditModal(false)} className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all border border-slate-200 rounded-2xl">Batal</button>
                    <button type="submit" className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] brand-gradient text-white rounded-2xl shadow-xl shadow-indigo-100 hover:opacity-90 transition-all active:scale-95">Simpan Dokumen</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}

        {showDetailModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDetailModal(null)}>
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }} 
               animate={{ opacity: 1, scale: 1 }} 
               className="bg-white border border-slate-200 max-w-5xl w-full rounded-[3rem] p-12 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
               onClick={e => e.stopPropagation()}
            >
               <div className="flex justify-between items-start mb-10">
                  <div>
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] bg-indigo-50 px-4 py-2 rounded-full mb-6 block w-fit">Arsip Kurikulum Digital</span>
                    <h2 className="text-4xl font-bold text-slate-800 uppercase tracking-tight leading-tight max-w-3xl">{showDetailModal.title}</h2>
                    <div className="flex items-center gap-4 mt-6">
                       <p className="text-[10px] text-indigo-600 uppercase font-black tracking-widest bg-slate-50 px-3 py-1.5 border border-slate-100 rounded-lg shadow-sm">
                          {showDetailModal.fase} • {showDetailModal.grade} • {showDetailModal.type}
                       </p>
                       <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                       <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{showDetailModal.status}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowDetailModal(null)} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-all shadow-sm border border-slate-100">
                    <Plus size={32} className="rotate-45" />
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto pr-8 custom-scrollbar space-y-8">
                  <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-12 text-slate-700 leading-relaxed text-base whitespace-pre-wrap font-medium shadow-inner">
                     {showDetailModal.content || "Konten dokumen masih dalam tahap penyusunan oleh tim kurikulum."}
                  </div>

                  {showDetailModal.attachments && showDetailModal.attachments.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Lampiran & Dokumen Pendukung</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {showDetailModal.attachments.map((file, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => openAttachment(file)}
                            className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl hover:border-indigo-400 hover:shadow-lg transition-all group cursor-pointer"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                file.type.toLowerCase().includes('pdf') ? 'bg-rose-50 text-rose-500' :
                                file.type.toLowerCase().includes('doc') ? 'bg-blue-50 text-blue-500' :
                                file.type.toLowerCase().includes('ppt') ? 'bg-amber-50 text-amber-500' :
                                'bg-indigo-50 text-indigo-500'
                              }`}>
                                <File size={20} />
                              </div>
                              <div className="overflow-hidden">
                                <p className="text-xs font-bold text-slate-700 line-clamp-1">{file.name}</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{file.type} • {file.size}</p>
                              </div>
                            </div>
                            <ExternalLink size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
               </div>

               <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end">
                  <button onClick={() => setShowDetailModal(null)} className="text-[10px] font-black uppercase tracking-[0.2em] brand-gradient text-white px-10 py-4 rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 transition-all">Selesai Menelaah</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
