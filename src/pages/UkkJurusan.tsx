import React, { useState, useEffect } from "react";
import { User, UkkProject, UkkFile } from "../types";
import {
  Plus,
  Trash2,
  Search,
  Filter,
  Upload,
  FileText,
  Music,
  Youtube,
  ExternalLink,
  Sparkle,
  CheckCircle2,
  CalendarDays,
  UserCircle,
  GraduationCap,
  BookOpen,
  Loader2,
  FileSpreadsheet,
  Link as LinkIcon,
  Image as ImageIcon,
  Edit,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UkkJurusanProps {
  user: User;
}

const CATEGORIES = [
  "Proposal Usaha",
  "Konten Kreatif",
  "Landing Page Toko Online",
  "Pemasaran Sosial Media",
  "Analisis Pasar & SEO",
  "Live Commerce Campaign",
];

const FILE_TYPES = ["PDF", "Video", "Word", "Excel", "Link", "JPG", "PNG"];

const CLASS_OPTIONS = [
  ...Array.from({ length: 10 }, (_, i) => `X BD ${i + 1}`),
  ...Array.from({ length: 10 }, (_, i) => `XI BD ${i + 1}`),
  ...Array.from({ length: 10 }, (_, i) => `XII BD ${i + 1}`),
];

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

export default function UkkJurusanPage({ user }: UkkJurusanProps) {
  const [projects, setProjects] = useState<UkkProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedFileType, setSelectedFileType] = useState("Semua");
  const [selectedClass, setSelectedClass] = useState("Semua");
  const [selectedAcademic, setSelectedAcademic] = useState("Semua");

  // Toggle states for manual overrides in form
  const [isManualYear, setIsManualYear] = useState(false);
  const [isManualEditYear, setIsManualEditYear] = useState(false);
  const [isManualRombel, setIsManualRombel] = useState(false);
  const [isManualEditRombel, setIsManualEditRombel] = useState(false);

  // Dynamic lists from DB
  const academicYearsOptions = Array.from(new Set([
    ...defaultYears,
    ...projects.map(p => p.academicYear).filter(Boolean) as string[]
  ])).sort((a, b) => b.localeCompare(a));

  const uClassOptions = Array.from(new Set([
    ...CLASS_OPTIONS,
    ...projects.map(p => p.class).filter(Boolean) as string[]
  ]));

  // Show submission modal
  const [showAddProject, setShowAddProject] = useState(false);
  const [projectForm, setProjectForm] = useState({
    title: "",
    studentName: user.role === "siswa" ? user.name : "",
    class: "X BD 1",
    category: "Proposal Usaha",
    manualCategory: "",
    useManualCategory: false,
    fileUrl: "",
    fileName: "",
    fileType: "PDF",
    externalLink: "",
    academicYear: "2026/2027",
    files: [] as UkkFile[],
    uploading: false,
  });

  // Grading states
  const [evaluatingProject, setEvaluatingProject] = useState<UkkProject | null>(
    null,
  );
  const [evaluationForm, setEvaluationForm] = useState({
    grade: "",
    feedback: "",
  });

  // Editing states
  const [editingProject, setEditingProject] = useState<UkkProject | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    studentName: "",
    class: "X BD 1",
    category: "Proposal Usaha",
    manualCategory: "",
    useManualCategory: false,
    fileUrl: "",
    fileName: "",
    fileType: "PDF",
    externalLink: "",
    academicYear: "2026/2027",
    files: [] as UkkFile[],
    uploading: false,
  });

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/ukk-projects");
      const data = await res.json();
      setProjects(data);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const getDeducedFileType = (filename: string): string => {
    const originalName = filename.toLowerCase();
    if (originalName.endsWith(".pdf")) return "PDF";
    if (
      originalName.endsWith(".mp4") ||
      originalName.endsWith(".mov") ||
      originalName.endsWith(".avi") ||
      originalName.endsWith(".mkv")
    )
      return "Video";
    if (
      originalName.endsWith(".doc") ||
      originalName.endsWith(".docx")
    )
      return "Word";
    if (
      originalName.endsWith(".xls") ||
      originalName.endsWith(".xlsx") ||
      originalName.endsWith(".csv")
    )
      return "Excel";
    if (
      originalName.endsWith(".jpg") ||
      originalName.endsWith(".jpeg")
    )
      return "JPG";
    if (originalName.endsWith(".png")) return "PNG";
    if (originalName.endsWith(".ppt") || originalName.endsWith(".pptx")) return "PowerPoint";
    if (originalName.endsWith(".zip") || originalName.endsWith(".rar")) return "ZIP/RAR";
    return "Dokumen";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setProjectForm((prev) => ({ ...prev, uploading: true }));
    const formData = new FormData();
    for (let i = 0; i < e.target.files.length; i++) {
      formData.append("files", e.target.files[i]);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const newFiles = data.map((item: any) => {
          const type = getDeducedFileType(item.name);
          return {
            id: Math.random().toString(36).substr(2, 9),
            name: item.name,
            url: item.url,
            type: type,
          };
        });

        setProjectForm((prev) => {
          const existingFiles = prev.files || [];
          const updatedFiles = [...existingFiles, ...newFiles];
          const mainFile = updatedFiles[0] || { url: "", name: "", type: "PDF" };
          return {
            ...prev,
            files: updatedFiles,
            fileUrl: mainFile.url,
            fileName: mainFile.name,
            fileType: mainFile.type,
          };
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProjectForm((prev) => ({ ...prev, uploading: false }));
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const submissionCategory = projectForm.useManualCategory
      ? projectForm.manualCategory
      : projectForm.category;

    const dataToSend = {
      title: projectForm.title,
      studentName: projectForm.studentName || user.name || "Siswa",
      class: projectForm.class,
      category: submissionCategory || "Umum",
      fileUrl: projectForm.fileUrl,
      fileName: projectForm.fileName,
      fileType: projectForm.fileType,
      externalLink: projectForm.externalLink,
      academicYear: projectForm.academicYear,
      files: projectForm.files,
      grade: "",
      feedback: "",
    };

    try {
      const res = await fetch("/api/ukk-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      if (res.ok) {
        fetchProjects();
        setShowAddProject(false);
        setProjectForm({
          title: "",
          studentName: user.role === "siswa" ? user.name : "",
          class: "X BD 1",
          category: "Proposal Usaha",
          manualCategory: "",
          useManualCategory: false,
          fileUrl: "",
          fileName: "",
          fileType: "PDF",
          externalLink: "",
          academicYear: "2026/2027",
          files: [],
          uploading: false,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingProject) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/ukk-projects/${evaluatingProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: evaluationForm.grade,
          feedback: evaluationForm.feedback,
        }),
      });
      if (res.ok) {
        fetchProjects();
        setEvaluatingProject(null);
        setEvaluationForm({ grade: "", feedback: "" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

   const handleEditFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setEditForm((prev) => ({ ...prev, uploading: true }));
    const formData = new FormData();
    for (let i = 0; i < e.target.files.length; i++) {
      formData.append("files", e.target.files[i]);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const newFiles = data.map((item: any) => {
          const type = getDeducedFileType(item.name);
          return {
            id: Math.random().toString(36).substr(2, 9),
            name: item.name,
            url: item.url,
            type: type,
          };
        });

        setEditForm((prev) => {
          const existingFiles = prev.files || [];
          const updatedFiles = [...existingFiles, ...newFiles];
          const mainFile = updatedFiles[0] || { url: "", name: "", type: "PDF" };
          return {
            ...prev,
            files: updatedFiles,
            fileUrl: mainFile.url,
            fileName: mainFile.name,
            fileType: mainFile.type,
          };
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditForm((prev) => ({ ...prev, uploading: false }));
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setLoading(true);

    const submissionCategory = editForm.useManualCategory
      ? editForm.manualCategory
      : editForm.category;

    const dataToSend = {
      title: editForm.title,
      studentName: editForm.studentName,
      class: editForm.class,
      category: submissionCategory || "Umum",
      fileUrl: editForm.fileUrl,
      fileName: editForm.fileName,
      fileType: editForm.fileType,
      externalLink: editForm.externalLink,
      academicYear: editForm.academicYear,
      files: editForm.files,
    };

    try {
      const res = await fetch(`/api/ukk-projects/${editingProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      if (res.ok) {
        fetchProjects();
        setEditingProject(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Hapus portofolio UKK ini?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ukk-projects/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter project arrays
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.studentName.toLowerCase().includes(search.toLowerCase()) ||
      p.class.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "Semua" || p.category === selectedCategory;
    const matchesFileType =
      selectedFileType === "Semua" || p.fileType === selectedFileType;
    const matchesClass =
      selectedClass === "Semua" || p.class === selectedClass;
    const pYear = p.academicYear || "2026/2027";
    const matchesAcademic =
      selectedAcademic === "Semua" || pYear === selectedAcademic;

    return matchesSearch && matchesCategory && matchesFileType && matchesClass && matchesAcademic;
  });

  const getFileIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "PDF":
        return <FileText className="text-red-500" />;
      case "VIDEO":
        return <Youtube className="text-pink-500" />;
      case "WORD":
        return <FileText className="text-blue-500" />;
      case "EXCEL":
        return <FileSpreadsheet className="text-green-500" />;
      case "JPG":
      case "PNG":
        return <ImageIcon className="text-orange-500" />;
      default:
        return <LinkIcon className="text-indigo-500" />;
    }
  };

  const getFileBadgeStyle = (type: string) => {
    switch (type.toUpperCase()) {
      case "PDF":
        return "bg-red-50 text-red-600 border border-red-100";
      case "VIDEO":
        return "bg-pink-50 text-pink-600 border border-pink-100";
      case "WORD":
        return "bg-blue-50 text-blue-600 border border-blue-100";
      case "EXCEL":
        return "bg-emerald-50 text-emerald-600 border border-emerald-100";
      case "JPG":
      case "PNG":
        return "bg-orange-50 text-orange-600 border border-orange-100";
      default:
        return "bg-slate-50 text-slate-600 border border-slate-100";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8 pb-12"
    >
      {/* Banner */}
      <div className="brand-gradient rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/20 blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-black bg-emerald-400 text-slate-900 px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-3">
              Portfolio Center
            </span>
            <h1 className="text-3xl md:text-5xl font-display font-light uppercase tracking-tight leading-none">
              UKK <b className="font-black">JURUSAN</b>
            </h1>
            <p className="text-blue-50 text-sm mt-3 max-w-2xl font-medium leading-relaxed">
              Pusat unggahan proposal usaha siswa, video campaign promosi
              kreatif, link website toko online, serta direktori kelulusan Uji
              Kompetensi Keahlian (UKK) Bisnis Digital.
            </p>
          </div>
          <button
            onClick={() => {
              setIsManualYear(false);
              setIsManualRombel(false);
              setShowAddProject(true);
            }}
            className="bg-white hover:bg-slate-50 text-indigo-900 border-b-4 border-yellow-400 px-7 py-4 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={16} /> Unggah Karya Portfolio
          </button>
        </div>
      </div>

      {/* Filter and Search Bar controls */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-100/50 space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-150 flex items-center px-4 py-1">
            <Search size={18} className="text-slate-400 mr-3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-0 text-slate-800 text-sm font-semibold outline-none py-3"
              placeholder="Cari berdasarkan judul tugas, nama pengunggah atau kelas..."
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 rounded-2xl border border-slate-150 px-4 py-1 text-slate-400">
            <Filter size={16} />
            <select
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value)}
              className="bg-transparent border-0 text-slate-700 text-xs font-bold py-3 outline-none cursor-pointer"
            >
              <option value="Semua">File: Semua Format</option>
              {FILE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 rounded-2xl border border-slate-150 px-4 py-1 text-slate-400">
            <Filter size={16} />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent border-0 text-slate-700 text-xs font-bold py-3 outline-none cursor-pointer"
            >
              <option value="Semua">Kelas: Semua Kelas</option>
              {uClassOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 rounded-2xl border border-slate-150 px-4 py-1 text-slate-400">
            <Filter size={16} />
            <select
              value={selectedAcademic}
              onChange={(e) => setSelectedAcademic(e.target.value)}
              className="bg-transparent border-0 text-slate-700 text-xs font-bold py-3 outline-none cursor-pointer"
            >
              <option value="Semua">TP: Semua Tahun</option>
              {academicYearsOptions.map((y) => (
                <option key={y} value={y}>
                  TP {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Categories Tab Pill Selector */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-50 pt-4">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">
            Topik Filter:
          </span>
          {["Semua", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-100"
                  : "bg-slate-50 text-slate-500 hover:text-slate-800 border-slate-150"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Portfolio Grid */}
      {!loading && (
        <div className="bg-emerald-50/50 border border-emerald-100/60 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-slate-700">
           <div className="flex items-center gap-3">
             <div className="p-3 bg-[#ecfdf5] text-emerald-600 rounded-2xl">
               <CheckCircle2 size={18} />
             </div>
             <div>
               <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Status Pengumpulan Tugas UKK</p>
               <p className="text-xs text-slate-500 font-semibold mt-1">
                 {selectedClass === "Semua" 
                   ? `Ditemukan total ${filteredProjects.length} portofolio terkumpul dari seluruh siswa Bisnis Digital` 
                   : `Berikut adalah portofolio tugas siswa kelas ${selectedClass} yang telah dikumpulkan (${filteredProjects.length} tugas)`
                 }
               </p>
             </div>
           </div>
           <span className="text-[10px] font-black bg-[#ecfdf5] text-emerald-700 border border-emerald-100 px-4 py-2 rounded-xl uppercase tracking-widest text-center self-start sm:self-auto">
             {selectedClass === "Semua" ? "Semua Kelas" : selectedClass}
           </span>
        </div>
      )}

      {loading && projects.length === 0 ? (
        <div className="text-center py-16">
          <Loader2 size={35} className="animate-spin text-indigo-500 mx-auto" />
          <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">
            Sinkronisasi File UKK...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((p) => (
            <motion.div
              key={p.id}
              layout
              className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xl shadow-slate-100/50 flex flex-col justify-between hover:border-slate-300 transition-all group relative overflow-hidden"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-full bg-slate-50 border border-slate-150/40 text-slate-600">
                    {p.category}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2.5 py-1.5 rounded-full ${getFileBadgeStyle(p.fileType)}`}
                  >
                    {p.fileType}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                  {p.title}
                </h3>

                {/* Submitter details */}
                <div className="space-y-2 mt-4 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100/30">
                  <div className="flex gap-2 items-center text-slate-500">
                    <UserCircle size={14} className="text-indigo-400" />
                    <p className="text-xs font-bold text-slate-700">
                      {p.studentName}
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 uppercase tracking-tight">
                    <span className="flex items-center gap-1">
                      <GraduationCap size={12} /> {p.class}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays size={12} />{" "}
                      {new Date(p.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* File Attachment Action */}
                <div className="mt-5 space-y-2">
                  {p.files && p.files.length > 0 ? (
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-0.5">
                        Lampiran Berkas ({p.files.length}) :
                      </p>
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 fancy-scrollbar">
                        {p.files.map((f, idx) => (
                          <a
                            key={f.id || idx}
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 p-2.5 rounded-xl transition-all group/file text-left shadow-sm"
                          >
                            <div className="flex items-center gap-2 truncate flex-1 min-w-0 mr-2">
                              <span className="text-indigo-500 group-hover/file:scale-110 transition-transform flex-shrink-0">
                                {getFileIcon(f.type)}
                              </span>
                              <span className="text-slate-700 text-xs font-semibold truncate">
                                {f.name}
                              </span>
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded-md flex-shrink-0 group-hover/file:text-indigo-600 group-hover/file:border-indigo-100">
                              {f.type}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : (
                    p.fileUrl && (
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={p.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-indigo-200/30 shadow-sm"
                        >
                          {getFileIcon(p.fileType)} Unduh Tugas
                        </a>
                      </div>
                    )
                  )}

                  {p.externalLink && (
                    <div className="flex">
                      <a
                        href={p.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-600 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-amber-200/30 shadow-sm"
                      >
                        <ExternalLink size={12} /> Tautan Luar
                      </a>
                    </div>
                  )}
                </div>

                {/* Teacher evaluation/grade panel */}
                {p.grade ? (
                  <div className="mt-5 bg-amber-500/10 border border-amber-400/20 rounded-2xl p-4 text-amber-900 shadow-sm relative overflow-hidden">
                    <div className="absolute right-[-10px] bottom-[-10px] opacity-10 rotate-12">
                      <GraduationCap size={65} />
                    </div>
                    <div className="flex justify-between items-center mb-1.5 border-b border-amber-300/20 pb-1.5 z-10 relative">
                      <span className="text-[9px] font-black uppercase tracking-[0.1em] text-amber-700 flex items-center gap-1">
                        <Sparkle
                          size={12}
                          className="animate-spin text-amber-500"
                        />{" "}
                        Hasil Evaluasi Guru
                      </span>
                      <span className="text-base font-black px-2.5 py-0.5 rounded-xl bg-amber-500 text-white font-mono leading-none">
                        SKOR: {p.grade}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold leading-relaxed text-amber-800">
                      "
                      {p.feedback ||
                        "Tugas memenuhi standar kelulusan UKK Bisnis Digital."}
                      "
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Status: Belum Dinilai
                    </p>
                  </div>
                )}
              </div>

              {/* Foot action controllers */}
              <div className="flex justify-between items-center border-t border-slate-50 pt-4 mt-5">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  ID: {p.id.toUpperCase()}
                </span>
                <div className="flex items-center gap-2">
                  {(user.role === "admin" ||
                    user.role === "guru" ||
                    user.name === p.studentName) && (
                    <button
                      onClick={() => {
                        setEditingProject(p);
                        const isCustomCategory = !CATEGORIES.includes(
                          p.category,
                        );
                        const isCustomClass = !CLASS_OPTIONS.includes(p.class);
                        const isCustomYear = !defaultYears.includes(p.academicYear || "2026/2027");
                        setIsManualEditRombel(isCustomClass);
                        setIsManualEditYear(isCustomYear);
                        setEditForm({
                          title: p.title,
                          studentName: p.studentName,
                          class: p.class,
                          category: isCustomCategory
                            ? CATEGORIES[0]
                            : p.category,
                          manualCategory: isCustomCategory ? p.category : "",
                          useManualCategory: isCustomCategory,
                          fileUrl: p.fileUrl || "",
                          fileName: p.fileName || "",
                          fileType: p.fileType || "PDF",
                          externalLink: p.externalLink || "",
                          academicYear: p.academicYear || "2026/2027",
                          files: p.files || [],
                          uploading: false,
                        });
                      }}
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all border border-slate-200/40"
                    >
                      <Edit size={12} /> Edit
                    </button>
                  )}
                  {(user.role === "admin" || user.role === "guru") && (
                    <button
                      onClick={() => {
                        setEvaluatingProject(p);
                        setEvaluationForm({
                          grade: p.grade || "",
                          feedback: p.feedback || "",
                        });
                      }}
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-all border border-indigo-200/20"
                    >
                      <Sparkle size={12} className="text-indigo-500" /> Nilai
                    </button>
                  )}
                  {(user.role === "admin" ||
                    user.role === "guru" ||
                    user.name === p.studentName) && (
                    <button
                      onClick={() => handleDeleteProject(p.id)}
                      className="p-2 border border-rose-100 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      title="Hapus"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {filteredProjects.length === 0 && (
            <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 text-sm">
                Tidak ada dekorasi portfolio UKK dengan kriteria tersebut.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Project Submission Modal */}
      <AnimatePresence>
        {showAddProject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-slate-200 max-w-lg w-full rounded-3xl p-8 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto pr-6"
            >
              <h2 className="text-xl font-bold text-slate-800 mb-8 uppercase tracking-[0.2em] flex items-center gap-4">
                <div className="p-2.5 bg-indigo-500 text-white rounded-xl">
                  <Upload size={20} />
                </div>
                Unggah Praktik UKK
              </h2>

              <form onSubmit={handleAddProject} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Judul Karya / Tugas
                  </label>
                  <input
                    value={projectForm.title}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, title: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all font-bold text-sm shadow-sm"
                    placeholder="Contoh: Proposal Pemasaran Kedai Hijab..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      Nama Pengirim
                    </label>
                    <input
                      value={projectForm.studentName}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          studentName: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all font-bold text-sm"
                      placeholder="Nama lengkap..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      Kelas Keahlian
                    </label>
                    <select
                      value={isManualRombel ? "manual" : (projectForm.class || "X BD 1")}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "manual") {
                          setIsManualRombel(true);
                          setProjectForm({ ...projectForm, class: "" });
                        } else {
                          setIsManualRombel(false);
                          setProjectForm({ ...projectForm, class: val });
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all font-bold text-xs cursor-pointer"
                    >
                      {uClassOptions.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                      <option value="manual">+ Ketik Manual (Rombel Baru)...</option>
                    </select>
                    {isManualRombel && (
                      <input
                        type="text"
                        placeholder="Tulis Rombel baru..."
                        value={projectForm.class}
                        onChange={(e) =>
                          setProjectForm({ ...projectForm, class: e.target.value })
                        }
                        className="w-full bg-indigo-50/50 border border-indigo-200 text-slate-800 rounded-xl p-3 outline-none focus:border-indigo-500 text-xs font-bold mt-1.5 shadow-inner"
                        required
                      />
                    )}
                  </div>
                </div>

                {/* Topik / Category option block with manual custom entry toggler */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center pl-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Kategori Tugas
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setProjectForm((prev) => ({
                          ...prev,
                          useManualCategory: !prev.useManualCategory,
                        }))
                      }
                      className="text-[9px] font-black text-indigo-600 hover:underline uppercase tracking-wide"
                    >
                      {projectForm.useManualCategory
                        ? "Pilih dari Daftar"
                        : "Ketik Manual"}
                    </button>
                  </div>

                  {projectForm.useManualCategory ? (
                    <input
                      value={projectForm.manualCategory}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          manualCategory: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all font-bold text-sm shadow-sm"
                      placeholder="Ketik topik secara manual (contoh: Proposal Skripsi, Iklan Banner)..."
                      required
                    />
                  ) : (
                    <select
                      value={projectForm.category}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          category: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all font-bold text-xs"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Tahun Ajaran (TP)
                  </label>
                  <select
                    value={isManualYear ? "manual" : (projectForm.academicYear || "2026/2027")}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "manual") {
                        setIsManualYear(true);
                        setProjectForm({ ...projectForm, academicYear: "" });
                      } else {
                        setIsManualYear(false);
                        setProjectForm({ ...projectForm, academicYear: val });
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all font-bold text-xs cursor-pointer"
                  >
                    {academicYearsOptions.map((y) => (
                      <option key={y} value={y}>
                        TP {y}
                      </option>
                    ))}
                    <option value="manual">+ Ketik Manual (TP Baru)...</option>
                  </select>
                  {isManualYear && (
                    <input
                      type="text"
                      placeholder="Contoh: 2037/2038"
                      value={projectForm.academicYear}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          academicYear: e.target.value,
                        })
                      }
                      className="w-full bg-indigo-50/50 border border-indigo-200 text-slate-800 rounded-xl p-3 outline-none focus:border-indigo-500 text-xs font-bold mt-1.5 shadow-inner"
                      required
                    />
                  )}
                </div>

                {/* Submission link or PDF/Video upload */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Tautan Luar (Google Drive, TikTok, YouTube, dsb)
                  </label>
                  <input
                    value={projectForm.externalLink}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        externalLink: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all text-xs font-semibold shadow-sm"
                    placeholder="Masukkan link video tiktok, google drive atau url ecommerce..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 leading-snug block">
                    Unggah Berkas Fisik Hasil UKK (Bisa Banyak File / Sejenis / Berbeda Jenis)
                  </label>
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Format didukung: PDF, Word, Excel, Video, JPG, PNG, PowerPoint, RAR/ZIP
                      </span>
                      <label className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-5 py-3 rounded-xl cursor-pointer transition-all border border-indigo-200 flex items-center justify-center gap-2 flex-shrink-0 select-none shadow-sm">
                        {projectForm.uploading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Upload size={14} />
                        )}
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          {projectForm.uploading ? "Mengunggah..." : "Pilih File"}
                        </span>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                           className="hidden"
                          disabled={projectForm.uploading}
                        />
                      </label>
                    </div>

                    {projectForm.files && projectForm.files.length > 0 ? (
                      <div className="space-y-2 mt-2">
                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-wider pl-1">
                          Daftar Berkas Terpilih ({projectForm.files.length}) :
                        </p>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 fancy-scrollbar">
                          {projectForm.files.map((file, idx) => (
                            <div key={file.id || idx} className="flex items-center justify-between bg-white border border-slate-150 p-2.5 rounded-xl shadow-sm transition-all hover:border-slate-250">
                              <div className="flex items-center gap-2 truncate flex-grow mr-2 min-w-0">
                                <span className="text-indigo-500 flex-shrink-0">
                                  {getFileIcon(file.type)}
                                </span>
                                <span className="text-xs font-bold text-slate-700 truncate">
                                  {file.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[8px] font-extrabold text-slate-400 bg-slate-100 border border-slate-150 px-1.5 py-0.5 rounded-md uppercase">
                                  {file.type}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProjectForm((prev) => {
                                      const filtered = prev.files.filter((f) => f.id !== file.id);
                                      const mainFile = filtered[0] || { url: "", name: "", type: "PDF" };
                                      return {
                                        ...prev,
                                        files: filtered,
                                        fileUrl: mainFile.url,
                                        fileName: mainFile.name,
                                        fileType: mainFile.type,
                                      };
                                    });
                                  }}
                                  className="p-1 px-2 text-rose-500 hover:bg-rose-50 border border-rose-100 rounded-lg hover:text-rose-600 transition-all text-[10px] font-bold"
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 font-medium py-3 text-center border border-dashed border-slate-200 rounded-2xl bg-white/50">
                        Belum ada berkas hasil UKK yang diunggah. Klik 'Pilih File' di atas.
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowAddProject(false)}
                    className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 border border-slate-200 rounded-2xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={projectForm.uploading}
                    className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] brand-gradient text-white rounded-2xl shadow-xl shadow-indigo-100 enabled:opacity-90 disabled:opacity-50"
                  >
                    Kirim Portofolio
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Evaluation / Grading Form Modal */}
        {evaluatingProject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-slate-200 max-w-lg w-full rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
              <h2 className="text-xl font-bold text-slate-800 mb-8 uppercase tracking-[0.2em] flex items-center gap-4">
                <div className="p-2.5 bg-yellow-500 text-white rounded-xl">
                  <GraduationCap size={20} />
                </div>
                Evaluasi Penilaian UKK
              </h2>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6 text-xs text-slate-600 font-semibold">
                <p>
                  <b>Judul:</b> {evaluatingProject.title}
                </p>
                <p className="mt-1">
                  <b>Siswa:</b> {evaluatingProject.studentName} (
                  {evaluatingProject.class})
                </p>
              </div>

              <form onSubmit={handleEvaluate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Skor Ujian (0 - 100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={evaluationForm.grade}
                    onChange={(e) =>
                      setEvaluationForm({
                        ...evaluationForm,
                        grade: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all font-bold text-sm shadow-sm"
                    placeholder="Skor angka (Contoh: 95)..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Catatan Evaluasi / Feedback Guru
                  </label>
                  <textarea
                    value={evaluationForm.feedback}
                    onChange={(e) =>
                      setEvaluationForm({
                        ...evaluationForm,
                        feedback: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all font-medium text-sm leading-relaxed shadow-sm"
                    placeholder="Berikan masukan mendidik untuk portofolio siswa..."
                    rows={4}
                    required
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setEvaluatingProject(null)}
                    className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 border border-slate-200 rounded-2xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] brand-gradient text-white rounded-2xl shadow-xl shadow-indigo-150"
                  >
                    Simpan Hasil Penilaian
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit Project details Modal */}
        {editingProject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-slate-200 max-w-lg w-full rounded-3xl p-8 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto pr-6"
            >
              <h2 className="text-xl font-bold text-slate-800 mb-8 uppercase tracking-[0.2em] flex items-center gap-4">
                <div className="p-2.5 bg-indigo-500 text-white rounded-xl">
                  <Edit size={20} />
                </div>
                Edit Portofolio UKK
              </h2>

              <form onSubmit={handleSaveEdit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Judul Karya / Tugas
                  </label>
                  <input
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all font-bold text-sm shadow-sm"
                    placeholder="Contoh: Proposal Pemasaran Kedai Hijab..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      Nama Pengirim
                    </label>
                    <input
                      value={editForm.studentName}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          studentName: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all font-bold text-sm"
                      placeholder="Nama lengkap..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      Kelas Keahlian
                    </label>
                    <select
                      value={isManualEditRombel ? "manual" : (editForm.class || "X BD 1")}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "manual") {
                          setIsManualEditRombel(true);
                          setEditForm({ ...editForm, class: "" });
                        } else {
                          setIsManualEditRombel(false);
                          setEditForm({ ...editForm, class: val });
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all font-bold text-xs cursor-pointer"
                    >
                      {uClassOptions.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                      <option value="manual">+ Ketik Manual (Rombel Baru)...</option>
                    </select>
                    {isManualEditRombel && (
                      <input
                        type="text"
                        placeholder="Tulis Rombel baru..."
                        value={editForm.class}
                        onChange={(e) =>
                          setEditForm({ ...editForm, class: e.target.value })
                        }
                        className="w-full bg-indigo-50/50 border border-indigo-200 text-slate-800 rounded-xl p-3 outline-none focus:border-indigo-500 text-xs font-bold mt-1.5 shadow-inner"
                        required
                      />
                    )}
                  </div>
                </div>

                {/* Topik / Category option block with manual custom entry toggler */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center pl-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">
                      Kategori Tugas
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setEditForm((prev) => ({
                          ...prev,
                          useManualCategory: !prev.useManualCategory,
                        }))
                      }
                      className="text-[9px] font-black text-indigo-600 hover:underline uppercase tracking-wide"
                    >
                      {editForm.useManualCategory
                        ? "Pilih dari Daftar"
                        : "Ketik Manual"}
                    </button>
                  </div>

                  {editForm.useManualCategory ? (
                    <input
                      value={editForm.manualCategory}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          manualCategory: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all font-bold text-sm shadow-sm"
                      placeholder="Ketik topik secara manual (contoh: Proposal Skripsi, Iklan Banner)..."
                      required
                    />
                  ) : (
                    <select
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm({ ...editForm, category: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all font-bold text-xs"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Tahun Ajaran (TP)
                  </label>
                  <select
                    value={isManualEditYear ? "manual" : (editForm.academicYear || "2026/2027")}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "manual") {
                        setIsManualEditYear(true);
                        setEditForm({ ...editForm, academicYear: "" });
                      } else {
                        setIsManualEditYear(false);
                        setEditForm({ ...editForm, academicYear: val });
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all font-bold text-xs cursor-pointer"
                  >
                    {academicYearsOptions.map((y) => (
                      <option key={y} value={y}>
                        TP {y}
                      </option>
                    ))}
                    <option value="manual">+ Ketik Manual (TP Baru)...</option>
                  </select>
                  {isManualEditYear && (
                    <input
                      type="text"
                      placeholder="Contoh: 2037/2038"
                      value={editForm.academicYear}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          academicYear: e.target.value,
                        })
                      }
                      className="w-full bg-indigo-50/50 border border-indigo-200 text-slate-800 rounded-xl p-3 outline-none focus:border-indigo-500 text-xs font-bold mt-1.5 shadow-inner"
                      required
                    />
                  )}
                </div>

                {/* Submission link or PDF/Video upload */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Tautan Luar (Google Drive, TikTok, YouTube, dsb)
                  </label>
                  <input
                    value={editForm.externalLink}
                    onChange={(e) =>
                      setEditForm({ ...editForm, externalLink: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 outline-none focus:border-indigo-500/50 transition-all text-xs font-semibold shadow-sm"
                    placeholder="Masukkan link video tiktok, google drive atau url ecommerce..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 leading-snug block">
                    Unggah Berkas Fisik Hasil UKK (Bisa Banyak File / Sejenis / Berbeda Jenis)
                  </label>
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Format didukung: PDF, Word, Excel, Video, JPG, PNG, PowerPoint, RAR/ZIP
                      </span>
                      <label className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-5 py-3 rounded-xl cursor-pointer transition-all border border-indigo-200 flex items-center justify-center gap-2 flex-shrink-0 select-none shadow-sm">
                        {editForm.uploading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Upload size={14} />
                        )}
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          {editForm.uploading ? "Mengunggah..." : "Pilih File"}
                        </span>
                        <input
                          type="file"
                          multiple
                          onChange={handleEditFileUpload}
                          className="hidden"
                          disabled={editForm.uploading}
                        />
                      </label>
                    </div>

                    {editForm.files && editForm.files.length > 0 ? (
                      <div className="space-y-2 mt-2">
                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-wider pl-1">
                          Daftar Berkas Terpilih ({editForm.files.length}) :
                        </p>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 fancy-scrollbar">
                          {editForm.files.map((file, idx) => (
                            <div key={file.id || idx} className="flex items-center justify-between bg-white border border-slate-150 p-2.5 rounded-xl shadow-sm transition-all hover:border-slate-250">
                              <div className="flex items-center gap-2 truncate flex-grow mr-2 min-w-0">
                                <span className="text-indigo-500 flex-shrink-0">
                                  {getFileIcon(file.type)}
                                </span>
                                <span className="text-xs font-bold text-slate-700 truncate">
                                  {file.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[8px] font-extrabold text-slate-400 bg-slate-100 border border-slate-150 px-1.5 py-0.5 rounded-md uppercase">
                                  {file.type}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditForm((prev) => {
                                      const filtered = prev.files.filter((f) => f.id !== file.id);
                                      const mainFile = filtered[0] || { url: "", name: "", type: "PDF" };
                                      return {
                                        ...prev,
                                        files: filtered,
                                        fileUrl: mainFile.url,
                                        fileName: mainFile.name,
                                        fileType: mainFile.type,
                                      };
                                    });
                                  }}
                                  className="p-1 px-2 text-rose-500 hover:bg-rose-50 border border-rose-100 rounded-lg hover:text-rose-600 transition-all text-[10px] font-bold"
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 font-medium py-3 text-center border border-dashed border-slate-200 rounded-2xl bg-white/50">
                        Belum ada berkas hasil UKK yang diunggah. Klik 'Pilih File' di atas.
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setEditingProject(null)}
                    className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 border border-slate-200 rounded-2xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={editForm.uploading}
                    className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] brand-gradient text-white rounded-2xl shadow-xl shadow-indigo-100 enabled:opacity-90 disabled:opacity-50"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
