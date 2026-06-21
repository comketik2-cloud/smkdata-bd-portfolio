import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";
import postgres from "postgres";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Setup Uploads directory
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Setup Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// Database persistence
const DB_FILE = path.join(process.cwd(), "db.json");

// Supabase Direct PostgreSQL Connection
let connectionString = process.env.SUPABASE_CONNECTION_STRING || "postgresql://postgres:Nusantara45*@db.wpoowpdcjahoxgffemhp.supabase.co:5432/postgres";

// Safeguard against default config values containing placeholders
if (connectionString.includes("[YOUR-PASSWORD]") || connectionString.includes("YOUR-PASSWORD")) {
  const encPassword = encodeURIComponent("Nusantara45*");
  connectionString = connectionString
    .replace("[YOUR-PASSWORD]", encPassword)
    .replace("YOUR-PASSWORD", encPassword);
} else {
  // If the connection string is the raw default one, make sure to encode special characters in the password
  connectionString = connectionString.replace(":Nusantara45*@", `:${encodeURIComponent("Nusantara45*")}@`);
}

let sql: any = null;
let supabaseStatus = {
  connected: false,
  error: null as string | null,
  host: "db.wpoowpdcjahoxgffemhp.supabase.co"
};

try {
  // Safe logging of masked connection string
  const maskedConn = connectionString.replace(/:[^@:]+@/, ":****@");
  console.log(`Initializing Supabase Postgres client with URL: ${maskedConn}`);
  sql = postgres(connectionString, {
    ssl: "require",
    connect_timeout: 10,
  });
} catch (error: any) {
  supabaseStatus.error = error?.message || String(error);
  console.error("Failed to initialize Supabase Postgres client:", error);
}

