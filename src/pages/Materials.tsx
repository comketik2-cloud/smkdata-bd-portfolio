import React, { useState, useEffect } from "react";
import { User, Material, Attachment } from "../types";
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Video, 
  FileStack, 
  MoreVertical, 
  Trash2, 
  Edit, 
  ExternalLink,
  Loader2,
  FolderOpen,
  Upload,
  File,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MaterialsProps {
  user: User;
  branding: { name: string; logo: string | null };
}

export default function Materials({ user, branding }: MaterialsProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Semua");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<Material | null>(null);
  
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // New Material State
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState("Modul Ajar");
  const [newCategory, setNewCategory] = useState("Umum");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const [isUploading, setIsUploading] = useState(false);

  const fetchMaterials = async () => {
    try {
      const response = await fetch("/api/materials");
      const data = await response.json();
      setMaterials(data);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file as Blob);
    });

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
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

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const payload = {
      title: newTitle,
      content: newContent,
      type: newType,
      category: newCategory,
      author: user.name,
      attachments: attachments,
    };

    try {
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        fetchMaterials();
        setShowAddModal(false);
        setNewTitle("");
        setNewContent("");
        setAttachments([]);
      }
    } catch (error) {
      console.error("Add Error:", error);
    }
  };

  const handleEditMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial || !editingMaterial.title.trim()) return;

    try {
      const response = await fetch(`/api/materials/${editingMaterial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           title: editingMaterial.title,
           content: editingMaterial.content,
           type: editingMaterial.type,
           category: editingMaterial.category,
           attachments: editingMaterial.attachments
        })
      });
      if (response.ok) {
        fetchMaterials();
        setShowEditModal(false);
        setEditingMaterial(null);
      }
    } catch (error) {
      console.error("Update Error:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus materi ini?")) return;
    try {
      await fetch(`/api/materials/${id}`, { method: "DELETE" });
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  const openAttachment = (file: Attachment) => {
    if (file.url) {
      window.open(file.url, "_blank");
    } else {
      // Logic fallback for existing materials without URLs (simulated)
      const mockUrl = `https://example.com/mock-file.${file.type.toLowerCase()}`;
      window.open(mockUrl, "_blank");
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) || 
                          m.category.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "Semua" || m.type === filter;
    return matchesSearch && matchesFilter;
  });

  const materialTypes = ["Semua", "Modul Ajar", "Video", "PDF", "Word", "PPT", "Quiz", "Tugas"];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-20"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">{branding.name}</h1>
          <p className="text-slate-500 text-sm font-medium">Pusat Perpustakaan Materi dan Kurikulum Digital.</p>
        </div>
        {(user.role === "admin" || user.role === "guru") && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="brand-gradient text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 active:scale-95 transition-all uppercase tracking-widest text-[10px]"
          >
            <Plus size={18} /> Tambah Materi
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari materi berdasarkan judul atau kategori..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-indigo-500/50 transition-all font-medium text-sm text-slate-600 placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          <Filter size={18} className="text-slate-400 min-w-[18px]" />
          {materialTypes.map(t => (
            <button 
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all border ${
                filter === t 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-100' 
                  : 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Materials List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {loading ? (
             <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-600 gap-4">
              <Loader2 size={40} className="animate-spin text-indigo-500" />
              <p className="font-bold text-xs uppercase tracking-widest animate-pulse">Sinkronisasi Data...</p>
            </div>
          ) : filteredMaterials.length > 0 ? (
            filteredMaterials.map((material, i) => (
              <motion.div 
                key={material.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setShowDetailModal(material)}
                className="glass-card rounded-2xl p-6 group hover:shadow-2xl transition-all relative flex flex-col h-full overflow-hidden border border-slate-200 hover:border-indigo-400/30 cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-all"></div>
                <div className="flex items-start justify-between mb-6 relative z-10">
                   <div className={`p-3 rounded-xl ${
                      material.type === "Video" ? 'bg-rose-50 text-rose-500' :
                      material.type === "PDF" ? 'bg-amber-50 text-amber-600' :
                      material.type === "Modul Ajar" ? 'bg-indigo-50 text-indigo-600' :
                      material.type === "PPT" ? 'bg-emerald-50 text-emerald-600' :
                      'bg-slate-100 text-slate-600'
                   }`}>
                      {material.type === "Video" ? <Video size={22} /> : 
                       material.type === "PDF" || material.type === "Modul Ajar" ? <FileText size={22} /> : <FileStack size={22} />}
                   </div>
                   {(user.role === "admin" || user.role === "guru") && (
                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                             e.stopPropagation();
                             setEditingMaterial(material);
                             setShowEditModal(true);
                          }}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-500 transition-colors"
                        >
                            <Edit size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(material.id); }}
                          className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                     </div>
                   )}
                </div>

                <div className="mb-6 relative z-10">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border-r-2 border-yellow-400">{material.category}</span>
                    <h3 className="text-lg font-bold mt-4 leading-tight text-slate-800 group-hover:text-blue-600 transition-colors">{material.title}</h3>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full brand-gradient p-0.5">
                           <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">{material.author.charAt(0)}</div>
                        </div>
                        <div>
                            <p className="text-xs font-bold leading-none text-slate-700">{material.author}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">{new Date(material.updatedAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                       {material.attachments && material.attachments.length > 0 && (
                        <div className="flex -space-x-2">
                           {material.attachments.slice(0, 2).map((_, idx) => (
                             <div key={idx} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                               <File size={10} className="text-slate-400" />
                             </div>
                           ))}
                           {material.attachments.length > 2 && (
                             <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-600">
                               +{material.attachments.length - 2}
                             </div>
                           )}
                        </div>
                      )}
                      <button className="text-indigo-500 p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-all border border-indigo-100">
                          <ExternalLink size={16} />
                      </button>
                    </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-700 gap-4">
              <FolderOpen size={60} strokeWidth={1} />
              <p className="font-bold text-xs uppercase tracking-widest italic opacity-50">Direktori Kosong</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-lg w-full rounded-[2.5rem] p-10 shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 brand-gradient opacity-5 blur-3xl -mr-16 -mt-16"></div>
              <div className="flex justify-between items-center mb-10 relative z-10">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-[0.2em] flex items-center gap-4">
                  <div className="p-3 brand-gradient rounded-2xl text-white shadow-lg shadow-blue-100/50"><Plus size={22} /></div>
                  Terbitkan Materi
                </h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-all">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddMaterial} className="space-y-8 relative z-10 overflow-y-auto pr-2 scrollbar-hide flex-1">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Judul Materi</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Contoh: Digital Marketing Optimization"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-300 rounded-2xl p-5 outline-none focus:border-blue-600 transition-all font-bold text-sm shadow-inner"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Isi Materi / Deskripsi</label>
                  <textarea 
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Tuliskan isi materi atau instruksi pembelajaran..."
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-300 rounded-2xl p-5 outline-none focus:border-blue-600 transition-all font-medium text-sm min-h-[120px] shadow-inner"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Jenis</label>
                    <select 
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none cursor-pointer focus:border-blue-600 font-bold text-sm shadow-inner"
                    >
                      {['Modul Ajar', 'Video', 'PDF', 'Word', 'PPT', 'Quiz', 'Tugas'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Kategori</label>
                    <select 
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none cursor-pointer focus:border-blue-600 font-bold text-sm shadow-inner"
                    >
                      {['Digital Marketing', 'E-Commerce', 'Startup', 'Bisnis Digital', 'Umum'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Lampiran & Berkas Pendukung
                  </label>
                  <label 
                    htmlFor="file-upload" 
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50 cursor-pointer hover:bg-blue-50/50 hover:border-blue-400/30 transition-all group ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploading ? (
                        <Loader2 className="w-8 h-8 mb-3 text-blue-500 animate-spin" />
                      ) : (
                        <Upload className="w-8 h-8 mb-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
                      )}
                      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600">
                        {isUploading ? 'Sedang mengunggah...' : 'Klik atau seret file'}
                      </p>
                      <p className="text-[9px] font-bold text-slate-300 uppercase">PDF, PPT, DOC, atau ZIP (Maks 10MB)</p>
                    </div>
                    <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                  </label>
                  
                  {attachments.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 max-h-32 overflow-y-auto scrollbar-hide">
                      {attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-sm group">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <File size={14} className="text-blue-500 min-w-[14px]" />
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
                </div>
                
                <div className="pt-6 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 rounded-2xl transition-all border border-slate-100"
                  >
                    Batalkan
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] brand-gradient text-white rounded-2xl shadow-xl shadow-blue-100 hover:opacity-90 transition-all"
                  >
                    Terbitkan Materi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingMaterial && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-lg w-full rounded-[2.5rem] p-10 shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 brand-gradient opacity-5 blur-3xl -mr-16 -mt-16"></div>
              <div className="flex justify-between items-center mb-10 relative z-10">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-[0.2em] flex items-center gap-4">
                  <div className="p-3 brand-gradient rounded-2xl text-white shadow-lg shadow-blue-100/50"><Edit size={22} /></div>
                  Ubah Materi
                </h2>
                <button 
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMaterial(null);
                  }} 
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleEditMaterial} className="space-y-8 relative z-10 overflow-y-auto pr-2 scrollbar-hide flex-1">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Judul Materi</label>
                  <input 
                    type="text" 
                    value={editingMaterial.title}
                    onChange={(e) => setEditingMaterial({...editingMaterial, title: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none focus:border-blue-600 transition-all font-bold text-sm shadow-inner"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Konten Materi</label>
                  <textarea 
                    value={editingMaterial.content}
                    onChange={(e) => setEditingMaterial({...editingMaterial, content: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none focus:border-blue-600 transition-all font-medium text-sm min-h-[120px] shadow-inner"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Jenis</label>
                    <select 
                      value={editingMaterial.type}
                      onChange={(e) => setEditingMaterial({...editingMaterial, type: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none focus:border-blue-600 font-bold text-sm shadow-inner"
                    >
                      {['Modul Ajar', 'Video', 'PDF', 'Word', 'PPT', 'Quiz', 'Tugas'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Kategori</label>
                    <select 
                      value={editingMaterial.category}
                      onChange={(e) => setEditingMaterial({...editingMaterial, category: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none focus:border-blue-600 font-bold text-sm shadow-inner"
                    >
                      {['Digital Marketing', 'E-Commerce', 'Startup', 'Bisnis Digital', 'Umum'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="pt-6 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => {
                        setShowEditModal(false);
                        setEditingMaterial(null);
                    }}
                    className="flex-1 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 rounded-2xl transition-all border border-slate-100"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] brand-gradient text-white rounded-2xl shadow-xl shadow-blue-100"
                  >
                    Update Data
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showDetailModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDetailModal(null)}>
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }} 
               animate={{ opacity: 1, scale: 1 }} 
               className="bg-white border border-slate-200 max-w-4xl w-full rounded-2xl p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
               onClick={e => e.stopPropagation()}
            >
               <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-5">
                     <div className={`p-4 rounded-2xl ${
                        showDetailModal.type === "Video" ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'
                     }`}>
                        {showDetailModal.type === "Video" ? <Video size={30} /> : <FileText size={30} />}
                     </div>
                     <div>
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] bg-indigo-50 px-3 py-1.5 rounded-full mb-3 block w-fit">{showDetailModal.category}</span>
                        <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight leading-tight">{showDetailModal.title}</h2>
                        <p className="text-[10px] text-slate-400 mt-2 uppercase font-black tracking-widest border-l-2 border-indigo-500 pl-3">
                           Oleh: {showDetailModal.author} • {showDetailModal.type}
                        </p>
                     </div>
                  </div>
                  <button onClick={() => setShowDetailModal(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
                    <X size={24} />
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide py-4 space-y-8">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-slate-600 leading-relaxed text-sm whitespace-pre-wrap font-medium">
                     {showDetailModal.content || "Konten materi tidak tersedia."}
                  </div>

                  {/* HTML5 Video Player inside App if Material Type is Video or contains video attachments */}
                  {(showDetailModal.type === "Video" || showDetailModal.attachments?.some(file => 
                    file.type?.toLowerCase().includes('video') || 
                    /\.(mp4|webm|mkv|mov|avi|3gp)$/i.test(file.name)
                  )) && (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Video size={14} className="text-rose-500 animate-pulse" /> Pemutar Video Pembelajaran
                      </h4>
                      <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-2 shadow-xl">
                        {showDetailModal.attachments && showDetailModal.attachments.filter(file => 
                          file.type?.toLowerCase().includes('video') || 
                          /\.(mp4|webm|mkv|mov|avi|3gp)$/i.test(file.name)
                        ).length > 0 ? (
                          showDetailModal.attachments.filter(file => 
                            file.type?.toLowerCase().includes('video') || 
                            /\.(mp4|webm|mkv|mov|avi|3gp)$/i.test(file.name)
                          ).map((file, idx) => (
                            <div key={idx} className="space-y-2">
                              <video 
                                src={file.url} 
                                controls 
                                className="w-full rounded-2xl max-h-[420px] bg-slate-950 object-contain shadow-inner"
                                playsInline
                              />
                              <p className="text-center font-mono text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase py-1 tracking-wider">{file.name}</p>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest flex flex-col items-center gap-2">
                            <Video size={28} className="text-slate-600" />
                            Belum ada file video yang diunggah ke materi ini.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {showDetailModal.attachments && showDetailModal.attachments.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Lampiran Dokumen</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {showDetailModal.attachments.map((file, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => openAttachment(file)}
                            className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all group cursor-pointer"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                file.type.toLowerCase().includes('pdf') ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' :
                                file.type.toLowerCase().includes('doc') ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' :
                                file.type.toLowerCase().includes('ppt') ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' :
                                'bg-slate-100 dark:bg-slate-700 text-slate-500'
                              }`}>
                                <File size={20} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 line-clamp-1">{file.name}</p>
                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{file.type} • {file.size}</p>
                              </div>
                            </div>
                            <ExternalLink size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
               </div>

               <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Jurusan Bisnis Digital • SMK Daruttaqwa (SMK DATA) • 2026</div>
                  <button onClick={() => setShowDetailModal(null)} className="text-[10px] font-black uppercase tracking-[0.2em] brand-gradient text-white px-8 py-3 rounded-xl shadow-lg shadow-blue-100 hover:opacity-90 transition-all">Tutup Materi</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
