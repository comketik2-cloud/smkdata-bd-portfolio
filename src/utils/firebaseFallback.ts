/**
 * Firebase Client-Side Fallback Engine
 * Automatically intercepts all backend '/api/*' calls and redirects them to the Firestore Cloud REST API
 * when deployed onto serverless static platforms (like Cloudflare Pages or Github Pages).
 * Supports the entire CRUD surface, file uploads (via persistent Base64), and AI-Chat queries.
 */

const API_KEY = "AIzaSyAG2iqnBYdGYSCAyr1EnIvG_XVMet2kPXM";
const PROJECT_ID = "portfolio-bd-500115";
const FL_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/app_state/master_state?key=${API_KEY}`;
const FL_PATCH_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/app_state/master_state?updateMask.fieldPaths=dataString&updateMask.fieldPaths=updated_at&key=${API_KEY}`;

let localDb: any = null;
let initPromise: Promise<any> | null = null;

// File-level bound original fetch reference to bypass interceptor and avoid "Illegal invocation" errors!
const originalFetch = (
  typeof window !== "undefined" && window.fetch ? window.fetch : 
  typeof globalThis !== "undefined" && globalThis.fetch ? globalThis.fetch : 
  fetch
).bind(typeof window !== "undefined" ? window : globalThis);

// Initialize state from Firestore REST API
async function ensureDbInitialized() {
  if (localDb) return localDb;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    let loadedFromCloud = false;
    let fallbackTemplate = {
      branding: { name: "BISNIS DIGITAL", logo: null },
      materials: [
        {
          id: "1",
          title: "Pengenalan Bisnis Digital dan E-Commerce",
          type: "Modul Ajar",
          category: "Bisnis Startup",
          author: "Admin Program",
          updatedAt: new Date().toISOString(),
          content: "Materi dasar mengenai ekosistem bisnis digital, mencakup Social Media Marketing (SMM), Search Engine Optimization (SEO), dan manajemen Marketplace.",
          attachments: []
        }
      ],
      announcements: [
        {
          id: "ann-1",
          title: "Pelaksanaan UKK Produktif Bisnis Digital 2026",
          content: "Diberitahukan kepada seluruh siswa kelas XII bahwa Ujian Kompetensi Keahlian (UKK) Live Selling akan dilaksanakan minggu depan.",
          date: new Date().toISOString()
        }
      ],
      teachers: [],
      schedules: [],
      curriculums: [],
      forumPosts: [],
      forumReplies: [],
      agendas: [],
      students: [],
      ukkProjects: [],
      documentations: [],
      users: [
        { id: "usr-admin", email: "admin@daruttaqwa.sch.id", password: "admin123", name: "Administrator BD", role: "admin" },
        { id: "usr-guru", email: "guru@daruttaqwa.sch.id", password: "guru123", name: "Pak Ahmad, S.Pd.", role: "guru" },
        { id: "usr-siswa", email: "siswa@daruttaqwa.sch.id", password: "siswa123", name: "Dwi Prasetyo", role: "siswa" }
      ],
      profileJurusan: {
        vision: "Menjadi program keahlian Bisnis Digital nomor satu yang menghasilkan asisten pemasar digital religius, kreatif, mandiri, dan handal dengan standar industri nasional.",
        mission: [
          "Menyelenggarakan KBM produktif berbasis industri e-commerce dengan sarana modern terpadu.",
          "Membekali skill digital marketing, copywriting, management marketplace, content video, dan live commerce.",
          "Menumbuhkan mental wirausaha Islami yang berkepribadian luhur, berdisiplin tinggi, dan kolaboratif.",
          "Melibatkan praktisi industri secara berkala guna mendukung kemajuan bakat siswa."
        ],
        about: "Program Keahlian Bisnis Digital di SMK Darut Taqwa Sengonagung Pasuruan mendidik siswa menjadi talenta siap kerja di garis depan ekonomi digital.",
        facilities: [
          {
            id: "fac-1",
            name: "Laboratorium Komputer & E-Commerce",
            description: "Dilengkapi dengan komputer Core i5, koneksi internet Gigabit Wifi, dan modul perangkat lunak POS untuk praktek kasir digital.",
            imageUrl: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?q=80&w=600&auto=format&fit=crop"
          }
        ],
        documents: []
      }
    };

    try {
      const res = await originalFetch(FL_URL);
      if (res.ok) {
        const docData = await res.json();
        const dataString = docData?.fields?.dataString?.stringValue;
        if (dataString) {
          localDb = JSON.parse(dataString);
          console.log("Firebase Fallback: Loaded state from Firestore cloud successfully.");
          try {
            localStorage.setItem("smkdata_db_cache", dataString);
          } catch (_) {}
          loadedFromCloud = true;
          return localDb;
        }
      } else if (res.status === 404) {
        console.warn("Firebase Fallback: Firestore document 404 not found. Creating brand new master state...");
        localDb = fallbackTemplate;
        try {
          await originalFetch(FL_PATCH_URL, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              fields: {
                dataString: {
                  stringValue: JSON.stringify(localDb)
                },
                updated_at: {
                  stringValue: new Date().toISOString()
                }
              }
            })
          });
          console.log("Firebase Fallback: Seeding initial database completed.");
        } catch (saveErr) {
          console.error("Firebase Fallback: Failed to write initial state:", saveErr);
        }
        return localDb;
      } else {
        console.warn(`Firebase Fallback: Firestore REST returned status ${res.status}. We WILL NOT overwrite the cloud data. Using cache fallbacks.`);
        try {
          const errText = await res.text();
          console.warn(`Firebase Fallback: Firestore REST error details:`, errText);
        } catch (_) {}
      }
    } catch (err) {
      console.error("Firebase Fallback: Failed to fetch state from Firestore REST (network/CORS/exception). We WILL NOT overwrite the cloud data.", err);
    }

    // Try to load from localStorage cache as a recovery fallback to avoid blank screen/data loss
    try {
      const cached = localStorage.getItem("smkdata_db_cache");
      if (cached) {
        localDb = JSON.parse(cached);
        console.log("Firebase Fallback: Recovered state from localStorage cache successfully!");
        return localDb;
      }
    } catch (_) {}

    // If no cache exists, use the fallback template locally, but mark it as transient-only so we never save it to the cloud and ruin existing data!
    console.warn("Firebase Fallback: No localStorage cache found. Running with local-only in-memory database to prevent overwrites.");
    localDb = fallbackTemplate;
    localDb.__transientOnly = true;

    return localDb;
  })();

  return initPromise;
}