async function initSupabaseDb() {
  if (!sql) {
    supabaseStatus.error = "Client not initialized";
    return;
  }
  try {
    // Simple test query to confirm credentials are correct
    await sql`SELECT 1`;
    
    await sql`
      CREATE TABLE IF NOT EXISTS app_state (
        key text PRIMARY KEY,
        data jsonb,
        updated_at timestamp with time zone DEFAULT current_timestamp
      )
    `;
    console.log("Supabase: table 'app_state' verified or created.");

    // Create the dedicated app_users table in Supabase for user storage
    await sql`
      CREATE TABLE IF NOT EXISTS app_users (
        id text PRIMARY KEY,
        email text UNIQUE,
        password text,
        name text,
        role text,
        created_at timestamp with time zone DEFAULT current_timestamp
      )
    `;
    console.log("Supabase: table 'app_users' verified or created.");

    // Create the dedicated users table in Supabase for user storage
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id text PRIMARY KEY,
        email text UNIQUE,
        password text,
        name text,
        role text,
        created_at timestamp with time zone DEFAULT current_timestamp
      )
    `;
    console.log("Supabase: table 'users' verified or created.");

    // Seed default roles if not yet existed
    await sql`
      INSERT INTO app_users (id, email, password, name, role)
      VALUES 
        ('usr-admin', 'admin@daruttaqwa.sch.id', 'admin123', 'Administrator BD', 'admin'),
        ('usr-guru', 'guru@daruttaqwa.sch.id', 'guru123', 'Pak Ahmad, S.Pd.', 'guru'),
        ('usr-siswa', 'siswa@daruttaqwa.sch.id', 'siswa123', 'Dwi Prasetyo', 'siswa')
      ON CONFLICT (email) DO NOTHING
    `;
    console.log("Supabase: Default roles seeded in app_users.");

    await sql`
      INSERT INTO users (id, email, password, name, role)
      VALUES 
        ('usr-admin', 'admin@daruttaqwa.sch.id', 'admin123', 'Administrator BD', 'admin'),
        ('usr-guru', 'guru@daruttaqwa.sch.id', 'guru123', 'Pak Ahmad, S.Pd.', 'guru'),
        ('usr-siswa', 'siswa@daruttaqwa.sch.id', 'siswa123', 'Dwi Prasetyo', 'siswa')
      ON CONFLICT (email) DO NOTHING
    `;
    console.log("Supabase: Default roles seeded in users.");

    const rows = await sql`
      SELECT data FROM app_state WHERE key = 'master_state'
    `;

    if (rows.length > 0) {
      console.log("Supabase: Loaded state from Supabase database successfully!");
      db = rows[0].data;
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    } else {
      console.log("Supabase: No master_state found in Supabase. Creating one with current initial memory database...");
      await sql`
        INSERT INTO app_state (key, data, updated_at)
        VALUES ('master_state', ${sql.json(db)}, ${new Date()})
        ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at
      `;
    }
    
    supabaseStatus.connected = true;
    supabaseStatus.error = null;
  } catch (err: any) {
    supabaseStatus.connected = false;
    supabaseStatus.error = err?.message || String(err);
    console.error("Supabase: Connection failed. Using local db.json file as fallback.", err);
  }
}

function loadData() {
  if (fs.existsSync(DB_FILE)) {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  }
  return {
    branding: { name: "BISNIS DIGITAL", logo: null },
    materials: [
      {
        id: "1",
        title: "Pengenalan Bisnis Digital",
        type: "Modul Ajar",
        category: "Bisnis Startup",
        author: "Admin",
        updatedAt: new Date().toISOString(),
        content: "Materi dasar mengenai ekosistem bisnis digital...",
        attachments: []
      }
    ],
    announcements: [],
    teachers: [],
    schedules: [],
    curriculums: [],
    forumPosts: [],
    forumReplies: [],
    agendas: [],
    students: []
  };
}

let db = loadData();

if (!db.ukkProjects) {
  db.ukkProjects = [
    {
      id: "ukk-1",
      title: "Proposal Usaha Boba Drink 'Bubble Joy'",
      studentName: "Dwi Prasetyo",
      class: "XII BD 1",
      category: "Proposal Usaha",
      fileUrl: "",
      fileName: "Proposal_Boba_BubbleJoy.pdf",
      fileType: "PDF",
      externalLink: "https://docs.google.com/document/d/1_example_proposal",
      date: new Date().toISOString(),
      grade: "90",
      feedback: "Sangat baik, rincian biaya HPP sangat rinci dan realistis!"
    },
    {
      id: "ukk-2",
      title: "Video TikTok Campaign Fashion Ramadhan",
      studentName: "Siti Rahmawati",
      class: "XII BD 2",
      category: "Konten Kreatif",
      fileUrl: "",
      fileName: "Tiktok_Fashion_Campaign.mp4",
      fileType: "Video",
      externalLink: "https://www.tiktok.com/@bisnis.digital.smkdt/video/example",
      date: new Date().toISOString(),
      grade: "96",
      feedback: "Pencahayaan studio, intonasi suara, dan call-to-action sangat profesional."
    }
  ];
  saveData();
}

if (!db.profileJurusan) {
  db.profileJurusan = {
    vision: "Menjadi program keahlian Bisnis Digital nomor satu yang menghasilkan asisten pemasar digital religius, kreatif, mandiri, dan handal dengan standar industri nasional.",
    mission: [
      "Menyelenggarakan KBM produktif berbasis industri e-commerce dengan sarana modern terpadu.",
      "Membekali skill digital marketing, copywriting, management marketplace, content video, dan live commerce.",
      "Menumbuhkan mental wirausaha Islami yang berkepribadian luhur, berdisiplin tinggi, dan kolaboratif.",
      "Melibatkan praktisi industri secara berkala guna mendukung kemajuan bakat siswa."
    ],
    about: "Program Keahlian Bisnis Digital di SMK Darut Taqwa Sengonagung Pasuruan mendidik siswa menjadi talenta siap kerja di garis depan ekonomi digital. Kami mengkombinasikan kurikulum nasional dengan materi terapan seperti Search Engine Optimization (SEO), Social Media Marketing (SMM), pengelolaan Toko Online (Shopify, Shopee, TikTok Shop), serta teknik Live Broadcasting Selling.",
    facilities: [
      {
        id: "fac-1",
        name: "Laboratorium Komputer & E-Commerce",
        description: "Dilengkapi dengan komputer Core i5, koneksi internet Gigabit Wifi, dan modul perangkat lunak POS (Point of Sale) untuk praktek kasir digital dan management order.",
        imageUrl: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?q=80&w=600&auto=format&fit=crop"
      },
      {
        id: "fac-2",
        name: "Studio Live Streaming & Broadcast Selling",
        description: "Studio kedap suara dengan ring light, mic condenser pro, kamera mirrorless full HD, serta green screen yang didesain khusus untuk melatih siswa melakukan live selling interaktif.",
        imageUrl: "https://images.unsplash.com/photo-1461151304267-38535e780c79?q=80&w=600&auto=format&fit=crop"
      }
    ],
    documents: [
      {
        id: "doc-profile-1",
        title: "Brosur Interaktif Penerimaan Siswa Baru BD",
        description: "Dokumen brosur digital lengkap berisi program magang, beasiswa, konsentrasi, dan peluang karir lulusan.",
        fileUrl: "/shared/Brosur_Bisnis_Digital.pdf",
        fileName: "Brosur_Bisnis_Digital_SMKDT.pdf"
      },
      {
        id: "doc-profile-2",
        title: "Panduan Kurikulum Merdeka Jurusan Bisnis Digital",
        description: "Struktur materi ajar, daftar kompetensi dasar, kriteria kelulusan, dan peta jalan pembelajaraan.",
        fileUrl: "/shared/Panduan_Kurikulum_BD.pdf",
        fileName: "Panduan_Kurikulum_Merdeka_BD.pdf"
      }
    ]
  };
  saveData();
}

if (!db.documentations || db.documentations.length === 0) {
  db.documentations = [
    {
      id: "doc-1",
      photoUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop",
      origin: "Siswa Kelas XII BD 1",
      description: "UKK Live Selling - Aktivitas pemasaran langsung produk kewirausahaan siswa melalui Tiktok Shop dan Shopee Live secara interaktif.",
      date: new Date().toISOString()
    },
    {
      id: "doc-2",
      photoUrl: "https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?q=80&w=600&auto=format&fit=crop",
      origin: "Guru Produktif Bisnis Digital",
      description: "Kunjungan Industri Jurusan Bisnis Digital ke Inkubator Komunitas UMKM Hebat Pasuruan untuk membedah sistem pergudangan digital dan rantai pasokan.",
      date: new Date().toISOString()
    },
    {
      id: "doc-3",
      photoUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=600&auto=format&fit=crop",
      origin: "Tim Kerja Kelas XI BD",
      description: "Praktikum merancang landing page toko online e-commerce menggunakan Content Management System (CMS) modern berorientasi konversi tinggi.",
      date: new Date().toISOString()
    }
  ];
  saveData();
}

if (!db.users) {
  db.users = [
    { id: "usr-admin", email: "admin@daruttaqwa.sch.id", password: "admin123", name: "Administrator BD", role: "admin" },
    { id: "usr-guru", email: "guru@daruttaqwa.sch.id", password: "guru123", name: "Pak Ahmad, S.Pd.", role: "guru" },
    { id: "usr-siswa", email: "siswa@daruttaqwa.sch.id", password: "siswa123", name: "Dwi Prasetyo", role: "siswa" }
  ];
  saveData();
}

function saveData() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  if (sql) {
    sql`
      INSERT INTO app_state (key, data, updated_at)
      VALUES ('master_state', ${sql.json(db)}, ${new Date()})
      ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at
    `
    .then(() => {
      console.log("Supabase: Successfully synchronized data.");
    })
    .catch((err: any) => {
      console.error("Supabase: Failed to sync data:", err);
    });
  }
}

// Serve uploaded files
app.use("/uploads", express.static(UPLOADS_DIR));

// API Routes
app.get("/api/supabase-status", (req, res) => {
  res.json(supabaseStatus);
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email/NIP/NIS dan kata sandi wajib diisi" });
  }

  // 1. Try Supabase direct queries
  if (sql) {
    try {
      // Try 'users' table first
      let rows = await sql`
        SELECT * FROM users 
        WHERE (email = ${email} OR id = ${email}) AND password = ${password}
      `;
      
      // Fallback to 'app_users' if empty or failed
      if (rows.length === 0) {
        rows = await sql`
          SELECT * FROM app_users 
          WHERE (email = ${email} OR id = ${email}) AND password = ${password}
        `;
      }

      if (rows.length > 0) {
        const found = rows[0];
        if (!role || found.role === role) {
          return res.json({
            user: {
              id: found.id,
              email: found.email,
              name: found.name,
              role: found.role
            }
          });
        }
      }
    } catch (err) {
      console.error("Supabase direct auth check failed, using local fallback list on server side:", err);
    }
  }

  // 2. Local fallback / memory array check
  const foundLocal = db.users?.find(
    (u: any) => 
      (u.email === email || u.id === email) && 
      u.password === password && 
      (!role || u.role === role)
  );

  if (foundLocal) {
    return res.json({
      user: {
        id: foundLocal.id,
        email: foundLocal.email,
        name: foundLocal.name,
        role: foundLocal.role
      }
    });
  }

  return res.status(401).json({ error: "Autentikasi gagal. Akun tidak ditemukan atau kata sandi Anda salah." });
});

app.post("/api/auth/register", async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: "Semua parameter pendaftaran wajib diisi." });
  }

  const id = `usr-${Math.random().toString(36).substring(2, 11)}`;
  
  // Try inserting directly in SQL table
  if (sql) {
    try {
      await sql`
        INSERT INTO app_users (id, email, password, name, role)
        VALUES (${id}, ${email}, ${password}, ${name}, ${role})
      `;
    } catch (err) {
      console.error("Supabase direct user register to app_users failed:", err);
    }
    try {
      await sql`
        INSERT INTO users (id, email, password, name, role)
        VALUES (${id}, ${email}, ${password}, ${name}, ${role})
      `;
    } catch (err) {
      console.error("Supabase direct user register to users failed:", err);
    }
  }

  if (!db.users) db.users = [];
  const exists = db.users.some((u: any) => u.email === email);
  if (exists) {
    return res.status(400).json({ error: "Email ini sudah terdaftar sebelumnya." });
  }

  const newUser = { id, email, password, name, role };
  db.users.push(newUser);
  saveData();

  return res.status(201).json({
    user: { id, email, name, role }
  });
});

app.get("/api/materials", (req, res) => {
  res.json(db.materials);
});

app.post("/api/materials", (req, res) => {
  const newMaterial = {
    id: Math.random().toString(36).substr(2, 9),
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  db.materials.push(newMaterial);
  saveData();
  res.status(201).json(newMaterial);
});

app.put("/api/materials/:id", (req, res) => {
  const { id } = req.params;
  const index = db.materials.findIndex((m: any) => m.id === id);
  if (index !== -1) {
    db.materials[index] = { ...db.materials[index], ...req.body, updatedAt: new Date().toISOString() };
    saveData();
    res.json(db.materials[index]);
  } else {
    res.status(404).json({ error: "Material not found" });
  }
});

app.delete("/api/materials/:id", (req, res) => {
  const { id } = req.params;
  db.materials = db.materials.filter((m: any) => m.id !== id);
  saveData();
  res.status(204).send();
});

// File Upload Endpoint
app.post("/api/upload", upload.array("files"), (req, res) => {
  const files = (req.files as Express.Multer.File[]).map(file => ({
    name: file.originalname,
    url: `/uploads/${file.filename}`,
    type: file.mimetype,
    size: (file.size / (1024 * 1024)).toFixed(2) + " MB"
  }));
  res.json(files);
});

// Branding Routes
app.get("/api/branding", (req, res) => {
  res.json(db.branding);
});

app.post("/api/branding", (req, res) => {
  db.branding = { ...db.branding, ...req.body };
  saveData();
  res.json(db.branding);
});

// Reuse other endpoints with db object
app.get("/api/announcements", (req, res) => res.json(db.announcements));
app.post("/api/announcements", (req, res) => {
  const newAnn = { id: Math.random().toString(36).substr(2, 9), ...req.body, date: new Date().toISOString() };
  db.announcements.push(newAnn);
  saveData();
  res.status(201).json(newAnn);
});
app.put("/api/announcements/:id", (req, res) => {
  const index = db.announcements.findIndex((a: any) => a.id === req.params.id);
  if (index !== -1) { db.announcements[index] = { ...db.announcements[index], ...req.body }; saveData(); res.json(db.announcements[index]); }
  else res.status(404).send("Not found");
});
app.delete("/api/announcements/:id", (req, res) => {
  db.announcements = db.announcements.filter((a: any) => a.id !== req.params.id);
  saveData();
  res.status(204).send();
});

app.get("/api/teachers", (req, res) => res.json(db.teachers));
app.post("/api/teachers", (req, res) => {
  const t = { id: Math.random().toString(36).substr(2, 9), ...req.body };
  db.teachers.push(t);
  saveData();
  res.status(201).json(t);
});
app.put("/api/teachers/:id", (req, res) => {
  const idx = db.teachers.findIndex((t: any) => t.id === req.params.id);
  if (idx !== -1) { db.teachers[idx] = { ...db.teachers[idx], ...req.body }; saveData(); res.json(db.teachers[idx]); }
  else res.status(404).send();
});
app.delete("/api/teachers/:id", (req, res) => {
  db.teachers = db.teachers.filter((t: any) => t.id !== req.params.id);
  saveData();
  res.status(204).send();
});

app.get("/api/schedules", (req, res) => res.json(db.schedules));
app.post("/api/schedules", (req, res) => {
  const s = { id: Math.random().toString(36).substr(2, 9), ...req.body };
  db.schedules.push(s);
  saveData();
  res.status(201).json(s);
});

app.get("/api/students", (req, res) => res.json(db.students));
app.post("/api/students", (req, res) => {
  const s = { id: Math.random().toString(36).substr(2, 9), ...req.body };
  db.students.push(s);
  saveData();
  res.status(201).json(s);
});
app.put("/api/students/:id", (req, res) => {
  const idx = db.students.findIndex((s: any) => s.id === req.params.id);
  if (idx !== -1) {
    db.students[idx] = { ...db.students[idx], ...req.body };
    saveData();
    res.json(db.students[idx]);
  } else {
    res.status(404).send();
  }
});
app.delete("/api/students/:id", (req, res) => {
  db.students = db.students.filter((s: any) => s.id !== req.params.id);
  saveData();
  res.status(204).send();
});

app.get("/api/curriculums", (req, res) => res.json(db.curriculums));
app.post("/api/curriculums", (req, res) => {
  const c = { id: Math.random().toString(36).substr(2, 9), ...req.body };
  db.curriculums.push(c);
  saveData();
  res.status(201).json(c);
});

app.get("/api/forum", (req, res) => res.json(db.forumPosts));
app.post("/api/forum", (req, res) => {
  const p = { id: Math.random().toString(36).substr(2, 9), repliesCount: 0, likes: 0, time: new Date().toISOString(), ...req.body };
  db.forumPosts.unshift(p);
  saveData();
  res.status(201).json(p);
});

app.get("/api/forum/:id/replies", (req, res) => res.json(db.forumReplies.filter((r: any) => r.postId === req.params.id)));
app.post("/api/forum/:id/replies", (req, res) => {
  const r = { id: Math.random().toString(36).substr(2, 9), postId: req.params.id, time: new Date().toISOString(), ...req.body };
  db.forumReplies.push(r);
  const p = db.forumPosts.find((p: any) => p.id === req.params.id);
  if (p) p.repliesCount++;
  saveData();
  res.status(201).json(r);
});

app.get("/api/agendas", (req, res) => res.json(db.agendas));
app.post("/api/agendas", (req, res) => {
  const a = { id: Math.random().toString(36).substr(2, 9), ...req.body };
  db.agendas.push(a);
  saveData();
  res.status(201).json(a);
});
app.put("/api/agendas/:id", (req, res) => {
  const idx = db.agendas.findIndex((a: any) => a.id === req.params.id);
  if (idx !== -1) {
    db.agendas[idx] = { ...db.agendas[idx], ...req.body };
    saveData();
    res.json(db.agendas[idx]);
  } else {
    res.status(404).send("Not found");
  }
});
app.delete("/api/agendas/:id", (req, res) => {
  db.agendas = db.agendas.filter((a: any) => a.id !== req.params.id);
  saveData();
  res.status(204).send();
});

// Documentation Endpoints
app.get("/api/documentations", (req, res) => {
  if (!db.documentations) {
    db.documentations = [];
    saveData();
  }
  res.json(db.documentations);
});

app.post("/api/documentations", (req, res) => {
  if (!db.documentations) {
    db.documentations = [];
  }
  const item = {
    id: Math.random().toString(36).substr(2, 9),
    date: new Date().toISOString(),
    photoUrl: req.body.photoUrl,
    origin: req.body.origin,
    description: req.body.description
  };
  db.documentations.unshift(item);
  saveData();
  res.status(201).json(item);
});

app.delete("/api/documentations/:id", (req, res) => {
  if (db.documentations) {
    db.documentations = db.documentations.filter((doc: any) => doc.id !== req.params.id);
    saveData();
  }
  res.status(204).send();
});

// UKK Jurusan Endpoints
app.get("/api/ukk-projects", (req, res) => {
  if (!db.ukkProjects) {
    db.ukkProjects = [];
    saveData();
  }
  res.json(db.ukkProjects);
});

app.post("/api/ukk-projects", (req, res) => {
  if (!db.ukkProjects) db.ukkProjects = [];
  const project = {
    id: Math.random().toString(36).substr(2, 9),
    date: new Date().toISOString(),
    title: req.body.title,
    studentName: req.body.studentName || "Siswa",
    class: req.body.class || "XII BD",
    category: req.body.category || "Umum",
    fileUrl: req.body.fileUrl || "",
    fileName: req.body.fileName || "",
    fileType: req.body.fileType || "Link",
    externalLink: req.body.externalLink || "",
    grade: req.body.grade || "",
    feedback: req.body.feedback || "",
    academicYear: req.body.academicYear || "2026/2027",
    files: req.body.files || []
  };
  db.ukkProjects.unshift(project);
  saveData();
  res.status(201).json(project);
});

app.put("/api/ukk-projects/:id", (req, res) => {
  if (!db.ukkProjects) db.ukkProjects = [];
  const idx = db.ukkProjects.findIndex((p: any) => p.id === req.params.id);
  if (idx !== -1) {
    db.ukkProjects[idx] = { ...db.ukkProjects[idx], ...req.body };
    saveData();
    res.json(db.ukkProjects[idx]);
  } else {
    res.status(404).send("Not found");
  }
});

app.delete("/api/ukk-projects/:id", (req, res) => {
  if (db.ukkProjects) {
    db.ukkProjects = db.ukkProjects.filter((p: any) => p.id !== req.params.id);
    saveData();
  }
  res.status(204).send();
});

// Profile Jurusan Endpoints
app.get("/api/profile-jurusan", (req, res) => {
  res.json(db.profileJurusan);
});

app.post("/api/profile-jurusan", (req, res) => {
  db.profileJurusan = { ...db.profileJurusan, ...req.body };
  saveData();
  res.json(db.profileJurusan);
});

// AI Chatbot
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const prompt = `Anda adalah asisten AI untuk Jurusan Bisnis Digital di SMK Darut Taqwa. Bantu siswa dan guru dengan pertanyaan seputar Bisnis Digital. User: ${message}`;
    const result = await ai.models.generateContent({ model: "gemini-3.5-flash", contents: prompt });
    res.json({ text: result.text || "Maaf, saya tidak dapat menjawab saat ini." });
  } catch (error) { res.status(500).json({ error: "AI Error" }); }
});

// Vite Middleware
async function startServer() {
  await initSupabaseDb();
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
  app.listen(PORT, "0.0.0.0", () => console.log(`Server running at http://localhost:${PORT}`));
}

startServer();

