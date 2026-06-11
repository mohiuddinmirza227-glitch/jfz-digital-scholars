import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, initializeFirestore, doc, getDoc, setDoc } from "firebase/firestore";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ limit: "200mb", extended: true }));

// Helper to resolve writable database path in local and Serverless/Vercel setups
function getDbPath(): string {
  const isVercel = process.env.VERCEL === "1";
  if (!isVercel) {
    return path.join(process.cwd(), "db.json");
  }
  const tmpPath = "/tmp/db.json";
  try {
    if (!fs.existsSync(tmpPath)) {
      const srcPath = path.join(process.cwd(), "db.json");
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, tmpPath);
        console.log("Successfully copied db.json to writable /tmp storage.");
      } else {
        // Fallback write
        fs.writeFileSync(tmpPath, "{}", "utf-8");
      }
    }
  } catch (err) {
    console.warn("Could not copy db.json to /tmp fallback:", err);
  }
  return tmpPath;
}

// Resolve db.json path
const DB_PATH = getDbPath();

// Read and parse Firebase config safely
let firestoreDb: any = null;
try {
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(firebaseConfigPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    const isVercel = process.env.VERCEL === "1";
    if (isVercel) {
      firestoreDb = initializeFirestore(firebaseApp, {
        experimentalAutoDetectLongPolling: true
      }, firebaseConfig.firestoreDatabaseId);
    } else {
      firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    }
    console.log("Firebase initialized successfully on backend server with database ID:", firebaseConfig.firestoreDatabaseId);
  } else {
    console.warn("firebase-applet-config.json not found. Operating in local-fallback mode.");
  }
} catch (err) {
  console.error("Failed to initialize Firebase on backend server:", err);
}

// Helper to resolve writable directory for PDFs in local and Serverless/Vercel setups
function getPdfDir(): string {
  const isVercel = process.env.VERCEL === "1";
  const pdfDir = isVercel ? "/tmp/pdfs" : path.join(process.cwd(), "assets", "pdfs");
  try {
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }
  } catch (err) {
    console.warn("PDF directory creation warning:", err);
  }
  return pdfDir;
}


