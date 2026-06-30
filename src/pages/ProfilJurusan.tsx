import React, { useState, useEffect } from "react";
import { User, ProfileJurusan, Facility, ProfileDocument } from "../types";
import { 
  Building2, 
  FileText, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  Upload, 
  Download, 
  Loader2, 
  School, 
  Compass,
  FileDown,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProfilJurusanProps {
  user: User;
}

export default function ProfilJurusanPage({ user }: ProfilJurusanProps) {
  const [activeTab, setActiveTab] = useState<"about" | "facilities" | "documents">("about");
  const [profile, setProfile] = useState<ProfileJurusan | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals / Edit states
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [aboutForm, setAboutForm] = useState({ about: "", vision: "", missionText: "" });

  const [showAddFacility, setShowAddFacility] = useState(false);
  const [facilityForm, setFacilityForm] = useState({ name: "", description: "", imageUrl: "", uploading: false });
  const [editingFacility, setEditingFacility] = useState<any | null>(null);
  const [showEditFacility, setShowEditFacility] = useState(false);

  const [showAddDoc, setShowAddDoc] = useState(false);
  const [docForm, setDocForm] = useState({ title: "", description: "", fileUrl: "", fileName: "", externalLink: "", uploading: false });
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [showEditDoc, setShowEditDoc] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile-jurusan");
      const data = await res.json();
      setProfile(data);
      if (data) {
        setAboutForm({
          about: data.about || "",
          vision: data.vision || "",
          missionText: data.mission ? data.mission.join("\n") : ""
        });
      }
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateAbout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    const updated = {
      ...profile,
      about: aboutForm.about,
      vision: aboutForm.vision,
      mission: aboutForm.missionText.split("\n").filter(line => line.trim() !== "")
    };

    try {
      const res = await fetch("/api/profile-jurusan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setAboutForm({
          about: data.about || "",
          vision: data.vision || "",
          missionText: data.mission ? data.mission.join("\n") : ""
        });
        setIsEditingAbout(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFacilityImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setFacilityForm(prev => ({ ...prev, uploading: true }));
    const formData = new FormData();
    formData.append("files", e.target.files[0]);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data && data.length > 0) {
        setFacilityForm(prev => ({ ...prev, imageUrl: data[0].url }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFacilityForm(prev => ({ ...prev, uploading: false }));
    }
  };

  const handleAddFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    const newFacility: Facility = {
      id: Math.random().toString(36).substr(2, 9),
      name: facilityForm.name,
      description: facilityForm.description,
      imageUrl: facilityForm.imageUrl || "https://images.unsplash.com/photo-1461151304267-38535e780c79?q=80&w=600&auto=format&fit=crop"
    };

    const updated = {
      ...profile,
      facilities: [...(profile.facilities || []), newFacility]
    };

    try {
      const res = await fetch("/api/profile-jurusan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setShowAddFacility(false);
        setFacilityForm({ name: "", description: "", imageUrl: "", uploading: false });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFacility = async (id: string) => {
    if (!profile || !confirm("Hapus fasilitas ini?")) return;
    setLoading(true);

    const updated = {
      ...profile,
      facilities: profile.facilities.filter(f => f.id !== id)
    };

    try {
      const res = await fetch("/api/profile-jurusan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadEditFacilityImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setEditingFacility((prev: any) => prev ? { ...prev, uploading: true } : null);
    const formData = new FormData();
    formData.append("files", e.target.files[0]);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data && data.length > 0) {
        setEditingFacility((prev: any) => prev ? { ...prev, imageUrl: data[0].url } : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditingFacility((prev: any) => prev ? { ...prev, uploading: false } : null);
    }
  };

  const handleEditFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !editingFacility) return;
    setLoading(true);

    const updatedFacilities = profile.facilities.map(f => f.id === editingFacility.id ? editingFacility : f);
    const updated = {
      ...profile,
      facilities: updatedFacilities
    };

    try {
      const res = await fetch("/api/profile-jurusan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setShowEditFacility(false);
        setEditingFacility(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setDocForm(prev => ({ ...prev, uploading: true }));
    const formData = new FormData();
    formData.append("files", e.target.files[0]);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data && data.length > 0) {
        setDocForm(prev => ({ 
          ...prev, 
          fileUrl: data[0].url,
          fileName: data[0].name
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDocForm(prev => ({ ...prev, uploading: false }));
    }
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    const newDoc: ProfileDocument = {
      id: Math.random().toString(36).substr(2, 9),
      title: docForm.title,
      description: docForm.description,
      fileUrl: docForm.fileUrl,
      fileName: docForm.fileName,
      externalLink: docForm.externalLink
    };

    const updated = {
      ...profile,
      documents: [...(profile.documents || []), newDoc]
    };

    try {
      const res = await fetch("/api/profile-jurusan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setShowAddDoc(false);
        setDocForm({ title: "", description: "", fileUrl: "", fileName: "", externalLink: "", uploading: false });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!profile || !confirm("Hapus dokumen unduhan ini?")) return;
    setLoading(true);

    const updated = {
      ...profile,
      documents: profile.documents.filter(d => d.id !== id)
    };

    try {
      const res = await fetch("/api/profile-jurusan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadEditDocFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setEditingDoc((prev: any) => prev ? { ...prev, uploading: true } : null);
    const formData = new FormData();
    formData.append("files", e.target.files[0]);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data && data.length > 0) {
        setEditingDoc((prev: any) => prev ? { 
          ...prev, 
          fileUrl: data[0].url,
          fileName: data[0].name
        } : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditingDoc((prev: any) => prev ? { ...prev, uploading: false } : null);
    }
  };

  const handleEditDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !editingDoc) return;
    setLoading(true);

    const updatedDocs = profile.documents.map(d => d.id === editingDoc.id ? editingDoc : d);
    const updated = {
      ...profile,
      documents: updatedDocs
    };

    try {
      const res = await fetch("/api/profile-jurusan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setShowEditDoc(false);
        setEditingDoc(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="animate-spin text-indigo-500" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Memuat Profil Jurusan...</p>
      </div>
    );
  }

  const isAdminOrGuru = user.role === "admin" || user.role === "guru";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8 pb-12"
    >
      {/* Header Banner */}
      <div className="brand-gradient rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-400/20 blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-black bg-yellow-400 text-slate-900 px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-3">Konsentrasi Keahlian</span>
            <h1 className="text-3xl md:text-5xl font-display font-light uppercase tracking-tight leading-none">
              PROFIL <b className="font-black">BISNIS DIGITAL</b>
            </h1>
            <p className="text-blue-50 text-sm mt-3 max-w-2xl font-medium leading-relaxed">
              Mengenal lebih dekat visi misi, laboratorium modern pendukung pembelajaran praktik, serta pusat administrasi dokumen kurikulum dan brosur interaktif kami.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex items-center gap-3">
            <School size={40} className="text-yellow-300" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-200">Sekolah</p>
              <p className="text-sm font-black leading-tight uppercase">SMK Darut Taqwa</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex max-w-lg shadow-sm border border-slate-200/50">
        {[
          { id: "about", label: "Visi, Misi & Tentang BD", icon: Sparkles },
          { id: "facilities", label: "Fasilitas & Lab", icon: Building2 },
          { id: "documents", label: "Dokumen & Brosur", icon: FileText }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-wider ${
              activeTab === tab.id 
                ? "bg-white text-indigo-600 shadow-sm border border-slate-200/40" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="grid grid-cols-1 gap-8">
        {/* TAB 1: ABOUT, VISION, MISSION */}
        {activeTab === "about" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* About text panel */}
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-150/50 relative">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Wawasan Program</span>
                    <h2 className="text-2xl font-bold text-slate-800 uppercase tracking-tight">Mengenai Program Keahlian</h2>
                  </div>
                  {isAdminOrGuru && !isEditingAbout && (
                    <button 
                      onClick={() => {
                        if (profile) {
                          setAboutForm({
                            about: profile.about || "",
                            vision: profile.vision || "",
                            missionText: profile.mission ? profile.mission.join("\n") : ""
                          });
                        }
                        setIsEditingAbout(true);
                      }} 
                      className="flex items-center gap-2 text-indigo-600 hover:bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                    >
                      <Edit size={14} /> Edit Teks Profil
                    </button>
                  )}
                </div>

                {isEditingAbout ? (
                  <form onSubmit={handleUpdateAbout} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Deskripsi Profile Jurusan</label>
                      <textarea 
                        value={aboutForm.about}
                        onChange={(e) => setAboutForm({ ...aboutForm, about: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all font-medium leading-relaxed text-sm"
                        rows={6}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Visi Jurusan</label>
                      <input 
                        value={aboutForm.vision}
                        onChange={(e) => setAboutForm({ ...aboutForm, vision: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all font-bold text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Misi Jurusan (Tulis 1 Misi per baris)</label>
                      <textarea 
                        value={aboutForm.missionText}
                        onChange={(e) => setAboutForm({ ...aboutForm, missionText: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl p-5 outline-none focus:border-indigo-500/50 transition-all font-medium leading-relaxed text-sm"
                        placeholder="Masukkan misi jurusan, pisahkan tiap poin dengan menekan enter (Kunci Baru)..."
                        rows={5}
                        required
                      />
                    </div>
                    <div className="flex gap-4 pt-2">
                      <button 
                        type="button" 
                        onClick={() => setIsEditingAbout(false)}
                        className="flex-1 py-4 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all"
                      >
                        Batal
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-4 brand-gradient text-white rounded-2xl shadow-xl shadow-indigo-100 hover:opacity-95 font-black text-[10px] uppercase tracking-wider transition-all"
                      >
                        Simpan Perubahan
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-slate-600 text-sm leading-relaxed font-medium whitespace-pre-line">
                    {profile?.about || "Deskripsi jurusan belum ditulis."}
                  </p>
                )}
              </div>
            </div>

            {/* Vision and Mission Cards right panel */}
            <div className="space-y-8">
              <div className="bg-indigo-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden border border-indigo-950">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 blur-xl"></div>
                <div className="flex items-center gap-3.5 mb-6">
                  <div className="bg-white/10 p-2.5 rounded-xl text-yellow-300">
                    <Compass size={20} />
                  </div>
                  <h3 className="font-bold text-base uppercase tracking-wider">Visi Program Keahlian</h3>
                </div>
                <p className="italic font-medium leading-relaxed text-sm text-indigo-50">
                  "{profile?.vision || "Berdikari dan berakhlak mulia di era global"}"
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-100/50">
                <h3 className="font-bold text-slate-800 uppercase tracking-tight mb-6">Misi Operasional</h3>
                <div className="space-y-4">
                  {profile?.mission && profile.mission.map((item, id) => (
                    <div key={id} className="flex gap-3 items-start group">
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <p className="text-slate-600 text-xs font-semibold leading-relaxed">{item}</p>
                    </div>
                  ))}
                  {(!profile?.mission || profile.mission.length === 0) && (
                    <p className="text-slate-400 text-xs">Misi belum ditentukan.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FACILITIES */}
        {activeTab === "facilities" && (
          <div className="space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50">
              <div>
                <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Sarana & Prasarana Praktik</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Laboratorium modern berstandar industri produktif</p>
              </div>
              {isAdminOrGuru && (
                <button 
                  onClick={() => setShowAddFacility(true)}
                  className="brand-gradient text-white flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest"
                >
                  <Plus size={16} /> Tambah Fasilitas
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {profile?.facilities && profile.facilities.map((fac) => (
                <motion.div 
                  key={fac.id}
                  layout
                  className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xl shadow-slate-100/50 group relative overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {fac.imageUrl && (
                      <div className="w-full h-48 rounded-2xl overflow-hidden mb-5 border border-slate-150/50 relative">
                        <img 
                          src={fac.imageUrl} 
                          alt={fac.name} 
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-all duration-500" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight mb-2 leading-tight group-hover:text-indigo-600 transition-colors">{fac.name}</h3>
                    <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-6">{fac.description}</p>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-50 pt-4">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fasilitas Bisnis Digital</span>
                    {isAdminOrGuru && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setEditingFacility(fac);
                            setShowEditFacility(true);
                          }}
                          className="p-2 border border-blue-100 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                          title="Ubah"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteFacility(fac.id)}
                          className="p-2 border border-rose-100 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {(!profile?.facilities || profile.facilities.length === 0) && (
                <div className="col-span-1 md:col-span-2 text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm">Belum ada sarana prasarana yang didaftarkan.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: DOWNLOADS / DOCUMENTS */}
        {activeTab === "documents" && (
          <div className="space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50">
              <div>
                <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Katalog Unduhan Dokumen</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Dapatkan brosur promosi, struktur kurikulum, dan berkas administrasi cetak jurusan</p>
              </div>
              {isAdminOrGuru && (
                <button 
                  onClick={() => setShowAddDoc(true)}
                  className="brand-gradient text-white flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest"
                >
                  <Plus size={16} /> Upload Dokumen Baru
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {profile?.documents && profile.documents.map((doc) => (
                <motion.div 
                  key={doc.id}
                  layout
                  className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-100/30 hover:border-slate-300 transition-all flex items-start gap-5 relative group"
                >
                  <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0 group-hover:scale-105 transition-transform">
                    <FileDown size={28} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="font-bold text-slate-800 text-sm uppercase tracking-tight group-hover:text-indigo-600 transition-colors leading-snug">{doc.title}</h3>
                      {isAdminOrGuru && (
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => {
                              setEditingDoc(doc);
                              setShowEditDoc(true);
                            }} 
                            className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Ubah"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteDoc(doc.id)} 
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-1.5">{doc.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
                      <span className="text-[9px] text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-md">{doc.fileName || "Berkas"}</span>
                      <div className="flex gap-2">
                        {doc.fileUrl && (
                          <a 
                            href={doc.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            <Download size={12} /> Unduh Berkas
                          </a>
                        )}
                        {doc.externalLink && (
                          <a 
                            href={doc.externalLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            <ExternalLink size={12} /> Buka Link
                          </a>
                        )}
                        {!doc.fileUrl && !doc.externalLink && (
                          <span className="text-[10px] text-slate-300 font-black uppercase">Tautan Kosong</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {(!profile?.documents || profile.documents.length === 0) && (
                <div className="col-span-1 lg:col-span-2 text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm">Belum ada dokumen yang tersedia untuk diunduh.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Facilities Modal */}
      <AnimatePresence>
        {showAddFacility && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 max-w-lg w-full rounded-3xl p-8 shadow-2xl relative overflow-hidden">
               <h2 className="text-xl font-bold text-slate-800 mb-8 uppercase tracking-[0.2em] flex items-center gap-4">
                  <div className="p-2.5 bg-indigo-500 text-white rounded-xl">
                    <Building2 size={20} />
                  </div>
                  Tambah Sarana Belajar
               </h2>
               <form onSubmit={handleAddFacility} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nama Fasilitas / Lab</label>
                    <input 
                      value={facilityForm.name} 
                      onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })} 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all font-bold text-sm shadow-sm" 
                      placeholder="Contoh: Digital Broadcasting Room..." 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Deskripsi Fasilitas</label>
                    <textarea 
                      value={facilityForm.description} 
                      onChange={(e) => setFacilityForm({ ...facilityForm, description: e.target.value })} 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all font-medium text-sm leading-relaxed shadow-sm" 
                      placeholder="Tulis kegunaan alat, jumlah komputer, kegiatannya, dsb..." 
                      rows={3} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Foto Fasilitas (Unggah File atau URL Gambar)</label>
                    <div className="flex gap-4">
                       <input 
                         value={facilityForm.imageUrl} 
                         onChange={(e) => setFacilityForm({ ...facilityForm, imageUrl: e.target.value })} 
                         className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all text-xs font-semibold" 
                         placeholder="Tautan URL gambar..." 
                       />
                       <label className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-5 py-4 rounded-2xl cursor-pointer transition-all border border-indigo-200 flex items-center justify-center gap-2">
                          {facilityForm.uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                          <span className="text-[9px] font-black uppercase tracking-widest">Unggah</span>
                          <input type="file" accept="image/*" onChange={handleUploadFacilityImage} className="hidden" />
                       </label>
                    </div>
                  </div>
                  <div className="pt-4 flex gap-4">
                    <button type="button" onClick={() => setShowAddFacility(false)} className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 border border-slate-200 rounded-2xl">Batal</button>
                    <button type="submit" disabled={facilityForm.uploading} className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] brand-gradient text-white rounded-2xl shadow-xl shadow-indigo-100 disabled:opacity-50">Publish Fasilitas</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}

        {showAddDoc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 max-w-lg w-full rounded-3xl p-8 shadow-2xl relative overflow-hidden">
               <h2 className="text-xl font-bold text-slate-800 mb-8 uppercase tracking-[0.2em] flex items-center gap-4">
                  <div className="p-2.5 bg-indigo-500 text-white rounded-xl">
                    <FileText size={20} />
                  </div>
                  Upload Unduhan Baru
               </h2>
               <form onSubmit={handleAddDoc} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Judul Dokumen / Brosur</label>
                    <input 
                      value={docForm.title} 
                      onChange={(e) => setDocForm({ ...docForm, title: e.target.value })} 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all font-bold text-sm shadow-sm" 
                      placeholder="Contoh: Brosur Jurusan 2026/2027 PDF..." 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Spesifikasi Singkat</label>
                    <textarea 
                      value={docForm.description} 
                      onChange={(e) => setDocForm({ ...docForm, description: e.target.value })} 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all font-medium text-sm leading-relaxed shadow-sm" 
                      placeholder="Isi singkat dokumen atau instruksi cetak..." 
                      rows={2} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Link Eksternal Pendukung (Opsional)</label>
                    <input 
                      type="url" 
                      value={docForm.externalLink || ""} 
                      onChange={(e) => setDocForm({ ...docForm, externalLink: e.target.value })} 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all font-bold text-sm shadow-sm" 
                      placeholder="Contoh: https://drive.google.com/..." 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Pilih File untuk Di-upload (PDF, Docx dsb)</label>
                    <div className="flex gap-4">
                       <input 
                         value={docForm.fileUrl} 
                         onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })} 
                         className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all text-xs font-semibold" 
                         placeholder="URL dokumen atau ketik manual (Opsional)..." 
                       />
                       <label className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-5 py-4 rounded-2xl cursor-pointer transition-all border border-indigo-200 flex items-center justify-center gap-2">
                          {docForm.uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                          <span className="text-[9px] font-black uppercase tracking-widest">Unggah</span>
                          <input type="file" onChange={handleUploadDocFile} className="hidden" />
                       </label>
                    </div>
                    {docForm.fileName && (
                      <p className="text-[10px] font-bold text-emerald-600 pl-1 mt-1 flex items-center gap-1">
                        <CheckCircle2 size={12} /> File Terupload: {docForm.fileName}
                      </p>
                    )}
                  </div>
                  <div className="pt-4 flex gap-4">
                    <button type="button" onClick={() => setShowAddDoc(false)} className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 border border-slate-200 rounded-2xl">Batal</button>
                    <button type="submit" disabled={docForm.uploading} className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] brand-gradient text-white rounded-2xl shadow-xl shadow-indigo-100 disabled:opacity-50">Publikasi Unduhan</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}

        {showEditFacility && editingFacility && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 max-w-lg w-full rounded-3xl p-8 shadow-2xl relative overflow-hidden">
               <h2 className="text-xl font-bold text-slate-800 mb-8 uppercase tracking-[0.2em] flex items-center gap-4">
                  <div className="p-2.5 bg-indigo-500 text-white rounded-xl">
                    <Edit size={20} />
                  </div>
                  Ubah Sarana Belajar
               </h2>
               <form onSubmit={handleEditFacility} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nama Fasilitas / Lab</label>
                    <input 
                      value={editingFacility.name} 
                      onChange={(e) => setEditingFacility({ ...editingFacility, name: e.target.value })} 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all font-bold text-sm shadow-sm" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Deskripsi Fasilitas</label>
                    <textarea 
                      value={editingFacility.description} 
                      onChange={(e) => setEditingFacility({ ...editingFacility, description: e.target.value })} 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all font-medium text-sm leading-relaxed shadow-sm" 
                      rows={3} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Foto Fasilitas (Unggah File atau URL Gambar)</label>
                    <div className="flex gap-4">
                       <input 
                         value={editingFacility.imageUrl} 
                         onChange={(e) => setEditingFacility({ ...editingFacility, imageUrl: e.target.value })} 
                         className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all text-xs font-semibold" 
                       />
                       <label className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-5 py-4 rounded-2xl cursor-pointer transition-all border border-indigo-200 flex items-center justify-center gap-2">
                          {editingFacility.uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                          <span className="text-[9px] font-black uppercase tracking-widest">Unggah</span>
                          <input type="file" accept="image/*" onChange={handleUploadEditFacilityImage} className="hidden" />
                       </label>
                    </div>
                  </div>
                  <div className="pt-4 flex gap-4">
                    <button type="button" onClick={() => { setShowEditFacility(false); setEditingFacility(null); }} className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 border border-slate-200 rounded-2xl">Batal</button>
                    <button type="submit" disabled={editingFacility.uploading} className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] brand-gradient text-white rounded-2xl shadow-xl shadow-indigo-100 disabled:opacity-50">Simpan Perubahan</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}

        {showEditDoc && editingDoc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 max-w-lg w-full rounded-3xl p-8 shadow-2xl relative overflow-hidden">
               <h2 className="text-xl font-bold text-slate-800 mb-8 uppercase tracking-[0.2em] flex items-center gap-4">
                  <div className="p-2.5 bg-indigo-500 text-white rounded-xl">
                    <FileText size={20} />
                  </div>
                  Ubah Dokumen / Brosur
               </h2>
               <form onSubmit={handleEditDoc} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Judul Dokumen / Brosur</label>
                    <input 
                      value={editingDoc.title} 
                      onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })} 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all font-bold text-sm shadow-sm" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Spesifikasi Singkat</label>
                    <textarea 
                      value={editingDoc.description} 
                      onChange={(e) => setEditingDoc({ ...editingDoc, description: e.target.value })} 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all font-medium text-sm leading-relaxed shadow-sm" 
                      rows={2} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Link Eksternal Pendukung (Opsional)</label>
                    <input 
                      type="url" 
                      value={editingDoc.externalLink || ""} 
                      onChange={(e) => setEditingDoc({ ...editingDoc, externalLink: e.target.value })} 
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all font-bold text-sm shadow-sm" 
                      placeholder="Contoh: https://drive.google.com/..." 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Pilih File Baru untuk Di-upload (PDF, Docx dsb)</label>
                    <div className="flex gap-4">
                       <input 
                         value={editingDoc.fileUrl} 
                         onChange={(e) => setEditingDoc({ ...editingDoc, fileUrl: e.target.value })} 
                         className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all text-xs font-semibold" 
                         placeholder="URL dokumen atau ketik manual (Opsional)..." 
                       />
                       <label className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-5 py-4 rounded-2xl cursor-pointer transition-all border border-indigo-200 flex items-center justify-center gap-2">
                          {editingDoc.uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                          <span className="text-[9px] font-black uppercase tracking-widest">Unggah</span>
                          <input type="file" onChange={handleUploadEditDocFile} className="hidden" />
                       </label>
                    </div>
                    {editingDoc.fileName && (
                      <p className="text-[10px] font-bold text-emerald-600 pl-1 mt-1 flex items-center gap-1">
                        <CheckCircle2 size={12} /> File Terupload: {editingDoc.fileName}
                      </p>
                    )}
                  </div>
                  <div className="pt-4 flex gap-4">
                    <button type="button" onClick={() => { setShowEditDoc(false); setEditingDoc(null); }} className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 border border-slate-200 rounded-2xl">Batal</button>
                    <button type="submit" disabled={editingDoc.uploading} className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] brand-gradient text-white rounded-2xl shadow-xl shadow-indigo-100 disabled:opacity-50">Simpan Update</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
