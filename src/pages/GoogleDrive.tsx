import React, { useState, useEffect, useRef } from "react";
import { 
  googleSignIn, 
  initAuth, 
  logoutGoogle, 
  getAccessToken 
} from "../utils/googleDriveAuth";
import { User as FirebaseUser } from "firebase/auth";
import { 
  Folder, 
  File, 
  Search, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Share2, 
  FileSpreadsheet, 
  FileText, 
  LayoutGrid, 
  List, 
  LogOut, 
  Globe, 
  Download, 
  UploadCloud, 
  Check, 
  Copy, 
  ChevronRight,
  Loader2,
  FolderPlus,
  RefreshCw,
  FileCode,
  Image,
  AlertTriangle,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  size?: string;
  createdTime?: string;
}

export default function GoogleDrive() {
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Drive Browsing State
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentFolderId, setCurrentFolderId] = useState<string>("root");
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([
    { id: "root", name: "Google Drive Utama" }
  ]);

  // Operations Modals State
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<DriveFile | null>(null);
  const [deletingFile, setDeletingFile] = useState(false);

  // Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Copied State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already authenticated
    const unsubscribe = initAuth(
      (user, tkn) => {
        setGoogleUser(user);
        setToken(tkn);
        setNeedsAuth(false);
      },
      () => {
        setGoogleUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch files in current directory
  const fetchFiles = async (folderId: string = "root", query: string = "") => {
    const accessToken = token || getAccessToken();
    if (!accessToken) return;

    setLoading(true);
    try {
      let q = `'${folderId}' in parents and trashed = false`;
      if (query.trim() !== "") {
        // Safe query sanitization
        const cleanQuery = query.replace(/'/g, "\\'");
        q = `name contains '${cleanQuery}' and trashed = false`;
      }

      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        q
      )}&fields=files(id,name,mimeType,webViewLink,iconLink,thumbnailLink,size,createdTime)&orderBy=folder,name&pageSize=100`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      } else if (res.status === 401) {
        // Token might have expired
        setNeedsAuth(true);
      } else {
        console.error("Gagal memuat file:", await res.text());
      }
    } catch (err) {
      console.error("Fetch files error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFiles(currentFolderId, searchQuery);
    }
  }, [token, currentFolderId]);

  // Handle Login
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setGoogleUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error("Google login failed:", err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logoutGoogle();
      setToken(null);
      setGoogleUser(null);
      setNeedsAuth(true);
      setFiles([]);
      setCurrentFolderId("root");
      setBreadcrumbs([{ id: "root", name: "Google Drive Utama" }]);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Traverse down to folder
  const handleFolderClick = (folder: DriveFile) => {
    const newBrumbs = [...breadcrumbs, { id: folder.id, name: folder.name }];
    setBreadcrumbs(newBrumbs);
    setCurrentFolderId(folder.id);
    setSearchQuery("");
  };

  // Traverse up to previous folder in breadcrumbs
  const handleBreadcrumbClick = (index: number) => {
    const target = breadcrumbs[index];
    const newBrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBrumbs);
    setCurrentFolderId(target.id);
    setSearchQuery("");
  };

  // Create New Folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !token) return;

    setCreatingFolder(true);
    try {
      const body = {
        name: newFolderName.trim(),
        mimeType: "application/vnd.google-apps.folder",
        parents: currentFolderId === "root" ? [] : [currentFolderId]
      };

      const res = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setNewFolderName("");
        setShowFolderModal(false);
        fetchFiles(currentFolderId, searchQuery);
      } else {
        alert("Gagal membuat folder baru.");
      }
    } catch (err) {
      console.error("Create folder error:", err);
    } finally {
      setCreatingFolder(false);
    }
  };

  // Create Quick Google Doc or Google Sheet
  const handleCreateGoogleDoc = async (type: "document" | "spreadsheet") => {
    if (!token) return;

    const name = type === "document" ? "Dokumen Bisnis Digital Baru" : "Spreadsheet Analisis Baru";
    const mimeType = type === "document" 
      ? "application/vnd.google-apps.document" 
      : "application/vnd.google-apps.spreadsheet";

    try {
      const body = {
        name,
        mimeType,
        parents: currentFolderId === "root" ? [] : [currentFolderId]
      };

      const res = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        fetchFiles(currentFolderId, searchQuery);
      } else {
        alert("Gagal membuat berkas Google Workspace.");
      }
    } catch (err) {
      console.error("Create workspace file error:", err);
    }
  };

  // Upload File to Current Folder
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploading(true);
    setUploadProgress("Menyiapkan transfer data...");

    try {
      const metadata = {
        name: file.name,
        parents: currentFolderId === "root" ? [] : [currentFolderId]
      };

      const formData = new FormData();
      formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      formData.append("file", file);

      setUploadProgress(`Mentransfer "${file.name}"...`);

      const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        setUploadProgress("Berhasil diunggah!");
        setTimeout(() => setUploadProgress(null), 1500);
        fetchFiles(currentFolderId, searchQuery);
      } else {
        alert("Gagal mengunggah file ke Google Drive.");
      }
    } catch (err) {
      console.error("File upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  // Confirm delete file (REQUIRED user confirmation for destructive action!)
  const triggerDelete = (file: DriveFile, e: React.MouseEvent) => {
    e.stopPropagation();
    setFileToDelete(file);
    setShowDeleteModal(true);
  };

  const handleDeleteFile = async () => {
    if (!fileToDelete || !token) return;

    setDeletingFile(true);
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setShowDeleteModal(false);
        setFileToDelete(null);
        fetchFiles(currentFolderId, searchQuery);
      } else {
        alert("Gagal menghapus file dari Google Drive.");
      }
    } catch (err) {
      console.error("Delete file error:", err);
    } finally {
      setDeletingFile(false);
    }
  };

  // Copy Link helper
  const handleCopyLink = (file: DriveFile, e: React.MouseEvent) => {
    e.stopPropagation();
    if (file.webViewLink) {
      navigator.clipboard.writeText(file.webViewLink);
      setCopiedId(file.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Get human readable size
  const formatBytes = (bytesStr?: string) => {
    if (!bytesStr) return "-";
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return "-";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Helper to resolve icon based on mimeType
  const getFileIcon = (mimeType: string) => {
    if (mimeType === "application/vnd.google-apps.folder") {
      return <Folder className="text-amber-500 fill-amber-500/20" size={32} />;
    }
    if (mimeType.includes("document") || mimeType === "application/vnd.google-apps.document") {
      return <FileText className="text-blue-500" size={32} />;
    }
    if (mimeType.includes("spreadsheet") || mimeType === "application/vnd.google-apps.spreadsheet") {
      return <FileSpreadsheet className="text-emerald-500" size={32} />;
    }
    if (mimeType.includes("image/")) {
      return <Image className="text-rose-500" size={32} />;
    }
    if (mimeType.includes("javascript") || mimeType.includes("json") || mimeType.includes("css")) {
      return <FileCode className="text-violet-500" size={32} />;
    }
    return <File className="text-slate-400" size={32} />;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Immersive Header Banner */}
      <div className="relative rounded-[2.5rem] bg-gradient-to-r from-blue-700 via-indigo-800 to-indigo-950 p-8 sm:p-12 overflow-hidden shadow-2xl border border-indigo-500/10">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-yellow-400/5 rounded-full blur-[50px] -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="text-[10px] bg-yellow-400/20 text-yellow-300 font-extrabold uppercase tracking-[0.25em] px-3.5 py-1.5 rounded-full border border-yellow-400/20 inline-block">
              WORKSPACE INTEGRATION
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase leading-none">
              Akses Google Drive
            </h1>
            <p className="text-indigo-200/95 text-xs sm:text-sm font-medium leading-relaxed">
              Hubungkan akun Google Drive Anda untuk mengakses modul kurikulum, bahan ajar, video praktikum, dan mengelola arsip administrasi program keahlian Bisnis Digital secara real-time.
            </p>
          </div>

          {googleUser && (
            <div className="bg-white/10 dark:bg-slate-900/40 backdrop-blur-md px-5 py-4 rounded-3xl border border-white/10 flex items-center gap-4 transition-all hover:border-white/20">
              {googleUser.photoURL ? (
                <img 
                  src={googleUser.photoURL} 
                  alt="Avatar" 
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-yellow-400"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-yellow-400 text-slate-900 flex items-center justify-center font-black">
                  {googleUser.displayName?.charAt(0) || "G"}
                </div>
              )}
              <div className="text-left">
                <p className="text-white font-bold text-xs leading-none uppercase tracking-wide truncate max-w-[150px]">
                  {googleUser.displayName || "Pengguna Google"}
                </p>
                <p className="text-indigo-200 text-[10px] font-semibold mt-1 truncate max-w-[150px]">
                  {googleUser.email}
                </p>
                <button
                  onClick={handleLogout}
                  className="text-yellow-400 hover:text-yellow-300 font-black uppercase text-[9px] tracking-wider flex items-center gap-1.5 mt-2 transition-all"
                >
                  <LogOut size={10} /> Putus Koneksi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auth Screen Card if not authenticated */}
      {needsAuth ? (
        <div className="bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 text-center shadow-xl max-w-lg mx-auto space-y-8">
          <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
            <UploadCloud size={40} className="animate-bounce" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">
              Otorisasi Akses Diperlukan
            </h2>
            <p className="text-slate-400 dark:text-slate-400 text-xs font-semibold leading-relaxed">
              Silakan hubungkan akun Google Drive Anda terlebih dahulu untuk mulai berselancar, mengunggah materi, membuat modul digital, serta menautkan dokumen ke portal Bisnis Digital.
            </p>
          </div>

          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm px-6 py-4.5 rounded-2xl shadow-sm transition-all hover:shadow-md active:scale-98 cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {isLoggingIn ? (
              <>
                <Loader2 size={18} className="animate-spin text-indigo-500" />
                <span className="uppercase tracking-widest text-xs font-extrabold text-indigo-500">MENGHUBUNGKAN...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V13.4h6.887c-.275 1.564-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1c-6.075 0-11 4.925-11 11s4.925 11 11 11c6.34 0 10.55-4.46 10.55-10.74 0-.72-.08-1.28-.175-1.975H12.24z"
                  />
                </svg>
                <span className="uppercase tracking-widest text-xs font-extrabold text-slate-600 dark:text-slate-300">Hubungkan Akun Google</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Authenticated Interface */
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl">
          
          {/* Header Action Toolbar */}
          <div className="p-6 md:p-8 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute inset-y-0 left-4 my-auto text-slate-400 pointer-events-none" size={18} />
              <input
                type="text"
                placeholder="Cari file atau dokumen di Google Drive..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchFiles(currentFolderId, searchQuery)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-2xl pl-12 pr-16 py-3.5 text-sm font-bold shadow-sm outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
              <button 
                onClick={() => fetchFiles(currentFolderId, searchQuery)}
                className="absolute right-2 inset-y-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest px-3.5 flex items-center justify-center transition-all cursor-pointer"
              >
                Cari
              </button>
            </div>

            {/* Quick Actions Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Upload Cloud File input button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 dark:text-indigo-400 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-200/40 dark:border-indigo-800/40 transition-all cursor-pointer"
              >
                {uploading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <UploadCloud size={14} />
                )}
                Unggah File
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />

              {/* Create Folder Button */}
              <button
                onClick={() => setShowFolderModal(true)}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
              >
                <FolderPlus size={14} />
                Buat Folder
              </button>

              {/* Create Doc Button */}
              <button
                onClick={() => handleCreateGoogleDoc("document")}
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:hover:bg-blue-900/30 dark:text-blue-400 px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                title="Buat Google Doc"
              >
                <FileText size={14} />
                + Doc
              </button>

              {/* Create Sheet Button */}
              <button
                onClick={() => handleCreateGoogleDoc("spreadsheet")}
                className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/30 dark:text-emerald-400 px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                title="Buat Google Sheet"
              >
                <FileSpreadsheet size={14} />
                + Sheet
              </button>

              {/* View toggle & Refresh button */}
              <div className="flex border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-3 transition-colors ${viewMode === "grid" ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-800 text-slate-400"}`}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-3 transition-colors ${viewMode === "list" ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-800 text-slate-400"}`}
                >
                  <List size={14} />
                </button>
              </div>

              <button
                onClick={() => fetchFiles(currentFolderId, searchQuery)}
                disabled={loading}
                className="p-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
                title="Segarkan data"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Breadcrumb Navigation Trail */}
          <div className="px-6 md:px-8 py-4 bg-slate-50/20 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id}>
                {idx > 0 && <ChevronRight size={14} className="text-slate-300 dark:text-slate-700" />}
                <button
                  onClick={() => handleBreadcrumbClick(idx)}
                  className={`hover:text-indigo-600 transition-colors cursor-pointer ${
                    idx === breadcrumbs.length - 1 ? "text-indigo-600 font-extrabold dark:text-indigo-400" : ""
                  }`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Loading Indicator or Progress Bar */}
          {uploadProgress && (
            <div className="bg-indigo-50 dark:bg-indigo-950/40 px-8 py-3 flex items-center gap-3 border-b border-indigo-100 dark:border-indigo-950">
              <Loader2 size={16} className="animate-spin text-indigo-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                {uploadProgress}
              </span>
            </div>
          )}

          {/* Files Stage Grid/List */}
          <div className="p-6 md:p-8 min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 size={40} className="animate-spin text-indigo-600" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Sinkronisasi dengan Google Drive...
                </p>
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                  <Folder size={32} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                    Folder Kosong / Tidak Ada File
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed mt-1">
                    Silakan gunakan menu "Unggah File" atau buat berkas digital baru menggunakan pintasan aksi di atas.
                  </p>
                </div>
              </div>
            ) : viewMode === "grid" ? (
              /* Grid Layout Mode */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {files.map((file) => {
                  const isFolder = file.mimeType === "application/vnd.google-apps.folder";
                  const isCopied = copiedId === file.id;

                  return (
                    <div
                      key={file.id}
                      onClick={() => isFolder ? handleFolderClick(file) : null}
                      className={`group relative bg-slate-50/50 dark:bg-slate-800/20 border border-slate-150/60 dark:border-slate-800/40 rounded-2xl p-5 hover:bg-white dark:hover:bg-slate-800 shadow-sm hover:shadow-lg transition-all flex flex-col h-[180px] justify-between cursor-pointer ${
                        isFolder ? "hover:-translate-y-1" : ""
                      }`}
                    >
                      {/* Top Row: Icon & File Operations */}
                      <div className="flex justify-between items-start">
                        <div className="p-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-inner group-hover:scale-105 transition-transform">
                          {getFileIcon(file.mimeType)}
                        </div>

                        {/* File Action Tray */}
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          {file.webViewLink && (
                            <button
                              onClick={(e) => handleCopyLink(file, e)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-slate-700 dark:hover:bg-indigo-950/40 text-slate-500 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                              title="Salin Link Berkas"
                            >
                              {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            </button>
                          )}
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-slate-700 dark:hover:bg-blue-950/40 text-slate-500 dark:text-slate-300 hover:text-blue-600 transition-colors"
                              title="Buka Berkas di Tab Baru"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                          <button
                            onClick={(e) => triggerDelete(file, e)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-700 dark:hover:bg-rose-950/40 text-slate-500 dark:text-slate-300 hover:text-rose-600 transition-colors"
                            title="Hapus dari Google Drive"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* File Info */}
                      <div className="space-y-1">
                        <h4 
                          className="text-xs font-black text-slate-800 dark:text-slate-200 leading-tight uppercase truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                          title={file.name}
                        >
                          {file.name}
                        </h4>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">
                          <span>{isFolder ? "FOLDER" : formatBytes(file.size)}</span>
                          <span>
                            {file.createdTime 
                              ? new Date(file.createdTime).toLocaleDateString("id-ID", { month: "short", day: "numeric" }) 
                              : "-"
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List Layout Mode */
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-150 dark:border-slate-800 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                      <th className="py-4 px-6">Nama File / Dokumen</th>
                      <th className="py-4 px-6">Tipe</th>
                      <th className="py-4 px-6">Ukuran</th>
                      <th className="py-4 px-6">Tanggal Dibuat</th>
                      <th className="py-4 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300">
                    {files.map((file) => {
                      const isFolder = file.mimeType === "application/vnd.google-apps.folder";
                      const isCopied = copiedId === file.id;

                      return (
                        <tr
                          key={file.id}
                          onClick={() => isFolder ? handleFolderClick(file) : null}
                          className="hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                        >
                          <td className="py-4 px-6 flex items-center gap-3">
                            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 rounded-lg shadow-inner">
                              {getFileIcon(file.mimeType)}
                            </div>
                            <span className="font-extrabold uppercase text-slate-800 dark:text-slate-100 truncate max-w-[250px] sm:max-w-xs md:max-w-md">
                              {file.name}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-[10px] uppercase font-black tracking-wider text-slate-400">
                            {isFolder ? "FOLDER" : file.mimeType.split("/")[1] || "BERKAS"}
                          </td>
                          <td className="py-4 px-6 text-slate-400">{isFolder ? "-" : formatBytes(file.size)}</td>
                          <td className="py-4 px-6 text-slate-400">
                            {file.createdTime ? new Date(file.createdTime).toLocaleDateString("id-ID") : "-"}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              {file.webViewLink && (
                                <button
                                  onClick={(e) => handleCopyLink(file, e)}
                                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                                  title="Salin Tautan"
                                >
                                  {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                </button>
                              )}
                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                                  title="Buka Berkas"
                                >
                                  <ExternalLink size={12} />
                                </a>
                              )}
                              <button
                                onClick={(e) => triggerDelete(file, e)}
                                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 text-slate-500 transition-colors"
                                title="Hapus Berkas"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      <AnimatePresence>
        {showFolderModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                    Buat Folder Baru
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    Atur dokumen program studi Bisnis Digital
                  </p>
                </div>
                <button
                  onClick={() => setShowFolderModal(false)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 rounded-full transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateFolder} className="p-6 md:p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                    Nama Folder Baru *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Modul Ajar SEO & SEM"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-2xl p-4 outline-none focus:border-indigo-500 text-sm font-bold shadow-inner"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowFolderModal(false)}
                    className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={creatingFolder || !newFolderName.trim()}
                    className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-white brand-gradient rounded-2xl shadow-lg hover:scale-102 active:scale-98 transition-all cursor-pointer border-b-4 border-yellow-400 text-center flex items-center justify-center gap-2"
                  >
                    {creatingFolder ? (
                      <>
                        <Loader2 size={12} className="animate-spin" /> PROSES...
                      </>
                    ) : (
                      "BUAT FOLDER"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal (CRITICAL: Required user confirmation!) */}
      <AnimatePresence>
        {showDeleteModal && fileToDelete && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-red-500/20 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-red-500" size={20} />
                  <h3 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-tight">
                    Hapus File Google Drive?
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setFileToDelete(null);
                  }}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 rounded-full transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                <div className="space-y-2">
                  <p className="text-slate-600 dark:text-slate-300 text-xs font-semibold leading-relaxed">
                    Apakah Anda benar-benar yakin ingin menghapus berkas berikut? Tindakan ini akan menghapus berkas langsung dari penyimpanan cloud Google Drive Anda dan tidak dapat dibatalkan.
                  </p>
                  <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-100 dark:border-rose-900/30 flex items-center gap-3">
                    <Trash2 className="text-rose-500" size={18} />
                    <span className="text-xs font-black uppercase text-rose-700 dark:text-rose-400 truncate max-w-[250px]">
                      {fileToDelete.name}
                    </span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setFileToDelete(null);
                    }}
                    className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDeleteFile}
                    disabled={deletingFile}
                    className="flex-1 py-4 font-black text-[10px] uppercase tracking-[0.2em] text-white bg-rose-600 hover:bg-rose-500 rounded-2xl shadow-lg hover:scale-102 active:scale-98 transition-all cursor-pointer border-b-4 border-rose-800 text-center flex items-center justify-center gap-2"
                  >
                    {deletingFile ? (
                      <>
                        <Loader2 size={12} className="animate-spin" /> MENGHAPUS...
                      </>
                    ) : (
                      "HAPUS FILE"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