// Define a robust default database state matching all PRD requirements
const defaultDb = {
  appName: "JFZ Digital Scholars",
  logoText: "JFZ Scholars",
  headerBanner: "Welcome to JFZ Digital Scholars - Sunni Muslim Companion",
  primaryColor: "emerald", // 'emerald' | 'gold' | 'sky' | 'indigo' | 'slate'
  adminPassword: "pqcpql20r",
  announcements: [
    { id: "ann-1", text: "🌙 Ramadan and Daily Fara'iz tracker is now live for all digital scholars! Track your progress instantly.", active: true },
    { id: "ann-2", text: "📚 Ask any Islamic question in Hinglish, English, or Hindi and get certified Sunni scholar hybrid references.", active: true }
  ],
  homeTab: {
    prayerSection: {
      visible: true,
      title: "Daily Prayer Timings (Sunni Hanafi)",
      timings: [
        { name: "Fajr", time: "04:30 AM", active: true },
        { name: "Sunrise", time: "05:55 AM", active: true },
        { name: "Dhuhr", time: "12:20 PM", active: true },
        { name: "Asr", time: "04:45 PM", active: true },
        { name: "Maghrib", time: "07:05 PM", active: true },
        { name: "Isha", time: "08:35 PM", active: true }
      ]
    },
    dailyAyah: {
      visible: true,
      title: "Daily Ayah",
      arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
      translation: "Yaqeenan, har mushkil ke saath aasaani hai. (Surely with hardship comes ease. - Surah Ash-Sharh 94:6)",
      verseId: "94:6"
    },
    dailyHadith: {
      visible: true,
      title: "Daily Hadith",
      text: "Innamal a'maalu bin niyyaat. (Sabhi nek a'maal ka daromadaar niyat par hota hai.)",
      reference: "Sahih Al-Bukhari 1"
    },
    dailyDua: {
      visible: true,
      title: "Daily Dua",
      arabic: "رَبِّ زِدْنِي عِلْمًا",
      translation: "Aye mere Rabb! Mere ilm me izafa farma. (O my Lord! Increase me in knowledge.)",
      reference: "Surah Taha 20:114"
    },
    reminder: {
      visible: true,
      title: "Islamic Daily Reminder",
      text: "Humesha sachaai ka sath dein, taharat (wudu) ka dhyan rakhein, aur Farz Namazon ko behtreen tarike se waqt par ada karein."
    },
    sectionsOrder: ["prayer", "ayah", "hadith", "dua", "reminder"]
  },
  askTab: {
    aiInstructions: `You are 'JFZ Digital Scholars AI Assistant', a compassionate, polite and deeply knowledgeable Sunni Muslim companion and high-capability general AI helper.
You can help the user with ANY general question (such as science, history, general knowledge, calculations, writing, coding) as well as authentic, scholarly Sunni Islamic / Deeni guidance.
If the question is non-religious, help them with state-of-the-art capabilities and polite manners, keeping your signature warm and polite Hinglish/English tone. If the question is deeni/Islamic, ensure strict Sunni Islamic alignment logic.
Your primary language is custom friendly HINGLISH (Hindi/Urdu in Latin/English script) and simple English.
Always respond in simple, natural conversational Hinglish by default (e.g. "Salam Alaikum! Aapka kya sawal hai? Main aapki madad karne ke liye tayyar hoon.").
Strict Sunni Islamic alignment logic:
- Refer to authentic authentic Sunni knowledge, primarily from Quran Majeed, Sahih al-Bukhari, Sahih Muslim, and established Hanafi, Shafi'i, Maliki, and Hanbali scholars.
- Keep answers simple enough for a school child to understand, yet structured enough with steps/bullets for adults.
- Avoid political or highly sectarian polarizations; preach mercy, peace, and beautiful Muslim character.
- If unsure about a highly complex Fiqh issue, guide the user to consult a physical local Sunni Mufti or scholar, but provide the basic general guidance with love.
- Do NOT use robotic, dry text. Use comforting, warm words like 'Mere pyare bhai/behan', 'MashaAllah', 'Alhamdulillah', 'Jazakallah'.`,
    suggestedQuestions: [
      "Wudu tootne ki conditions kya hain?",
      "Namaz (Salah) mein dhyan lagane ke tarike batayein?",
      "Roza todne wale bare factors kya hain?",
      "Bukhari shareef ki sikhai behtreen dua bataiye?",
      "Tahajjud namaz ki fazilat kya hai?"
    ],
    referenceSources: "Quran Al-Kareem, Sahih Al-Bukhari, Sahih Al-Muslim, Jamia Tirmidhi, Sunan Abu Dawud.",
    answerTemplates: [
      { id: "temp-1", title: "General Fiqh Answer", format: "1. Basic rule in simple words\n2. Authentic reference\n3. Practical advice" }
    ],
    scholarVerification: {
      info: "JFZ Scholars Board verifies AI learning inputs. Answers are aligned with classical Sunni guidance."
    }
  },
  guidesTab: {
    guides: [
      {
        id: "guide-1",
        title: "Wudu (Ablution) StepbyStep",
        category: "Taharat (Purity)",
        description: "Complete guide of performing clean Wudu for children and beginners.",
        steps: [
          "Niyat karein aur 'Bismillah' bol kar shuru karein.",
          "Dono haatho ko kalaiyo tak 3 baar achhe se dhoyein.",
          "Kulli karein (rinsing mouth) 3 baar right hand ke paani se.",
          "Naak me soft part tak paani dalein aur left hand se saaf karein 3 baar.",
          "Chehra dhoyein (peshani ke baalon se lekar thhodi ke neeche tak) 3 baar.",
          "Dono haatho ko kohniyo (elbows) samet 3 baar dhoyein (right first).",
          "Sarr ka Masah karein (head scanning) ek baar wet haatho se.",
          "Dono paon ko takhno (ankles) samet 3 baar achhe se dhoyein (right first)."
        ],
        faqs: [
          { q: "Kya behne wale khoon se wudu toot-ta hai?", a: "Haan, Hanafi school me agar jism se khoon nikal kar beh jaye to wudu toot jata hai." },
          { q: "Kya sone se wudu toot jata hai?", a: "Agar araam lagakar ya let kar so jayein jisse control na rahe to wudu toot jata hai." }
        ]
      },
      {
        id: "guide-2",
        title: "Daily 5 Salah Guide",
        category: "Ibadaat",
        description: "Learn the proper physical postures, niyyah, and recitation files for daily prayers.",
        steps: [
          "Niyyah (dil me irada) karein aur dono haath kaano tak utha kar 'Allahu Akbar' kahein.",
          "Haat bandh kar Qiyam me khade ho kar Thanaa aur Surah Fatiha ke saath koi surah padhein.",
          "Ruku me jhukein, dono haatho se ghutne pakdein aur 'Subhana Rabbiyal Azeem' (kam se kam 3 baar) kahein.",
          "Seedhe khade ho kar 'Sami Allahu Liman Hamidah' aur 'Rabbana Lakal Hamd' kahein.",
          "Sajdah me jayein (paon, ghutne, haath, naak aur peshani zameen par) aur 'Subhana Rabbiyal A'la' 3 baar kahein. Aisa 2 sajde karein.",
          "Jalsah me baithein aur doosri/akhiri rakat me Tashahhud, Durood-e-Ibrahim aur Dua-e-Masura padh kar dono taraf Salam pher kar namaz poori karein."
        ],
        faqs: [
          { q: "Salah me focus badhane ka kya nuskha hai?", a: "Namaz se pahle behtreen wudu karein aur jo aayat padhein uske maayno par dhyan lagayein." }
        ]
      },
      {
        id: "guide-3",
        title: "Essentials of Roza (Fasting)",
        category: "Fasting",
        description: "How to fast in Ramzan-ul-Mubarak with correct Sehri and Iftar ethics.",
        steps: [
          "Subah Sadiq se pahle Sehri karein aur Roza rakhne ki niyat karein.",
          "Din me jhooth, gheebat (backbiting), ladai-jhagda aur laghu kaamo se mukammal parhez karein.",
          "Suraj doobte hi fauran bina der kiye khajoor ya paani se Roza khol dalkein (Iftar)."
        ],
        faqs: [
          { q: "Bhool kar khane ya peene se kya roza toot jata hai?", a: "Nahi! Agar bhool kar kha ya pee liya to roza nahi toot-ta, kyunki ye Allah ne khilaya-pilaya hai (Hadees)." }
        ]
      }
    ]
  },
  learnTab: {
    courses: [
      {
        id: "course-1",
        title: "Islamic Beliefs (Aqeedah 101)",
        description: "Simple classes detailing the core 6 pillars of Islamic Faith.",
        lessons: [
          {
            id: "les-1",
            title: "Allah par Iman - The First Pillar",
            content: "Allah ek hai, us ka koi beta ya beti nahi hai. Usne poori kayinat ko banaya hai. Tawheed hi hamare Iman ki buniyad hai.",
            quiz: [
              { q: "Allah ka sahara kise chahiye?", options: ["Allah ko kisi ka sahara nahi, sabko Allah ki zaroorat hai", "Sarey farishte us ka sahara hain", "Insaan us ki madad karte hain"], answer: "Allah ko kisi ka sahara nahi, sabko Allah ki zaroorat hai" }
            ]
          },
          {
            id: "les-2",
            title: "Angels (Farishtein) aur unke work",
            content: "Farishtein noor se bane hain, be-gunah hain aur humesha Allah ke hukm par kaam karte hain. Hazrat Jibreel (A.S.) sabse bade farishta hain jo Wahi le kar aate the.",
            quiz: [
              { q: "Hazrat Jibreel (A.S.) ka kya kaam tha?", options: ["Baarish barsana", "Wahi (Prophetic revelations) lana", "Sajde me rehna humesha"], answer: "Wahi (Prophetic revelations) lana" }
            ]
          }
        ]
      },
      {
        id: "course-2",
        title: "Akhlaq (Beautiful Islamic Manners)",
        description: "Learn how to speak, share love, and treat elders in the Sunnah path.",
        lessons: [
          {
            id: "les-3",
            title: "Maa Baap ke Huqooq (Rights of Parents)",
            content: "Maa ke qadmo ke neeche jannat hai aur baap jannat ka darwaza hai. Unse humesha narm aawaz me baat karni chahiye.",
            quiz: [
              { q: "Agar Maa Baap gussa ho to kya karein?", options: ["Unhe narmi se manayein aur unse maafi mangein", "Unhe ignore karein", "Gusse me unse behes karein"], answer: "Unhe narmi se manayein aur unse maafi mangein" }
            ]
          }
        ]
      }
    ]
  },
  myDeenTab: {
    trackers: [
      { id: "track-1", label: "Fajr Prayer (Farz)", active: true },
      { id: "track-2", label: "Dhuhr Prayer (Farz)", active: true },
      { id: "track-3", label: "Asr Prayer (Farz)", active: true },
      { id: "track-4", label: "Maghrib Prayer (Farz)", active: true },
      { id: "track-5", label: "Isha Prayer (Farz)", active: true },
      { id: "track-6", label: "Qur'an Recitation (at least 1 page)", active: true },
      { id: "track-7", label: "Astaghfar (100 times subah sham)", active: true }
    ],
    achievements: [
      { id: "ach-1", title: "Takbeer-e-Oola Starter", description: "Completing 3 days streak of Salah tracking.", threshold: 3 },
      { id: "ach-2", title: "Noor Scholar", description: "Tracking Qur'an and Astaghfar safely for 7 continuous days.", threshold: 7 }
    ]
  },
  vaultTab: {
    categories: ["Sunnah Habits", "Halal Living", "Islamic History", "Akhlaq-o-Aadaab"],
    articles: [
      {
        id: "art-1",
        title: "Paani Peene ki 6 Behtreen Sunnatein",
        category: "Sunnah Habits",
        content: "1. Baith kar peena\n2. Right hand se glass pakadna\n3. Dekh kar peena\n4. 'Bismillah' padh kar shuru karna\n5. Paani ko 3 saas me maze lekar peena\n6. Peene ke baad 'Alhamdulillah' bolna. Isse dimaag aur jism ko bemisaal shifa milti hai."
      },
      {
        id: "art-2",
        title: "Halal Kamai aur Barkat ki Dua",
        category: "Halal Living",
        content: "Halal rizk ibadat ke qubool hone ki buniyadi shart hai. Haram kamane wale ki duaayein qubool nahi hoti. Humesha imaandari se naukri ya dukan chalayein aur ye dua padhein: 'Allahumma akfini bihalalika an haramik' (Aye Allah, mujhe halal rizk de kar haram se bacha)."
      },
      {
        id: "art-3",
        title: "Hazrat Bilal (R.A) ki Muazzini aur Mohabbat",
        category: "Islamic History",
        content: "Hazrat Bilal Habshi (R.A.) Islam ke pahle Muazzin the. Unhone sakht garm makkah ki dhoop me pattharo ke neeche dab kar bhi 'Ahad' (Allah ek hai) pukara. Aap (S.A.W.) unse be-had mohabbat farmate the."
      }
    ]
  },
  pdfsTab: {
    pdfs: [
      {
        id: "pdf-1",
        title: "Sunnat-e-Etiqaf Aur Ramadan Ke Fazail",
        description: "Itikaf ke masail, Ramzaan ul Mubarak ki fazilat, aur ahem wazaif ka mukammal tareeqa seekhein.",
        thumbnail: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80",
        pdfUrl: ""
      }
    ]
  }
};