// Sync back to Firestore (debounced/background)
async function saveDbToCloud() {
  if (!localDb) return;
  
  if (localDb.__transientOnly) {
    console.warn("Firebase Fallback: Sync blocked because the database is in transient-only fallback mode (to protect existing cloud data).");
    return;
  }

  // Always save to localStorage cache as well for offline/load resilience
  try {
    localStorage.setItem("smkdata_db_cache", JSON.stringify(localDb));
  } catch (_) {}

  try {
    await originalFetch(FL_PATCH_URL, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fields: {
          dataString: {
            stringValue: JSON.stringify(localDb)
          },
          updated_at: {
            stringValue: new Date().toISOString()
          }
        }
      })
    });
    console.log("Firebase Fallback: Local database state synced to Firestore cloud.");
  } catch (err) {
    console.error("Firebase Fallback: Sync to Firestore cloud failed:", err);
  }
}

// Initialize Global Fetch Interception
export function setupFirebaseFallback() {
  // Detect whether we should force clientless fallback mode:
  // Active on non-local, non-studio preview domains (such as pages.dev, github.io)
  const isLocalOrDevelopment = 
    window.location.hostname.includes("localhost") || 
    window.location.hostname.includes("127.0.0.1") || 
    window.location.hostname.includes(".run.app");

  const isCloudflareBuild = 
    !isLocalOrDevelopment ||
    window.location.hostname.includes("pages.dev") || 
    window.location.hostname.includes("github.io") || 
    window.location.hostname.includes("vercel.app") ||
    window.location.hostname.includes("netlify.app") ||
    window.location.search.includes("firebase=true") ||
    window.location.search.includes("supabase=true");

  console.log(`Firebase Fallback: Environment Detection -> Is serverless static target: ${isCloudflareBuild}`);

  const interceptedFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlStr = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    // We only intercept calls going to local '/api/'
    if (urlStr.startsWith("/api/") || urlStr.includes("/api/")) {
      const apiPath = urlStr.substring(urlStr.indexOf("/api/") + 5);
      const method = init?.method?.toUpperCase() || "GET";

      if (!isCloudflareBuild) {
        try {
          const res = await originalFetch(input, init);
          const contentType = res.headers.get("content-type") || "";
          
          if (res.status !== 404 && res.status !== 502 && !contentType.includes("text/html")) {
            return res;
          }
          console.warn(`Firebase Fallback: Native API /api/${apiPath} returned ${res.status}. Diverting to Firebase Fallback.`);
        } catch (fetchErr) {
          console.warn(`Firebase Fallback: Native API /api/${apiPath} is unreachable. Diverting to Firebase Fallback.`, fetchErr);
        }
      }

      // Intercept Routes & Execute Client-Side Actions
      try {
        await ensureDbInitialized();

        // Status Endpoints
        if (apiPath === "supabase-status" || apiPath === "firebase-status") {
          return new Response(JSON.stringify({ 
            connected: true, 
            host: `${PROJECT_ID}.firebaseapp.com`,
            projectId: PROJECT_ID
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }

        // Auth Login & Register Endpoints
        if (apiPath === "auth/login") {
          const body = JSON.parse(init?.body as string);
          const { email, password, role } = body || {};
          if (!email || !password) {
            return new Response(JSON.stringify({ error: "Email/NIP/NIS and password are required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (!localDb.users) {
            localDb.users = [
              { id: "usr-admin", email: "admin@daruttaqwa.sch.id", password: "admin123", name: "Administrator BD", role: "admin" },
              { id: "usr-guru", email: "guru@daruttaqwa.sch.id", password: "guru123", name: "Pak Ahmad, S.Pd.", role: "guru" },
              { id: "usr-siswa", email: "siswa@daruttaqwa.sch.id", password: "siswa123", name: "Dwi Prasetyo", role: "siswa" }
            ];
            saveDbToCloud();
          }
          const found = localDb.users.find(
            (u: any) => 
              (u.email === email || u.id === email) && 
              u.password === password && 
              (!role || u.role === role)
          );
          if (found) {
            return new Response(JSON.stringify({
              user: {
                id: found.id,
                email: found.email,
                name: found.name,
                role: found.role
              }
            }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            });
          }
          return new Response(JSON.stringify({ error: "Akun tidak ditemukan atau kata sandi salah." }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
          });
        }

        if (apiPath === "auth/register") {
          const body = JSON.parse(init?.body as string);
          const { email, password, name, role } = body || {};
          if (!email || !password || !name || !role) {
            return new Response(JSON.stringify({ error: "Semua parameter wajib diisi." }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          if (!localDb.users) localDb.users = [];
          const exists = localDb.users.some((u: any) => u.email === email);
          if (exists) {
            return new Response(JSON.stringify({ error: "Email ini telah terdaftar." }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }
          const newUser = {
            id: `usr-${Math.random().toString(36).substring(2, 11)}`,
            email,
            password,
            name,
            role
          };
          localDb.users.push(newUser);
          saveDbToCloud();
          return new Response(JSON.stringify({
            user: {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
              role: newUser.role
            }
          }), {
            status: 201,
            headers: { "Content-Type": "application/json" }
          });
        }

        // Branding
        if (apiPath === "branding") {
          if (method === "POST") {
            const body = JSON.parse(init?.body as string);
            localDb.branding = { ...localDb.branding, ...body };
            saveDbToCloud();
            return new Response(JSON.stringify(localDb.branding), { status: 200, headers: { "Content-Type": "application/json" } });
          }
          return new Response(JSON.stringify(localDb.branding || { name: "BISNIS DIGITAL", logo: null }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }

        // Materials
        if (apiPath.startsWith("materials")) {
          const subPath = apiPath.substring(9);
          if (method === "GET") {
            return new Response(JSON.stringify(localDb.materials || []), { status: 200, headers: { "Content-Type": "application/json" } });
          }
          if (method === "POST") {
            const body = JSON.parse(init?.body as string);
            const newItem = { id: Math.random().toString(36).substring(2, 11), updatedAt: new Date().toISOString(), ...body };
            if (!localDb.materials) localDb.materials = [];
            localDb.materials.push(newItem);
            saveDbToCloud();
            return new Response(JSON.stringify(newItem), { status: 201, headers: { "Content-Type": "application/json" } });
          }
          if (method === "PUT") {
            const id = subPath.replace("/", "");
            const body = JSON.parse(init?.body as string);
            const index = localDb.materials?.findIndex((m: any) => m.id === id);
            if (index !== -1 && index !== undefined) {
              localDb.materials[index] = { ...localDb.materials[index], ...body, updatedAt: new Date().toISOString() };
              saveDbToCloud();
              return new Response(JSON.stringify(localDb.materials[index]), { status: 200, headers: { "Content-Type": "application/json" } });
            }
          }
          if (method === "DELETE") {
            const id = subPath.replace("/", "");
            localDb.materials = (localDb.materials || []).filter((m: any) => m.id !== id);
            saveDbToCloud();
            return new Response(null, { status: 204 });
          }
        }

        // Announcements
        if (apiPath.startsWith("announcements")) {
          const subPath = apiPath.substring(13);
          if (method === "GET") {
            return new Response(JSON.stringify(localDb.announcements || []), { status: 200, headers: { "Content-Type": "application/json" } });
          }
          if (method === "POST") {
            const body = JSON.parse(init?.body as string);
            const newItem = { id: Math.random().toString(36).substring(2, 11), date: new Date().toISOString(), ...body };
            if (!localDb.announcements) localDb.announcements = [];
            localDb.announcements.push(newItem);
            saveDbToCloud();
            return new Response(JSON.stringify(newItem), { status: 201, headers: { "Content-Type": "application/json" } });
          }
          if (method === "PUT") {
            const id = subPath.replace("/", "");
            const body = JSON.parse(init?.body as string);
            const index = localDb.announcements?.findIndex((a: any) => a.id === id);
            if (index !== -1 && index !== undefined) {
              localDb.announcements[index] = { ...localDb.announcements[index], ...body };
              saveDbToCloud();
              return new Response(JSON.stringify(localDb.announcements[index]), { status: 200, headers: { "Content-Type": "application/json" } });
            }
          }
          if (method === "DELETE") {
            const id = subPath.replace("/", "");
            localDb.announcements = (localDb.announcements || []).filter((a: any) => a.id !== id);
            saveDbToCloud();
            return new Response(null, { status: 204 });
          }
        }

        // Agendas
        if (apiPath.startsWith("agendas")) {
          const subPath = apiPath.substring(7);
          if (method === "GET") {
            return new Response(JSON.stringify(localDb.agendas || []), { status: 200, headers: { "Content-Type": "application/json" } });
          }
          if (method === "POST") {
            const body = JSON.parse(init?.body as string);
            const newItem = { id: Math.random().toString(36).substring(2, 11), ...body };
            if (!localDb.agendas) localDb.agendas = [];
            localDb.agendas.push(newItem);
            saveDbToCloud();
            return new Response(JSON.stringify(newItem), { status: 201, headers: { "Content-Type": "application/json" } });
          }
          if (method === "PUT") {
            const id = subPath.replace("/", "");
            const body = JSON.parse(init?.body as string);
            const index = localDb.agendas?.findIndex((a: any) => a.id === id);
            if (index !== -1 && index !== undefined) {
              localDb.agendas[index] = { ...localDb.agendas[index], ...body };
              saveDbToCloud();
              return new Response(JSON.stringify(localDb.agendas[index]), { status: 200, headers: { "Content-Type": "application/json" } });
            }
          }
          if (method === "DELETE") {
            const id = subPath.replace("/", "");
            localDb.agendas = (localDb.agendas || []).filter((a: any) => a.id !== id);
            saveDbToCloud();
            return new Response(null, { status: 204 });
          }
        }

        // Teachers
        if (apiPath.startsWith("teachers")) {
          const subPath = apiPath.substring(8);
          if (method === "GET") {
            return new Response(JSON.stringify(localDb.teachers || []), { status: 200, headers: { "Content-Type": "application/json" } });
          }
          if (method === "POST") {
            const body = JSON.parse(init?.body as string);
            const newItem = { id: Math.random().toString(36).substring(2, 11), ...body };
            if (!localDb.teachers) localDb.teachers = [];
            localDb.teachers.push(newItem);
            saveDbToCloud();
            return new Response(JSON.stringify(newItem), { status: 201, headers: { "Content-Type": "application/json" } });
          }
          if (method === "PUT") {
            const id = subPath.replace("/", "");
            const body = JSON.parse(init?.body as string);
            const index = localDb.teachers?.findIndex((t: any) => t.id === id);
            if (index !== -1 && index !== undefined) {
              localDb.teachers[index] = { ...localDb.teachers[index], ...body };
              saveDbToCloud();
              return new Response(JSON.stringify(localDb.teachers[index]), { status: 200, headers: { "Content-Type": "application/json" } });
            }
          }
          if (method === "DELETE") {
            const id = subPath.replace("/", "");
            localDb.teachers = (localDb.teachers || []).filter((t: any) => t.id !== id);
            saveDbToCloud();
            return new Response(null, { status: 204 });
          }
        }

        // Students
        if (apiPath.startsWith("students")) {
          const subPath = apiPath.substring(8);
          if (method === "GET") {
            return new Response(JSON.stringify(localDb.students || []), { status: 200, headers: { "Content-Type": "application/json" } });
          }
          if (method === "POST") {
            const body = JSON.parse(init?.body as string);
            const newItem = { id: Math.random().toString(36).substring(2, 11), ...body };
            if (!localDb.students) localDb.students = [];
            localDb.students.push(newItem);
            saveDbToCloud();
            return new Response(JSON.stringify(newItem), { status: 201, headers: { "Content-Type": "application/json" } });
          }
          if (method === "PUT") {
            const id = subPath.replace("/", "");
            const body = JSON.parse(init?.body as string);
            const index = localDb.students?.findIndex((s: any) => s.id === id);
            if (index !== -1 && index !== undefined) {
              localDb.students[index] = { ...localDb.students[index], ...body };
              saveDbToCloud();
              return new Response(JSON.stringify(localDb.students[index]), { status: 200, headers: { "Content-Type": "application/json" } });
            }
          }
          if (method === "DELETE") {
            const id = subPath.replace("/", "");
            localDb.students = (localDb.students || []).filter((s: any) => s.id !== id);
            saveDbToCloud();
            return new Response(null, { status: 204 });
          }
        }

        // Schedules
        if (apiPath.startsWith("schedules")) {
          const subPath = apiPath.substring(9);
          if (method === "GET") {
            return new Response(JSON.stringify(localDb.schedules || []), { status: 200, headers: { "Content-Type": "application/json" } });
          }
          if (method === "POST") {
            const body = JSON.parse(init?.body as string);
            const newItem = { id: Math.random().toString(36).substring(2, 11), ...body };
            if (!localDb.schedules) localDb.schedules = [];
            localDb.schedules.push(newItem);
            saveDbToCloud();
            return new Response(JSON.stringify(newItem), { status: 201, headers: { "Content-Type": "application/json" } });
          }
          if (method === "PUT") {
            const id = subPath.replace("/", "");
            const body = JSON.parse(init?.body as string);
            const index = localDb.schedules?.findIndex((s: any) => s.id === id);
            if (index !== -1 && index !== undefined) {
              localDb.schedules[index] = { ...localDb.schedules[index], ...body };
              saveDbToCloud();
              return new Response(JSON.stringify(localDb.schedules[index]), { status: 200, headers: { "Content-Type": "application/json" } });
            }
          }
          if (method === "DELETE") {
            const id = subPath.replace("/", "");
            localDb.schedules = (localDb.schedules || []).filter((s: any) => s.id !== id);
            saveDbToCloud();
            return new Response(null, { status: 204 });
          }
        }

        // Curriculums
        if (apiPath.startsWith("curriculums")) {
          const subPath = apiPath.substring(11);
          if (method === "GET") {
            return new Response(JSON.stringify(localDb.curriculums || []), { status: 200, headers: { "Content-Type": "application/json" } });
          }
          if (method === "POST") {
            const body = JSON.parse(init?.body as string);
            const newItem = { id: Math.random().toString(36).substring(2, 11), ...body };
            if (!localDb.curriculums) localDb.curriculums = [];
            localDb.curriculums.push(newItem);
            saveDbToCloud();
            return new Response(JSON.stringify(newItem), { status: 201, headers: { "Content-Type": "application/json" } });
          }
          if (method === "PUT") {
            const id = subPath.replace("/", "");
            const body = JSON.parse(init?.body as string);
            const index = localDb.curriculums?.findIndex((c: any) => c.id === id);
            if (index !== -1 && index !== undefined) {
              localDb.curriculums[index] = { ...localDb.curriculums[index], ...body };
              saveDbToCloud();
              return new Response(JSON.stringify(localDb.curriculums[index]), { status: 200, headers: { "Content-Type": "application/json" } });
            }
          }
          if (method === "DELETE") {
            const id = subPath.replace("/", "");
            localDb.curriculums = (localDb.curriculums || []).filter((c: any) => c.id !== id);
            saveDbToCloud();
            return new Response(null, { status: 204 });
          }
        }

        // Forum
        if (apiPath.startsWith("forum")) {
          const subPath = apiPath.substring(5);
          
          if (subPath.endsWith("/like") && method === "POST") {
            const id = subPath.replace("/", "").replace("/like", "");
            const index = localDb.forumPosts?.findIndex((p: any) => p.id === id);
            if (index !== -1 && index !== undefined) {
              localDb.forumPosts[index].likes = (localDb.forumPosts[index].likes || 0) + 1;
              saveDbToCloud();
              return new Response(JSON.stringify(localDb.forumPosts[index]), { status: 200, headers: { "Content-Type": "application/json" } });
            }
          }

          if (subPath.includes("/replies")) {
            const id = subPath.split("/")[1];
            if (method === "GET") {
              const replies = (localDb.forumReplies || []).filter((r: any) => r.postId === id);
              return new Response(JSON.stringify(replies), { status: 200, headers: { "Content-Type": "application/json" } });
            }
            if (method === "POST") {
              const body = JSON.parse(init?.body as string);
              const newItem = { id: Math.random().toString(36).substring(2, 11), postId: id, time: new Date().toISOString(), ...body };
              if (!localDb.forumReplies) localDb.forumReplies = [];
              localDb.forumReplies.push(newItem);
              
              const postIdx = localDb.forumPosts?.findIndex((p: any) => p.id === id);
              if (postIdx !== -1 && postIdx !== undefined) {
                localDb.forumPosts[postIdx].repliesCount = (localDb.forumPosts[postIdx].repliesCount || 0) + 1;
              }
              saveDbToCloud();
              return new Response(JSON.stringify(newItem), { status: 201, headers: { "Content-Type": "application/json" } });
            }
          }

          if (method === "GET") {
            return new Response(JSON.stringify(localDb.forumPosts || []), { status: 200, headers: { "Content-Type": "application/json" } });
          }
          if (method === "POST") {
            const body = JSON.parse(init?.body as string);
            const newItem = { id: Math.random().toString(36).substring(2, 11), repliesCount: 0, likes: 0, time: new Date().toISOString(), ...body };
            if (!localDb.forumPosts) localDb.forumPosts = [];
            localDb.forumPosts.unshift(newItem);
            saveDbToCloud();
            return new Response(JSON.stringify(newItem), { status: 201, headers: { "Content-Type": "application/json" } });
          }
          if (method === "PUT") {
            const id = subPath.replace("/", "");
            const body = JSON.parse(init?.body as string);
            const index = localDb.forumPosts?.findIndex((p: any) => p.id === id);
            if (index !== -1 && index !== undefined) {
              localDb.forumPosts[index] = { ...localDb.forumPosts[index], ...body };
              saveDbToCloud();
              return new Response(JSON.stringify(localDb.forumPosts[index]), { status: 200, headers: { "Content-Type": "application/json" } });
            }
          }
          if (method === "DELETE") {
            const id = subPath.replace("/", "");
            localDb.forumPosts = (localDb.forumPosts || []).filter((p: any) => p.id !== id);
            localDb.forumReplies = (localDb.forumReplies || []).filter((r: any) => r.postId !== id);
            saveDbToCloud();
            return new Response(null, { status: 204 });
          }
        }

        // Documentations
        if (apiPath.startsWith("documentations")) {
          const subPath = apiPath.substring(14);
          if (method === "GET") {
            return new Response(JSON.stringify(localDb.documentations || []), { status: 200, headers: { "Content-Type": "application/json" } });
          }
          if (method === "POST") {
            const body = JSON.parse(init?.body as string);
            const newItem = { id: Math.random().toString(36).substring(2, 11), date: new Date().toISOString(), ...body };
            if (!localDb.documentations) localDb.documentations = [];
            localDb.documentations.unshift(newItem);
            saveDbToCloud();
            return new Response(JSON.stringify(newItem), { status: 201, headers: { "Content-Type": "application/json" } });
          }
          if (method === "DELETE") {
            const id = subPath.replace("/", "");
            localDb.documentations = (localDb.documentations || []).filter((d: any) => d.id !== id);
            saveDbToCloud();
            return new Response(null, { status: 204 });
          }
        }

        // Ukk Projects
        if (apiPath.startsWith("ukk-projects")) {
          const subPath = apiPath.substring(12);
          if (method === "GET") {
            return new Response(JSON.stringify(localDb.ukkProjects || []), { status: 200, headers: { "Content-Type": "application/json" } });
          }
          if (method === "POST") {
            const body = JSON.parse(init?.body as string);
            const newItem = {
              id: Math.random().toString(36).substring(2, 11),
              date: new Date().toISOString(),
              title: body.title,
              studentName: body.studentName || "Siswa",
              class: body.class || "XII BD",
              category: body.category || "Umum",
              fileUrl: body.fileUrl || "",
              fileName: body.fileName || "",
              fileType: body.fileType || "Link",
              externalLink: body.externalLink || "",
              grade: body.grade || "",
              feedback: body.feedback || "",
              academicYear: body.academicYear || "2026/2027",
              files: body.files || []
            };
            if (!localDb.ukkProjects) localDb.ukkProjects = [];
            localDb.ukkProjects.unshift(newItem);
            saveDbToCloud();
            return new Response(JSON.stringify(newItem), { status: 201, headers: { "Content-Type": "application/json" } });
          }
          if (method === "PUT") {
            const id = subPath.replace("/", "");
            const body = JSON.parse(init?.body as string);
            const index = localDb.ukkProjects?.findIndex((p: any) => p.id === id);
            if (index !== -1 && index !== undefined) {
              localDb.ukkProjects[index] = { ...localDb.ukkProjects[index], ...body };
              saveDbToCloud();
              return new Response(JSON.stringify(localDb.ukkProjects[index]), { status: 200, headers: { "Content-Type": "application/json" } });
            }
          }
          if (method === "DELETE") {
            const id = subPath.replace("/", "");
            localDb.ukkProjects = (localDb.ukkProjects || []).filter((p: any) => p.id !== id);
            saveDbToCloud();
            return new Response(null, { status: 204 });
          }
        }

        // Profile Jurusan
        if (apiPath.startsWith("profile-jurusan")) {
          if (method === "GET") {
            return new Response(JSON.stringify(localDb.profileJurusan || {}), { status: 200, headers: { "Content-Type": "application/json" } });
          }
          if (method === "POST") {
            const body = JSON.parse(init?.body as string);
            localDb.profileJurusan = { ...localDb.profileJurusan, ...body };
            saveDbToCloud();
            return new Response(JSON.stringify(localDb.profileJurusan), { status: 200, headers: { "Content-Type": "application/json" } });
          }
        }

        // AI Chat
        if (apiPath === "chat") {
          const body = JSON.parse(init?.body as string);
          const textMsg = body?.message || "";
          
          let aiResponse = `Terima kasih atas pertanyaan Anda tentang Bisnis Digital di SMK Darut Taqwa Sengonagung. `;
          
          if (textMsg.toLowerCase().includes("materi") || textMsg.toLowerCase().includes("belajar") || textMsg.toLowerCase().includes("pelajaran")) {
            aiResponse += "Kami mempelajari materi terapan berorientasi industri digital marketing. Mulai dari Social Media Marketing (pemasaran TikTok, Instagram), Search Engine Optimization (SEO), manajemen store di Shopee/Tokopedia, Copywriting konversi tinggi, hingga pembuatan Landing Page dan pengelolaan Live Broadcast Selling di studio modern kami.";
          } else if (textMsg.toLowerCase().includes("ukk") || textMsg.toLowerCase().includes("boba") || textMsg.toLowerCase().includes("praktikum")) {
            aiResponse += "Kegiatan UKK (Ujian Kompetensi Keahlian) di jurusan Bisnis Digital bersifat sangat produktif dan riil. Siswa melakukan praktek Live Selling memasarkan produk wirausahaan buatan sendiri, merancang proposal kelayakan bisnis (seperti Bubble Joy), serta membuat video campaign kreatif berkonversi penjualan tinggi.";
          } else if (textMsg.toLowerCase().includes("daftar") || textMsg.toLowerCase().includes("syarat") || textMsg.toLowerCase().includes("masuk") || textMsg.toLowerCase().includes("biaya")) {
            aiResponse += "Pendaftaran siswa baru program keahlian Bisnis Digital dapat diakses secara online melalui portal administrasi sekolah atau langsung berkunjung ke Sekretariat PPDB SMK Darut Taqwa. Anda juga bisa mengunduh brosur digital lengkap kami di menu 'Profil Jurusan' pada portal ini.";
          } else if (textMsg.toLowerCase().includes("guru") || textMsg.toLowerCase().includes("pengajar")) {
            aiResponse += "Staf pengajar kami terdiri dari guru produktif tersertifikasiBNSP serta praktisi pengusaha e-commerce nasional yang diundang secara berskala melalui program kelas industri terpadu.";
          } else {
            aiResponse += "Sebagai program keahlian modern unggulan, Bisnis Digital membekali siswa dengan kompetensi digital marketing terlengkap (Copywriting, SEO, Live Streaming, Marketplace). Apakah ada informasi spesifik mengenai kurikulum, studio live streaming, pendaftaran siswa baru, atau detail materi pembelajaran tertentu yang ingin Anda tanyakan?";
          }
          
          return new Response(JSON.stringify({ text: aiResponse }), { status: 200, headers: { "Content-Type": "application/json" } });
        }

        // File/Media Uploads - Base64 Conversion Fallback (No storage server needed!)
        if (apiPath === "upload" && method === "POST") {
          const formData = (init as any)?.body;
          if (formData instanceof FormData) {
            const files: any[] = [];
            const formFiles = formData.getAll("files") as File[];
            for (const file of formFiles) {
              const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
              });
              files.push({
                name: file.name,
                url: base64,
                type: file.type,
                size: (file.size / (1024 * 1024)).toFixed(2) + " MB"
              });
            }
            return new Response(JSON.stringify(files), { status: 200, headers: { "Content-Type": "application/json" } });
          }
        }
      } catch (err: any) {
        console.error("Firebase Fallback: Endpoint handling failed:", err);
        return new Response(JSON.stringify({ error: err?.message || String(err) }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Default response of 404 if API was unhandled
      return new Response(JSON.stringify({ error: `Not handled: ${apiPath}` }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    return originalFetch(input, init);
  };

  try {
    Object.defineProperty(window, "fetch", {
      value: interceptedFetch,
      writable: true,
      configurable: true,
      enumerable: true
    });
  } catch (e) {
    console.warn("Firebase Fallback: Failed to define fetch on window, falling back to direct assignment", e);
    try {
      (window as any).fetch = interceptedFetch;
    } catch (err2) {
      console.error("Firebase Fallback: Failed to set fetch on window", err2);
    }
  }

  try {
    Object.defineProperty(globalThis, "fetch", {
      value: interceptedFetch,
      writable: true,
      configurable: true,
      enumerable: true
    });
  } catch (e) {
    console.warn("Firebase Fallback: Failed to define fetch on globalThis", e);
  }
}
