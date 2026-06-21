import React, { useState, useEffect } from "react";
import { MessageSquare, Plus, Search, User as UserIcon, Trash2, Edit, Loader2, Tag, ChevronRight, Heart, Send, X, Paperclip, FileText, File, Video, Upload } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "../types";

interface ForumReply {
  id: string;
  postId: string;
  author: string;
  content: string;
  time: string;
}

interface ForumAttachment {
  name: string;
  type: string;
  url: string;
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  repliesCount: number;
  likes: number;
  time: string;
  category: string;
  attachments?: ForumAttachment[];
}

export default function Forum({ user }: { user: User }) {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailPost, setShowDetailPost] = useState<ForumPost | null>(null);
  const [postReplies, setPostReplies] = useState<ForumReply[]>([]);
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");
  const [forumAttachments, setForumAttachments] = useState<ForumAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "Digital Marketing"
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/forum");
      const data = await res.json();
      setPosts(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchReplies = async (postId: string) => {
    try {
      const res = await fetch(`/api/forum/${postId}/replies`);
      const data = await res.json();
      setPostReplies(data);
    } catch (e) { console.error(e); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formUpload = new FormData();
    Array.from(files).forEach((file) => {
      formUpload.append("files", file as Blob);
    });

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formUpload,
      });
      if (response.ok) {
        const uploadedFiles = await response.json();
        setForumAttachments(prev => [...prev, ...uploadedFiles]);
      }
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Gagal mengunggah file. Silakan coba lagi.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setForumAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, author: user.name, attachments: forumAttachments })
      });
      if (res.ok) {
        fetchPosts();
        setShowAddModal(false);
        setFormData({ title: "", content: "", category: "Digital Marketing" });
        setForumAttachments([]);
      }
    } catch (e) { console.error(e); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    try {
      const res = await fetch(`/api/forum/${editingPost.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPost)
      });
      if (res.ok) {
        fetchPosts();
        setShowEditModal(false);
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus diskusi ini?")) return;
    try {
      await fetch(`/api/forum/${id}`, { method: "DELETE" });
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (e) { console.error(e); }
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await fetch(`/api/forum/${postId}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: data.likes } : p));
        if (showDetailPost?.id === postId) setShowDetailPost(prev => prev ? { ...prev, likes: data.likes } : null);
      }
    } catch (e) { console.error(e); }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDetailPost || !replyText.trim()) return;
    try {
      const res = await fetch(`/api/forum/${showDetailPost.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: user.name, content: replyText })
      });
      if (res.ok) {
        const newReply = await res.json();
        setPostReplies(prev => [...prev, newReply]);
        setReplyText("");
        setPosts(prev => prev.map(p => p.id === showDetailPost.id ? { ...p, repliesCount: p.repliesCount + 1 } : p));
      }
    } catch (e) { console.error(e); }
  };

  const openDetail = (post: ForumPost) => {
    setShowDetailPost(post);
    fetchReplies(post.id);
  };

  const filtered = posts.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-20">
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 uppercase tracking-tight">Forum Komunitas</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Ruang kolaborasi dan tanya jawab Akademik Bisnis Digital.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="brand-gradient text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={18} /> Topik Baru
          </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm">
        <div className="relative">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari topik diskusi atau kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-4 text-slate-700 outline-none focus:border-indigo-500/50 transition-all font-bold text-sm placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-32 flex flex-col items-center gap-6 shadow-sm">
                   <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Menghubungkan ke Forum...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-32 flex flex-col items-center gap-6 opacity-30 shadow-sm">
                   <MessageSquare size={64} className="text-slate-300" />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Belum ada diskusi terbuka</p>
                </div>
              ) : filtered.map((post) => (
                <motion.div 
                  key={post.id} 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => openDetail(post)}
                  className="bg-white border border-slate-100 rounded-[2rem] p-8 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 group relative overflow-hidden cursor-pointer"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 brand-gradient opacity-0 group-hover:opacity-5 blur-3xl -mr-16 -mt-16 transition-all duration-700"></div>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div>
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 block bg-indigo-50 w-fit px-3 py-1 rounded-lg border border-indigo-100">{post.category}</span>
                          <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight leading-tight">{post.title}</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] bg-slate-50 border border-slate-100 text-slate-500 px-3 py-1.5 rounded-xl font-black uppercase tracking-widest shadow-sm">{post.repliesCount} Balasan</span>
                          {(user.role === "admin" || user.name === post.author) && (
                             <div className="flex gap-2">
                               <button onClick={(e) => { e.stopPropagation(); setEditingPost(post); setShowEditModal(true); }} className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:shadow-lg transition-all"><Edit size={16} /></button>
                               <button onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }} className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 hover:shadow-lg transition-all"><Trash2 size={16} /></button>
                             </div>
                          )}
                        </div>
                    </div>
                    <div className="flex items-center justify-between relative z-10 pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-indigo-600 shadow-inner group-hover:brand-gradient group-hover:text-white transition-all">
                              <UserIcon size={18} />
                          </div>
                          <div>
                              <p className="text-sm font-bold text-slate-700">{post.author}</p>
                              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{new Date(post.time).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}
                             className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-all"
                           >
                             <Tag size={16} className={post.likes > 0 ? "fill-rose-500 text-rose-500" : ""} /> {post.likes} Like
                           </button>
                           <button className="text-indigo-600 p-2 bg-indigo-50 rounded-xl hover:brand-gradient hover:text-white transition-all shadow-sm">
                             <ChevronRight size={20} />
                           </button>
                        </div>
                    </div>
                </motion.div>
              ))}
            </AnimatePresence>
        </div>

        <div className="space-y-8">
            <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
                <h4 className="font-black text-slate-400 mb-6 uppercase tracking-[0.2em] text-[10px]">Eksplor Kategori</h4>
                <div className="space-y-3">
                    {["Digital Marketing", "Marketplace", "Copywriting", "Branding", "E-Commerce", "Startup"].map(tag => (
                        <button key={tag} onClick={() => setSearch(tag)} className="w-full text-left p-4 rounded-2xl hover:bg-indigo-50 text-slate-600 text-sm font-bold transition-all flex justify-between items-center group border border-transparent hover:border-indigo-100">
                            {tag}
                            <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                              <ChevronRight size={14} className="text-indigo-600" />
                            </div>
                        </button>
                    ))}
                    <button onClick={() => setSearch("")} className="w-full text-center p-4 rounded-2xl bg-slate-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mt-4 border border-dashed border-slate-200 transition-all hover:bg-indigo-50">Reset Semua Filter</button>
                </div>
            </div>

            <div className="brand-gradient rounded-[2rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-indigo-200">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rotate-45 -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
                <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mb-6 relative z-10 backdrop-blur-sm">
                  <MessageSquare size={32} />
                </div>
                <h4 className="text-xl font-bold mb-3 relative z-10 leading-tight">Butuh Bimbingan Intensif?</h4>
                <p className="text-sm opacity-80 mb-8 leading-relaxed relative z-10">Ajukan pertanyaan spesifik kepada mentor industri atau bapak/ibu guru untuk mendapatkan solusi terbaik.</p>
                <a 
                  href="https://wa.me/6288989971063?text=Halo%20Admin%20Bisnis%20Digital%20SMK%20Darut%20Taqwa%20Purwosari.%20Saya%20butuh%20bantuan%20mengenai%20layanan%20akademik%20/%20sistem." 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full block text-center bg-white text-indigo-600 font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl relative z-10"
                >
                  Buka Pusat Bantuan
                </a>
            </div>
        </div>
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
                    {showAddModal ? 'Topik Baru' : 'Perbarui Topik'}
                 </h2>
                 <button onClick={() => showAddModal ? setShowAddModal(false) : setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
                    <X size={20} />
                 </button>
               </div>
               <form onSubmit={showAddModal ? handleAdd : handleEdit} className="space-y-8 overflow-y-auto pr-2 scrollbar-hide flex-1">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Judul Diskusi Utama</label>
                    <input value={showAddModal ? formData.title : editingPost?.title} onChange={(e) => showAddModal ? setFormData({...formData, title: e.target.value}) : setEditingPost({...editingPost!, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all text-sm font-bold shadow-sm" placeholder="Topik apa yang ingin dibahas?" required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Penjelasan / Deskripsi</label>
                    <textarea value={showAddModal ? formData.content : editingPost?.content} onChange={(e) => showAddModal ? setFormData({...formData, content: e.target.value}) : setEditingPost({...editingPost!, content: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all text-sm min-h-[120px] font-medium leading-relaxed shadow-sm" required placeholder="Jelaskan secara mendalam tentang pertanyaan anda..." />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Pilih Kategori</label>
                    <select value={showAddModal ? formData.category : editingPost?.category} onChange={(e) => showAddModal ? setFormData({...formData, category: e.target.value}) : setEditingPost({...editingPost!, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-5 outline-none text-sm font-bold shadow-sm cursor-pointer">
                      {["Digital Marketing", "Marketplace", "Copywriting", "Branding", "E-Commerce", "Startup"].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  {showAddModal && (
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 font-semibold">
                        Lampirkan Berkas Diskusi (Word, PDF, PPT)
                      </label>
                      <label 
                        htmlFor="forum-file-upload" 
                        className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50 cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-400/30 transition-all group ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <div className="flex flex-col items-center justify-center pt-4 pb-4">
                          {isUploading ? (
                            <Loader2 className="w-6 h-6 mb-2 text-indigo-500 animate-spin" />
                          ) : (
                            <Upload className="w-6 h-6 mb-2 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                          )}
                          <p className="mb-0.5 text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600">
                            {isUploading ? 'Sedang mengunggah...' : 'Klik atau seret file diskusi'}
                          </p>
                          <p className="text-[8px] font-bold text-slate-300 uppercase">PDF, PPT, DOC, DOCX, XLS (Maks 10MB)</p>
                        </div>
                        <input id="forum-file-upload" type="file" multiple className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                      </label>
                      
                      {forumAttachments.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 max-h-32 overflow-y-auto scrollbar-hide">
                          {forumAttachments.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-sm group">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <FileText size={14} className="text-indigo-500 min-w-[14px]" />
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
                  )}
                  <div className="pt-6 flex gap-4">
                    <button type="button" onClick={() => showAddModal ? setShowAddModal(false) : setShowEditModal(false)} className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all border border-slate-200 rounded-2xl">Batal</button>
                    <button type="submit" className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] brand-gradient text-white rounded-2xl shadow-xl shadow-indigo-100 hover:opacity-90 transition-all active:scale-95">Tayangkan Sekarang</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}

        {showDetailPost && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowDetailPost(null)}>
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }} 
               animate={{ opacity: 1, scale: 1 }} 
               className="bg-white border border-slate-200 max-w-4xl w-full rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
               onClick={e => e.stopPropagation()}
             >
                <div className="p-10 border-b border-slate-100 flex justify-between items-start">
                   <div className="flex gap-6 items-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-indigo-600 shadow-inner">
                          <UserIcon size={32} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg mb-2 block w-fit border border-indigo-100">{showDetailPost.category}</span>
                        <h2 className="text-3xl font-bold text-slate-800 uppercase tracking-tight leading-tight max-w-2xl">{showDetailPost.title}</h2>
                        <div className="flex items-center gap-4 mt-2">
                           <p className="text-sm font-bold text-slate-500">Oleh <span className="text-indigo-600">{showDetailPost.author}</span></p>
                           <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                           <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{new Date(showDetailPost.time).toLocaleString()}</p>
                        </div>
                      </div>
                   </div>
                   <button onClick={() => setShowDetailPost(null)} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-transform hover:scale-110 active:scale-95">
                      <Plus size={24} className="rotate-45" />
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                   <div className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap bg-slate-50 p-10 rounded-[2rem] border border-slate-100 shadow-inner font-medium">
                      {showDetailPost.content}
                   </div>

                   {showDetailPost.attachments && showDetailPost.attachments.length > 0 && (
                     <div className="space-y-4">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                          <Paperclip size={14} className="text-indigo-500 animate-bounce" /> Lampiran Berkas Diskusi
                       </h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         {showDetailPost.attachments.map((file, idx) => (
                           <div 
                             key={idx} 
                             onClick={() => file.url && window.open(file.url, "_blank")}
                             className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-50/50 cursor-pointer transition-all duration-300 group"
                           >
                             <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white text-indigo-500 border border-slate-100 group-hover:brand-gradient group-hover:text-white transition-all shadow-sm">
                               <FileText size={20} />
                             </div>
                             <div className="flex-1 overflow-hidden">
                               <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors truncate">{file.name}</p>
                               <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest font-mono">Download File</span>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   <div className="flex items-center gap-8 pl-4">
                      <button 
                        onClick={() => handleLike(showDetailPost.id)}
                        className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-all group"
                      >
                        <Tag size={18} className={showDetailPost.likes > 0 ? "fill-rose-500 text-rose-500" : "group-hover:scale-125 transition-transform"} /> {showDetailPost.likes} Likes Aktif
                      </button>
                      <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <MessageSquare size={18} className="text-indigo-500" /> {showDetailPost.repliesCount} Balasan Masuk
                      </button>
                   </div>

                   <div className="space-y-6 pt-6 border-t border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] pl-4">Partisipasi Komunitas</h4>
                      {postReplies.length === 0 ? (
                        <div className="p-16 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center gap-4">
                           <MessageSquare size={32} className="text-slate-200" />
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Belum ada diskusi teknis</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {postReplies.map(reply => (
                            <div key={reply.id} className="p-8 bg-white border border-slate-100 rounded-[2rem] space-y-4 hover:shadow-xl hover:shadow-indigo-50/50 transition-all duration-500">
                               <div className="flex justify-between items-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                                  <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">{reply.author}</p>
                                  <p className="text-[9px] text-slate-400 font-black uppercase">{new Date(reply.time).toLocaleTimeString()}</p>
                               </div>
                               <p className="text-sm text-slate-700 leading-relaxed font-medium pl-2">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                   </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100">
                   <form onSubmit={handleReply} className="flex gap-4">
                      <div className="relative flex-1">
                        <MessageSquare size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Ketik kontribusi diskusi anda..."
                          className="w-full bg-white border border-slate-200 text-slate-800 rounded-2xl pl-16 pr-6 py-5 text-sm font-bold outline-none focus:border-indigo-500/50 transition-all shadow-sm"
                        />
                      </div>
                      <button type="submit" className="brand-gradient text-white px-10 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:opacity-90 active:scale-95 transition-all">Balas Sekarang</button>
                   </form>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