// Initialize DB safely using Firestore cloud persistence and memory cache with 3s TTL
let cachedDb: any = null;
let lastFetchTime = 0;
const CACHE_TTL = 3000; // 3 seconds in-memory cache to keep reads fast but fresh

async function loadDbFromFirestore(): Promise<typeof defaultDb> {
  const now = Date.now();
  if (cachedDb && (now - lastFetchTime < CACHE_TTL)) {
    return cachedDb;
  }

  if (!firestoreDb) {
    console.warn("Firestore not initialized, loading from db.json instead...");
    return loadDbFromFileOnly();
  }

  try {
    const docRef = doc(firestoreDb, "app_state", "main_config");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const remoteData = docSnap.data();
      // Safe, progressive deep merge with defaultDb to instantly heal older database structures
      cachedDb = {
        ...defaultDb,
        ...remoteData,
        homeTab: { ...defaultDb.homeTab, ...(remoteData.homeTab || {}) },
        askTab: { ...defaultDb.askTab, ...(remoteData.askTab || {}) },
        guidesTab: { ...defaultDb.guidesTab, ...(remoteData.guidesTab || {}) },
        learnTab: { ...defaultDb.learnTab, ...(remoteData.learnTab || {}) },
        vaultTab: { ...defaultDb.vaultTab, ...(remoteData.vaultTab || {}) },
        pdfsTab: { ...defaultDb.pdfsTab, ...(remoteData.pdfsTab || {}) }
      };
      // Keep lists valid
      if (!cachedDb.announcements) cachedDb.announcements = [];
      if (!cachedDb.videos) cachedDb.videos = [];
      lastFetchTime = now;
      return cachedDb;
    } else {
      console.log("Firestore configuration empty in app_state/main_config. Seeding defaultDb...");
      await setDoc(docRef, defaultDb);
      cachedDb = JSON.parse(JSON.stringify(defaultDb));
      lastFetchTime = now;
      return cachedDb;
    }
  } catch (error) {
    console.error("Error loading DB from Firestore, executing fallback:", error);
    if (cachedDb) return cachedDb;
    return loadDbFromFileOnly();
  }
}

