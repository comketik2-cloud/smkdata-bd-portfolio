import React, { useState, useEffect, useRef } from "react";
import { Image as ImageIcon, Plus, Trash2, Loader2, Camera, Upload, X, Calendar, User, Eye, Search, AlertCircle, Edit } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User as UserType, Documentation } from "../types";

interface DocumentationPageProps {
  user: UserType;
  branding: { name: string; logo: string | null };
}

export default function DocumentationPage({ user, branding }: DocumentationPageProps) {
  const [docs, setDocs] = useState<Documentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Documentation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    origin: "",
    description: "",
    photoUrl: ""
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Documentation | null>(null);
  const [editFormData, setEditFormData] = useState({
    origin: "",
    description: "",
    photoUrl: ""
  });
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
  const [editUploading, setEditUploading] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setEditPreviewUrl(objectUrl);

    setEditUploading(true);
    const uploadData = new FormData();
    uploadData.append("files", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data[0] && data[0].url) {
          setEditFormData(prev => ({ ...prev, photoUrl: data[0].url }));
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setEditUploading(false);
    }
  };

  const handleEditDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleEditDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Hanya file gambar yang diizinkan!");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setEditPreviewUrl(objectUrl);

    setEditUploading(true);
    const uploadData = new FormData();
    uploadData.append("files", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data[0] && data[0].url) {
          setEditFormData(prev => ({ ...prev, photoUrl: data[0].url }));
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setEditUploading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    if (!editFormData.photoUrl) {
      alert("Harap unggah foto kegiatan terlebih dahulu!");
      return;
    }
    if (!editFormData.origin.trim() || !editFormData.description.trim()) {
      alert("Harap lengkapi asal foto dan deskripsi kegiatan!");
      return;
    }

    try {
      const res = await fetch(`/api/documentations/${editingDoc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData)
      });

      if (res.ok) {
        fetchDocs();
        setShowEditModal(false);
        setEditingDoc(null);
      }
    } catch (err) {
      console.error("Submit edit error:", err);
    }
  };

  // Auto-fill sender if user is logged in
  useEffect(() => {
    if (showAddModal) {
      const getSenderLabel = () => {
        if (!user) return "";
        const roleLabel = user.role === "admin" ? "Admin IT" : user.role === "guru" ? "Guru Produktif" : "Siswa";
        return `${user.name} (${roleLabel})`;
      };
      setFormData({
        origin: getSenderLabel(),
        description: "",
        photoUrl: ""
      });
      setPreviewUrl(null);
    }
  }, [showAddModal, user]);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await fetch("/api/documentations");
      if (res.ok) {
        const data = await res.json();
        setDocs(data);
      }
    } catch (error) {
      console.error("Error fetching documentation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show client side preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload to server
    setUploading(true);
    const uploadData = new FormData();
    uploadData.append("files", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data[0] && data[0].url) {
          setFormData(prev => ({ ...prev, photoUrl: data[0].url }));
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Hanya file gambar yang diizinkan!");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append("files", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data[0] && data[0].url) {
          setFormData(prev => ({ ...prev, photoUrl: data[0].url }));
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.photoUrl) {
      alert("Harap unggah foto kegiatan terlebih dahulu!");
      return;
    }
    if (!formData.origin.trim() || !formData.description.trim()) {
      alert("Harap lengkapi asal foto dan deskripsi kegiatan!");
      return;
    }

    try {
      const res = await fetch("/api/documentations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        fetchDocs();
        setShowAddModal(false);
      }
    } catch (err) {
      console.error("Submit error:", err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Apakah Anda yakin ingin menghapus dokumentasi kegiatan ini?")) return;

    try {
      const res = await fetch(`/api/documentations/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchDocs();
        if (selectedDoc?.id === id) {
          setSelectedDoc(null);
        }
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const filteredDocs = docs.filter(doc => 
    doc.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
    doc.origin.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canUpload = user.role === "admin" || user.role === "guru" || user.role === "siswa";
  const canDelete = user.role === "admin" || user.role === "guru";
  const canEdit = user.role === "admin" || user.role === "guru";

  return (
    <div className="space-y-8">
      {/* Banner / Header */}
      <div className="brand-gradient rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-100 dark:shadow-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 blur-3xl -ml-24 -mb-24"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-white/10">
              <Camera size={14} className="text-yellow-300 animate-pulse" />
              E-Portfolio Kegiatan
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 tracking-tight uppercase">
              DOKUMENTASI JURUSAN
            </h1>
            <p className="text-blue-50 text-sm max-w-xl opacity-90 leading-relaxed font-medium">
              Galeri arsip foto dan deskripsi kegiatan praktek, kunjungan industri, ujian kompetensi, serta momen inspiratif pembelajaran produktif Bisnis Digital.
            </p>
          </div>
          
          {canUpload && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-indigo-700 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-950/20 hover:scale-105 active:scale-95 transition-all w-full md:w-auto border-b-4 border-yellow-400 self-start md:self-center"
            >
              <Plus size={18} /> Unggah Foto Kegiatan
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-md">
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 w-full max-w-md">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Cari dokumentasi kegiatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 font-semibold"
          />
        </div>
        <div className="text-xs font-black text-slate-400 uppercase tracking-widest shrink-0">
          Total: <span className="text-indigo-600 dark:text-yellow-400 font-black">{filteredDocs.length}</span> Arsip Terkoleksi
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={40} className="animate-spin text-indigo-500" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Memuat galeri dokumentasi...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-16 text-center shadow-lg max-w-md mx-auto">
          <AlertCircle size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Belum Ada Dokumentasi</h3>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed mb-6">
            Pencarian tidak ditemukan atau arsip dokumentasi masih kosong. Gunakan tombol diatas untuk mengirim foto kegiatan pertama!
          </p>
          {canUpload && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="brand-gradient text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all text-center inline-block"
            >
              Mulai Unggah
            </button>
          )}
        </div>
      ) : (
        /* Bento Grid of pictures */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDocs.map((doc, index) => (
            <motion.div
              layoutId={`doc-card-${doc.id}`}
              key={doc.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedDoc(doc)}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-md hover:shadow-xl dark:shadow-none hover:-translate-y-1 transition-all cursor-pointer flex flex-col relative"
            >
              {/* Image box with smart blurred bg so photo is fully visible & beautiful */}
              <div className="aspect-[4/3] bg-slate-950 dark:bg-slate-950 overflow-hidden relative flex items-center justify-center">
                <div 
                  className="absolute inset-0 bg-cover bg-center blur-lg opacity-30 scale-110 pointer-events-none"
                  style={{ backgroundImage: `url(${doc.photoUrl})` }}
                />
                <img
                  src={doc.photoUrl}
                  alt={doc.description}
                  className="max-w-full max-h-full object-contain relative z-10 group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                
                {/* Overlay details */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 z-20">
                  <div className="text-white w-full flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 bg-indigo-600/90 backdrop-blur-md px-2.5 py-1 rounded-full">
                      <Eye size={12} /> Detail Foto
                    </span>
                    
                    <div className="flex gap-2">
                      {canEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDoc(doc);
                            setEditFormData({
                              origin: doc.origin,
                              description: doc.description,
                              photoUrl: doc.photoUrl
                            });
                            setEditPreviewUrl(doc.photoUrl);
                            setShowEditModal(true);
                          }}
                          className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-colors hover:scale-110 shadow-lg"
                          title="Edit Momen"
                        >
                          <Edit size={14} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={(e) => handleDelete(doc.id, e)}
                          className="p-2 bg-rose-600 hover:bg-rose-500 rounded-xl text-white transition-colors hover:scale-110 shadow-lg"
                          title="Hapus Momen"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sender badge (top drawer) */}
                <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-md border border-slate-100 dark:border-slate-800 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5 z-10 select-none">
                  <User size={10} className="text-indigo-500" />
                  {doc.origin}
                </div>
              </div>

              {/* Remarks box */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-slate-800 dark:text-slate-100 font-bold text-sm tracking-wide leading-relaxed line-clamp-3">
                    {doc.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-slate-400" />
                    {new Date(doc.date).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    })}
                  </span>
                  
                  {/* Subtle actions for mobile */}
                  <span className="text-indigo-500 dark:text-yellow-400 font-black group-hover:translate-x-1.5 transition-transform duration-300">
                    Lihat &rarr;
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Showcase Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              layoutId={`doc-card-${selectedDoc.id}`}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden w-full max-w-4xl shadow-2xl flex flex-col md:flex-row relative border border-slate-200 dark:border-slate-800 max-h-[90vh] md:max-h-[80vh]"
            >
              <button
                onClick={() => setSelectedDoc(null)}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-950/60 hover:bg-slate-950/80 text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              {/* Photo component inside presentation modal */}
              <div className="flex-1 bg-slate-950 relative flex items-center justify-center min-h-[250px] md:min-h-0 overflow-hidden">
                <img
                  src={selectedDoc.photoUrl}
                  alt={selectedDoc.description}
                  className="w-full h-full object-contain md:absolute md:inset-0 max-h-[45vh] md:max-h-full"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Information compartment */}
              <div className="w-full md:w-96 p-8 flex flex-col justify-between overflow-y-auto bg-white dark:bg-slate-900 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800">
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 dark:text-yellow-400 block mb-2">
                      KETERANGAN DOKUMENTASI
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                      Momen Pembelajaran
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/55 dark:border-slate-800">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">Asal/Penerbit Foto</p>
                      <p className="font-black text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                        <User size={14} className="text-indigo-400" />
                        {selectedDoc.origin}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/55 dark:border-slate-800">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">Deskripsi Kegiatan</p>
                      <p className="font-bold text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedDoc.description}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/55 dark:border-slate-800">
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">Tanggal Publikasi</p>
                      <p className="font-bold text-slate-600 dark:text-slate-300 text-xs flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(selectedDoc.date).toLocaleDateString("id-ID", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                          year: "numeric"
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 justify-between flex-wrap">
                  <div className="flex gap-2">
                    {canEdit && (
                      <button
                        onClick={() => {
                          setEditingDoc(selectedDoc);
                          setEditFormData({
                            origin: selectedDoc.origin,
                            description: selectedDoc.description,
                            photoUrl: selectedDoc.photoUrl
                          });
                          setEditPreviewUrl(selectedDoc.photoUrl);
                          setShowEditModal(true);
                          setSelectedDoc(null);
                        }}
                        className="px-4 py-3 rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5"
                      >
                        <Edit size={13} /> Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={(e) => {
                          handleDelete(selectedDoc.id, e);
                        }}
                        className="px-4 py-3 rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 size={13} /> Hapus
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload/Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                    Unggah Momen Kegiatan
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    Pastikan foto berformat JPG, PNG, atau WEBP representatif
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
                {/* Upload drag drop panel */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    PILIH FOTO KECIL/BESAR
                  </label>
                  
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      previewUrl 
                        ? 'border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10' 
                        : 'border-slate-300 hover:border-indigo-500 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {uploading ? (
                      <div className="py-8 flex flex-col items-center justify-center gap-3">
                        <Loader2 size={32} className="animate-spin text-indigo-500" />
                        <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">
                          Mentransfer gambar ke server...
                        </span>
                      </div>
                    ) : previewUrl ? (
                      <div className="relative group max-h-[180px] overflow-hidden rounded-xl flex items-center justify-center">
                        <img 
                          src={previewUrl} 
                          alt="Pratinjau" 
                          className="max-h-[160px] object-contain rounded-lg shadow-md"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          <span className="text-white text-xs font-bold uppercase tracking-widest bg-slate-950/80 px-3 py-1.5 rounded-full flex items-center gap-1">
                            <Upload size={12} /> Ganti File
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
                          <Upload size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Klik untuk cari foto atau Drop file di sini
                        </p>
                        <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">
                          Maksimal 10MB (JPG, JPEG, PNG, WEBP, GIF)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Input Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Asal Foto / Pembuat Momen *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Siswa Kelas XI BD 1, Tim Kewirausahaan, atau nama guru"
                      value={formData.origin}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-2xl p-4 outline-none focus:border-indigo-500 text-sm font-bold shadow-inner"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       Deskripsi Kegiatan & Detail Momen *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Contoh: Praktek merancang strategi promosi menggunakan iklan berbayar (Meta Ads) untuk produk kuliner lokal dalam mata pelajaran perencanaan bisnis digital..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-2xl p-4 outline-none focus:border-indigo-500 text-sm font-bold shadow-inner resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all border border-slate-200 rounded-2xl hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !formData.photoUrl}
                    className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-white brand-gradient rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-102 active:scale-98 transition-all cursor-pointer border-b-4 border-yellow-400 text-center"
                  >
                    {uploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={14} className="animate-spin" /> MENGUNGGAH...
                      </span>
                    ) : (
                      "UNGGAH SEKARANG"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingDoc && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                    Edit Momen Kegiatan
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    Ubah rincian foto atau deskripsi dokumentasi kegiatan
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingDoc(null);
                  }}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
                {/* Upload drag drop panel */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    GANTI FOTO (OPSIONAL)
                  </label>
                  
                  <div
                    onDragOver={handleEditDragOver}
                    onDrop={handleEditDrop}
                    onClick={() => editFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      editPreviewUrl 
                        ? 'border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10' 
                        : 'border-slate-300 hover:border-indigo-500 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <input
                      type="file"
                      ref={editFileInputRef}
                      onChange={handleEditFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {editUploading ? (
                      <div className="py-8 flex flex-col items-center justify-center gap-3">
                        <Loader2 size={32} className="animate-spin text-indigo-500" />
                        <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">
                          Mentransfer gambar baru ke server...
                        </span>
                      </div>
                    ) : editPreviewUrl ? (
                      <div className="relative group max-h-[180px] overflow-hidden rounded-xl flex items-center justify-center">
                        <img 
                          src={editPreviewUrl} 
                          alt="Pratinjau" 
                          className="max-h-[160px] object-contain rounded-lg shadow-md"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          <span className="text-white text-xs font-bold uppercase tracking-widest bg-slate-950/80 px-3 py-1.5 rounded-full flex items-center gap-1">
                            <Upload size={12} /> Ganti File
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
                          <Upload size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Klik untuk cari foto atau Drop file di sini
                        </p>
                        <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">
                          Maksimal 10MB (JPG, JPEG, PNG, WEBP, GIF)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Input Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Asal Foto / Pembuat Momen *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Siswa Kelas XI BD 1, Tim Kewirausahaan, atau nama guru"
                      value={editFormData.origin}
                      onChange={(e) => setEditFormData({ ...editFormData, origin: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-2xl p-4 outline-none focus:border-indigo-500 text-sm font-bold shadow-inner"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       Deskripsi Kegiatan & Detail Momen *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Contoh: Praktek merancang strategi promosi menggunakan iklan berbayar (Meta Ads) untuk produk kuliner lokal dalam mata pelajaran perencanaan bisnis digital..."
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-2xl p-4 outline-none focus:border-indigo-500 text-sm font-bold shadow-inner resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingDoc(null);
                    }}
                    className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all border border-slate-200 rounded-2xl hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={editUploading || !editFormData.photoUrl}
                    className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-white brand-gradient rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-102 active:scale-98 transition-all cursor-pointer border-b-4 border-yellow-400 text-center"
                  >
                    {editUploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={14} className="animate-spin" /> MENYIMPAN...
                      </span>
                    ) : (
                      "SIMPAN PERUBAHAN"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