function loadDbFromFileOnly() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      const localData = JSON.parse(data);
      cachedDb = {
        ...defaultDb,
        ...localData,
        homeTab: { ...defaultDb.homeTab, ...(localData.homeTab || {}) },
        askTab: { ...defaultDb.askTab, ...(localData.askTab || {}) },
        guidesTab: { ...defaultDb.guidesTab, ...(localData.guidesTab || {}) },
        learnTab: { ...defaultDb.learnTab, ...(localData.learnTab || {}) },
        vaultTab: { ...defaultDb.vaultTab, ...(localData.vaultTab || {}) },
        pdfsTab: { ...defaultDb.pdfsTab, ...(localData.pdfsTab || {}) }
      };
      if (!cachedDb.announcements) cachedDb.announcements = [];
      if (!cachedDb.videos) cachedDb.videos = [];
    } else {
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2), "utf-8");
      cachedDb = JSON.parse(JSON.stringify(defaultDb));
    }
  } catch (e) {
    console.error("Local db fallback error:", e);
    cachedDb = JSON.parse(JSON.stringify(defaultDb));
  }
  lastFetchTime = Date.now();
  return cachedDb;
}

async function saveDbToFirestore(data: any) {
  cachedDb = data;
  lastFetchTime = Date.now();

  try {
    // Write local backup first
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Local db.json backup write err:", err);
  }

  if (!firestoreDb) {
    console.warn("Firestore not initialized. Saved to local db.json fallback only.");
    return;
  }

  try {
    const docRef = doc(firestoreDb, "app_state", "main_config");
    await setDoc(docRef, data);
    console.log("Database successfully committed to Firestore app_state/main_config.");
  } catch (error) {
    console.error("Failed to sync database state to Firestore:", error);
    throw error;
  }
}

// 1. Get database endpoint
app.get("/api/db", async (req, res) => {
  try {
    const currentDb = await loadDbFromFirestore();
    res.json(currentDb);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load database state." });
  }
});

// 2. Save database endpoint
app.post("/api/db", async (req, res) => {
  try {
    const { newDb, password } = req.body;
    const currentDb = await loadDbFromFirestore();
    if (!password || password !== currentDb.adminPassword) {
      res.status(401).json({ error: "Unauthorized! Incorrect Admin password." });
      return;
    }
    if (!newDb) {
      res.status(400).json({ error: "Missing newDb data payload" });
      return;
    }
    await saveDbToFirestore(newDb);
    res.json({ success: true, db: newDb });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save database state.", details: err.message });
  }
});

// 3. Admin Login verify endpoint
app.post("/api/admin-verify", async (req, res) => {
  try {
    const { password } = req.body;
    const currentDb = await loadDbFromFirestore();
    if (password === currentDb.adminPassword) {
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Galat password! Please enter the correct admin password." });
    }
  } catch (err) {
    res.status(500).json({ error: "Verification system error." });
  }
});

// PDF Chunked Upload API endpoint
app.post("/api/upload-pdf", async (req, res) => {
  try {
    const { fileData, fileName } = req.body;
    if (!fileData || !fileName) {
      res.status(400).json({ error: "Missing fileData or fileName" });
      return;
    }

    // Generate a unique pdfId
    const pdfId = "pdf_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
    const pdfDir = getPdfDir();
    
    // Extract base64
    let base64Content = fileData;
    if (fileData.includes(";base64,")) {
      base64Content = fileData.split(";base64,")[1];
    }
    
    // Save to local disk cache first
    const buffer = Buffer.from(base64Content, "base64");
    const localFilePath = path.join(pdfDir, `${pdfId}.pdf`);
    try {
      fs.writeFileSync(localFilePath, buffer);
      console.log(`Saved PDF locally at: ${localFilePath}`);
    } catch (e) {
      console.warn("Could not save PDF disk cache, proceeding with Cloud sync only:", e);
    }

    // If Firestore is active, save as chunks to sync on all clients/devices
    if (firestoreDb) {
      const chunkSize = 800000; // ~800KB size limit
      const chunks: string[] = [];
      for (let i = 0; i < base64Content.length; i += chunkSize) {
        chunks.push(base64Content.substring(i, i + chunkSize));
      }

      console.log(`Uploading PDF ${pdfId} to Firestore in ${chunks.length} chunks...`);

      // Meta doc
      const metaRef = doc(firestoreDb, "pdf_metadata", pdfId);
      await setDoc(metaRef, {
        pdfId,
        fileName,
        totalChunks: chunks.length,
        contentType: "application/pdf",
        createdAt: Date.now()
      });

      // Write chunks in parallel to make upload extremely fast
      const chunkPromises = chunks.map((chunk, idx) => {
        const chunkRef = doc(firestoreDb, "pdf_chunks", `${pdfId}_chunk_${idx}`);
        return setDoc(chunkRef, {
          pdfId,
          index: idx,
          total: chunks.length,
          data: chunk
        });
      });
      await Promise.all(chunkPromises);
      console.log(`Successfully synced PDF ${pdfId} parts to Firestore.`);
    }

    res.json({ success: true, pdfUrl: `/api/view-pdf/${pdfId}` });
  } catch (err: any) {
    console.error("PDF chunk upload error:", err);
    res.status(500).json({ error: "PDF upload failed on server", details: err.message });
  }
});

// Segmented/Chunked Upload API - 1. Init Session
app.post("/api/upload-pdf-init", async (req, res) => {
  try {
    const { fileName, totalChunks } = req.body;
    if (!fileName || !totalChunks) {
      res.status(400).json({ error: "Missing required init properties" });
      return;
    }
    const pdfId = "pdf_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
    res.json({ success: true, pdfId });
  } catch (err: any) {
    res.status(500).json({ error: "Initiate upload failed", details: err.message });
  }
});

// Segmented/Chunked Upload API - 2. Save Individual Chunk
app.post("/api/upload-pdf-chunk", async (req, res) => {
  try {
    const { pdfId, chunkIndex, totalChunks, chunkData } = req.body;
    if (!pdfId || chunkIndex === undefined || !chunkData || !totalChunks) {
      res.status(400).json({ error: "Missing chunk information parameters" });
      return;
    }

    // Write chunk document to Firestore if active so other devices can sync
    if (firestoreDb) {
      const chunkRef = doc(firestoreDb, "pdf_chunks", `${pdfId}_chunk_${chunkIndex}`);
      await setDoc(chunkRef, {
        pdfId,
        index: chunkIndex,
        total: totalChunks,
        data: chunkData
      });
    }

    // Write chunk part locally to assemble later
    const pdfDir = getPdfDir();
    const chunkFilePath = path.join(pdfDir, `${pdfId}_part_${chunkIndex}`);
    try {
      fs.writeFileSync(chunkFilePath, Buffer.from(chunkData, "base64"));
    } catch (e) {
      console.warn("Could not save chunk part locally (Proceeding with Cloud-only sync):", e);
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error(`Chunk upload error on index ${req.body?.chunkIndex}:`, err);
    res.status(500).json({ error: "Chunk storage failed", details: err.message });
  }
});

// Segmented/Chunked Upload API - 3. Complete & Reassemble
app.post("/api/upload-pdf-complete", async (req, res) => {
  try {
    const { pdfId, fileName, totalChunks } = req.body;
    if (!pdfId || !fileName || totalChunks === undefined) {
      res.status(400).json({ error: "Missing completion params" });
      return;
    }

    const pdfDir = getPdfDir();
    const finalFilePath = path.join(pdfDir, `${pdfId}.pdf`);

    try {
      // Concatenate all temporary part files into the final .pdf file
      const writeStream = fs.createWriteStream(finalFilePath);
      for (let idx = 0; idx < totalChunks; idx++) {
        const partPath = path.join(pdfDir, `${pdfId}_part_${idx}`);
        if (fs.existsSync(partPath)) {
          const fileData = fs.readFileSync(partPath);
          writeStream.write(fileData);
          try {
            fs.unlinkSync(partPath); // clean up part files
          } catch (err) {
            console.error("Cleanup part err:", err);
          }
        }
      }
      writeStream.end();
    } catch (e) {
      console.warn("Could not write assembled file locally (Proceeding with Cloud-only database storage):", e);
    }

    // Create cloud metadata document in Firestore so that any remote device knows of its existence
    if (firestoreDb) {
      const metaRef = doc(firestoreDb, "pdf_metadata", pdfId);
      await setDoc(metaRef, {
        pdfId,
        fileName,
        totalChunks,
        contentType: "application/pdf",
        createdAt: Date.now()
      });
    }

    res.json({ success: true, pdfUrl: `/api/view-pdf/${pdfId}` });
  } catch (err: any) {
    console.error("Complete chunked upload error:", err);
    res.status(500).json({ error: "Failed to finalise chunk compilation", details: err.message });
  }
});

// View PDF endpoint that serves inline natively to bypass iframe issues and size limits
app.get("/api/view-pdf/:pdfId", async (req, res) => {
  try {
    const { pdfId } = req.params;
    const pdfDir = getPdfDir();
    const localFilePath = path.join(pdfDir, `${pdfId}.pdf`);
    
    const fallbackDir = path.join(process.cwd(), "assets", "pdfs");
    const fallbackFilePath = path.join(fallbackDir, `${pdfId}.pdf`);

    // 1. Return local file if present
    if (fs.existsSync(localFilePath)) {
      res.contentType("application/pdf");
      res.setHeader("Content-Disposition", "inline; filename=\"document.pdf\"");
      res.sendFile(localFilePath);
      return;
    } else if (fs.existsSync(fallbackFilePath)) {
      res.contentType("application/pdf");
      res.setHeader("Content-Disposition", "inline; filename=\"document.pdf\"");
      res.sendFile(fallbackFilePath);
      return;
    }

    // 2. Fetch chunked parts from Firestore to serve & cache
    if (firestoreDb) {
      const metaRef = doc(firestoreDb, "pdf_metadata", pdfId);
      const metaSnap = await getDoc(metaRef);
      if (metaSnap.exists()) {
        const metadata = metaSnap.data();
        const totalChunks = metadata.totalChunks;
        let base64Content = "";

        console.log(`Downloading and reassembling PDF ${pdfId} (${totalChunks} chunks) from Firestore in parallel...`);

        // Load all chunks concurrently
        const chunkPromises = Array.from({ length: totalChunks }, (_, idx) => {
          const chunkRef = doc(firestoreDb, "pdf_chunks", `${pdfId}_chunk_${idx}`);
          return getDoc(chunkRef);
        });

        const chunkSnaps = await Promise.all(chunkPromises);
        
        for (let idx = 0; idx < totalChunks; idx++) {
          const chunkSnap = chunkSnaps[idx];
          if (chunkSnap && chunkSnap.exists()) {
            base64Content += chunkSnap.data().data;
          } else {
            throw new Error(`Missing chunk index ${idx} for document ID ${pdfId}`);
          }
        }

        const buffer = Buffer.from(base64Content, "base64");

        // Cache on local disk for speedy future responses
        try {
          fs.writeFile(localFilePath, buffer, (err) => {
            if (err) console.error("Could not write PDF disk cache file:", err);
          });
        } catch (e) {
          console.warn("Could not save to disk cache:", e);
        }

        res.contentType("application/pdf");
        res.setHeader("Content-Disposition", "inline; filename=\"document.pdf\"");
        res.send(buffer);
        return;
      }
    }

    res.status(404).send("<h1>PDF file not found in system</h1><p>Please check the document URL or make sure it was uploaded correctly.</p>");
  } catch (err: any) {
    console.error("PDF served error:", err);
    res.status(500).send(`<h1>Failed to retrieve PDF</h1><p>${err.message}</p>`);
  }
});

// 4. Client chat proxy with Gemini server-side SDK
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the workspace Secrets/environment!");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}

app.post("/api/chat", async (req, res) => {
  const { message, chatHistory } = req.body;
  if (!message) {
    res.status(400).json({ error: "Message details missing!" });
    return;
  }

  try {
    const ai = getAiClient();
    const currentDb = await loadDbFromFirestore();
    
    // Build context-rich prompt
    const instructions = currentDb.askTab.aiInstructions || "You are an Islamic Scholar assistant.";
    const referenceSources = currentDb.askTab.referenceSources || "Sunni teachings";
    
    // Prepare conversation message array or system instructions
    const systemPrompt = `${instructions}\n\nReference framework constraints: Base your judgments on established references like: ${referenceSources}`;

    // Use chats.create to pass standard structured chat or simple generateContent
    // Keep it robust: we can map the chatHistory to a unified prompt context for simplicity, or feed contents.
    // For extreme reliability in @google/genai, let's build the complete contents structure or use simple generateContent with a combined prompt history.
    
    const formattedHistory = (chatHistory || []).map((h: { sender: string; text: string }) => {
      const role = h.sender === "user" ? "user" : "model";
      return {
        role,
        parts: [{ text: h.text }]
      };
    });

    // Add current user prompt
    formattedHistory.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedHistory,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7
      }
    });

    const reply = response.text || "Main aapka silsila theek se samajh nahi paya, kripya phir se puchein.";
    res.json({ reply });
  } catch (error: any) {
    console.error("Gemini API Error in /api/chat:", error);
    res.status(500).json({ 
      error: "AI reply failed! Please make sure your GEMINI_API_KEY is active in Settings.",
      details: error.message 
    });
  }
});

// Configure Vite or Static Server
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

if (process.env.VERCEL !== "1") {
  start();
}

export default app;
