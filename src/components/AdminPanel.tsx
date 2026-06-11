import React, { useState } from "react";
import { DatabaseState, Announcement, PrayerTiming, Guide, Course, Lesson, QuizQuestion, PdfItem, Article } from "../types";
import { 
  ArrowLeft, Save, Lock, Layout, HelpCircle, BookOpen, Clock, 
  Trash2, Plus, ArrowUp, ArrowDown, Sparkles, FolderOpen, RefreshCw,
  Upload, Image as ImageIcon, FileText
} from "lucide-react";

interface AdminPanelProps {
  db: DatabaseState;
  onSave: (newDb: DatabaseState) => Promise<boolean>;
  onClose: () => void;
}

function healDb(target: any): DatabaseState {
  const base = JSON.parse(JSON.stringify(target || {}));
  
  if (!base.homeTab) base.homeTab = { sectionsOrder: ["announcements", "tasbih", "timing", "dailyDeed"], prayerTimings: [], dailyDeed: { title: "", text: "", isDone: false, lastDoneDay: 0 } };
  if (!base.homeTab.sectionsOrder) base.homeTab.sectionsOrder = ["announcements", "tasbih", "timing", "dailyDeed"];
  if (!base.homeTab.prayerTimings) base.homeTab.prayerTimings = [];
  if (!base.homeTab.dailyDeed) base.homeTab.dailyDeed = { title: "", text: "", isDone: false, lastDoneDay: 0 };
  
  if (!base.askTab) base.askTab = { categories: [], faqs: [] };
  if (!base.askTab.categories) base.askTab.categories = [];
  if (!base.askTab.faqs) base.askTab.faqs = [];
  
  if (!base.guidesTab) base.guidesTab = { guides: [] };
  if (!base.guidesTab.guides) base.guidesTab.guides = [];
  
  if (!base.learnTab) base.learnTab = { courses: [] };
  if (!base.learnTab.courses) base.learnTab.courses = [];
  
  if (!base.vaultTab) base.vaultTab = { categories: [], articles: [] };
  if (!base.vaultTab.categories) base.vaultTab.categories = ["Sunnah Habits", "Halal Living", "Islamic History", "Akhlaq-o-Aadaab"];
  if (!base.vaultTab.articles) base.vaultTab.articles = [];
  
  if (!base.pdfsTab) base.pdfsTab = { pdfs: [] };
  if (!base.pdfsTab.pdfs) base.pdfsTab.pdfs = [];
  
  if (!base.announcements) base.announcements = [];
  if (!base.videos) base.videos = [];
  
  // Ensure every pdf has standard properties safely populated
  base.pdfsTab.pdfs = base.pdfsTab.pdfs.map((pdf: any) => ({
    id: pdf.id || `pdf-${Date.now()}-${Math.random()}`,
    title: pdf.title || "",
    description: pdf.description || "",
    thumbnail: pdf.thumbnail || "",
    pdfUrl: pdf.pdfUrl || "",
    password: pdf.password || "",
  }));

  // Ensure every course has lessons, etc.
  base.learnTab.courses = base.learnTab.courses.map((course: any) => ({
    id: course.id || `c-${Date.now()}-${Math.random()}`,
    title: course.title || "",
    description: course.description || "",
    courseImage: course.courseImage || "",
    whatsappEnroll: course.whatsappEnroll !== false,
    lessons: (course.lessons || []).map((l: any) => ({
      id: l.id || `l-${Date.now()}-${Math.random()}`,
      title: l.title || "",
      content: l.content || "",
      videoUrl: l.videoUrl || "",
      quiz: (l.quiz || []).map((q: any) => ({
        q: q.q || "Interactive Question?",
        options: q.options || ["Correct Option", "Incorrect Option"],
        answer: q.answer || "Correct Option"
      }))
    }))
  }));

  return base as DatabaseState;
}

export default function AdminPanel({ db, onSave, onClose }: AdminPanelProps) {
  const [localDb, setLocalDb] = useState<DatabaseState>(healDb(db));
  const [activeAdminTab, setActiveAdminTab] = useState<"global" | "announcements" | "home" | "ask" | "guides" | "learn" | "pdfs" | "vault">("global");
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingPdfId, setUploadingPdfId] = useState<string | null>(null);

  // File reader helper for gallery image upload
  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Kripya sirf image file upload karein.");
      return;
    }
    // Limit size is 3MB maximum to keep DB synchronization fast
    if (file.size > 3 * 1024 * 1024) {
      alert("Kripya 3MB se chhoti image select karein taki app load speed kharab na ho.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      updateField("logoImage", result);
    };
    reader.readAsDataURL(file);
  };

  // Auth verify handler
  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("/api/admin-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput })
      });
      if (res.ok) {
        setIsAuthenticated(true);
      } else {
        const data = await res.json();
        setAuthError(data.error || "Galat password! Dubara enter karein.");
      }
    } catch {
      setAuthError("Server se communication failed!");
    }
  };

  // REST Save to backend
  const handlePersistChanges = async () => {
    setIsSaving(true);
    const pass = passwordInput || localDb.adminPassword;
    const success = await onSave(localDb);
    setIsSaving(false);
    if (success) {
      alert("MashaAllah! Sabhi changes server pe successfully apply ho gaye hain aur users ko instantly dikhenge.");
    } else {
      alert("Afsos! Changes save karne me error aya. Make sure Admin Password is correct.");
    }
  };

  // Helper arrays update
  const updateField = (path: string, val: any) => {
    const cloned = JSON.parse(JSON.stringify(localDb));
    // Solve flat nested paths
    if (path.includes(".")) {
      const parts = path.split(".");
      let cur: any = cloned;
      for (let i = 0; i < parts.length - 1; i++) {
        if (cur[parts[i]] === undefined || cur[parts[i]] === null) {
          cur[parts[i]] = {};
        }
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = val;
    } else {
      (cloned as any)[path] = val;
    }
    setLocalDb(healDb(cloned));
  };

  // Reorder Sections Helper in HomeTab
  const moveHomeSection = (index: number, direction: "up" | "down") => {
    const order = [...localDb.homeTab.sectionsOrder];
    if (direction === "up" && index > 0) {
      const temp = order[index];
      order[index] = order[index - 1];
      order[index - 1] = temp;
    } else if (direction === "down" && index < order.length - 1) {
      const temp = order[index];
      order[index] = order[index + 1];
      order[index + 1] = temp;
    }
    updateField("homeTab.sectionsOrder", order);
  };

  // Render Authentication overlay if not logged in
  if (!isAuthenticated) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-w-sm mx-auto my-12" id="admin-auth-overlay">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-2 text-xl">
            🔐
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">JFZ Scholars Login</h3>
          <p className="text-[11px] text-slate-400">Admin credentials verify karein to begin offline configuration.</p>
        </div>

        <form onSubmit={handleVerifyPassword} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase font-mono block">Mudir (Admin) Passcode</label>
            <input
              type="password"
              placeholder="Enter secure admin password..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full bg-slate-950 text-white placeholder-slate-700 text-xs px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {authError && (
            <p className="text-[10px] text-rose-400 leading-normal font-semibold text-center">{authError}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-slate-800 text-slate-400 text-center hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl py-2.5 text-center transition-all"
            >
              Verify Code
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-5" id="admin-interactive-control-panel">
      {/* Header operations bar */}
      <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800/80 flex items-center justify-between gap-3 sticky top-0 z-50 shadow-md backdrop-blur-md">
        <button 
          onClick={onClose} 
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white active:scale-95 transition-all text-left"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="font-bold">Close Editor</span>
        </button>
        
        <button
          onClick={handlePersistChanges}
          disabled={isSaving}
          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all active:scale-95 shadow"
        >
          {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>{isSaving ? "Publishing..." : "Publish Live (Instantly)"}</span>
        </button>
      </div>

      {/* Editor Main sub tabs menu list */}
      <div className="flex items-center gap-1 pb-1 overflow-x-auto select-none scrollbar-none">
        {[
          { id: "global", label: "Settings" },
          { id: "announcements", label: "Banners" },
          { id: "home", label: "Home tab" },
          { id: "ask", label: "Ask AI" },
          { id: "guides", label: "Guides" },
          { id: "learn", label: "classes" },
          { id: "pdfs", label: "JFZ PDFs" },
          { id: "vault", label: "Vault" }
        ].map((subtab) => (
          <button
            key={subtab.id}
            onClick={() => setActiveAdminTab(subtab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all border ${
              activeAdminTab === subtab.id
                ? "bg-amber-500 text-slate-950 border-transparent shadow"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {subtab.label}
          </button>
        ))}
      </div>

      {/* RENDER ACTIVE TAB EDITOR GRID */}
      <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800 space-y-4">
        
        {/* GLOBAL OPTIONS */}
        {activeAdminTab === "global" && (
          <div className="space-y-4" id="editor-global-config">
            <h3 className="text-xs uppercase font-bold text-amber-400 tracking-wider">App General Configuration</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase font-mono block mb-1">Company App Title</label>
                <input
                  type="text"
                  value={localDb.appName}
                  onChange={(e) => updateField("appName", e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase font-mono block mb-1">Header Logo Branding text</label>
                <input
                  type="text"
                  value={localDb.logoText}
                  onChange={(e) => updateField("logoText", e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase font-mono block mb-1.5">App Logo Image (Gallery Upload, Drag & Drop)</label>
                <div className="flex items-center gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                  {/* Current logo preview box */}
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <span className="text-[9px] text-slate-500 font-extrabold uppercase font-mono">Current Logo</span>
                    {localDb.logoImage ? (
                      <div className="relative group">
                        <img 
                          src={localDb.logoImage} 
                          alt="App Logo" 
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-700 shadow-lg"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => updateField("logoImage", "")}
                          className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-md hover:scale-105 active:scale-95 transition-all w-5 h-5 flex items-center justify-center text-[10px]"
                          title="Reset to default Mosque logo"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-500 flex items-center justify-center text-3xl shadow-lg shadow-black/15">
                        🕌
                      </div>
                    )}
                  </div>

                  {/* Drop zone box */}
                  <div 
                    className={`flex-1 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                      isDragging 
                        ? "bg-amber-500/10 border-amber-500" 
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleLogoFile(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => {
                      const input = document.getElementById("logo-file-selector");
                      if (input) input.click();
                    }}
                  >
                    <input
                      id="logo-file-selector"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleLogoFile(e.target.files[0]);
                        }
                      }}
                    />
                    <div className="space-y-1 pointer-events-none flex flex-col items-center justify-center">
                      <Upload className="w-5 h-5 text-amber-500 animate-pulse" />
                      <span className="text-[11px] font-black text-slate-300 block">Click or Drag & Drop</span>
                      <span className="text-[9px] text-slate-500 font-extrabold block">Apni gallery se image select karein (under 3MB)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase font-mono block mb-1">Theme Colors Highlight</label>
                <select
                  value={localDb.primaryColor}
                  onChange={(e) => updateField("primaryColor", e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                >
                  <option value="emerald">Emerald Sanctuary (Classical Green)</option>
                  <option value="gold">Golden Sands (Aesthetic)</option>
                  <option value="sky">Cosmic Blue (Modern)</option>
                  <option value="indigo">Deep Royal Indigo</option>
                  <option value="slate">Monochrome slate</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase font-mono block mb-1">Change Admin Panel Password</label>
                <input
                  type="text"
                  value={localDb.adminPassword}
                  onChange={(e) => updateField("adminPassword", e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-3 rounded-xl border border-slate-800 focus:outline-none"
                  placeholder="Set login password protect..."
                />
              </div>
            </div>
          </div>
        )}

        {/* ANNOUNCEMENT OPTION */}
        {activeAdminTab === "announcements" && (
          <div className="space-y-4" id="editor-announcements">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-bold text-amber-400 tracking-wider">Top Banner Announcements</h3>
              <button
                onClick={() => {
                  const ann = [...localDb.announcements];
                  ann.push({ id: `ann-${Date.now()}`, text: "New Islamic Announcement banner written", active: true });
                  updateField("announcements", ann);
                }}
                className="text-[11px] text-amber-400 flex items-center gap-1 font-bold bg-slate-950 px-2 py-1 rounded border border-slate-805"
              >
                <Plus className="w-3 h-3" /> Add Banner
              </button>
            </div>

            <div className="space-y-3">
              {localDb.announcements.map((ann, idx) => (
                <div key={ann.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-slate-500">Banner #{idx+1}</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          const updated = localDb.announcements.map((a, i) => i === idx ? { ...a, active: !a.active } : a);
                          updateField("announcements", updated);
                        }}
                        className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${ann.active ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"}`}
                      >
                        {ann.active ? "Active" : "Hidden"}
                      </button>
                      <button
                        onClick={() => {
                          const updated = localDb.announcements.filter((_, i) => i !== idx);
                          updateField("announcements", updated);
                        }}
                        className="text-rose-500 bg-rose-500/10 p-1 rounded hover:bg-rose-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={ann.text}
                    onChange={(e) => {
                      const updated = localDb.announcements.map((a, i) => i === idx ? { ...a, text: e.target.value } : a);
                      updateField("announcements", updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HOME TAB OPTION */}
        {activeAdminTab === "home" && (
          <div className="space-y-4" id="editor-hometab">
            
            {/* Scholars Videos Feed Management */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[11px] uppercase tracking-wider font-bold text-amber-400">Scholars Videos Feed</h4>
                  <p className="text-[9px] text-slate-500">Video links (YouTube or custom video links) jo Home Page pe show honge</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const list = localDb.videos ? [...localDb.videos] : [];
                    list.push({ id: `vid-${Date.now()}`, title: "Naye Video Ka Title", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", description: "Video description details" });
                    updateField("videos", list);
                  }}
                  className="text-[10px] text-amber-400 font-bold border border-slate-800 bg-slate-900 px-3 py-1 rounded hover:bg-slate-800"
                >
                  + Add Video Link
                </button>
              </div>

              <div className="space-y-3">
                {(!localDb.videos || localDb.videos.length === 0) ? (
                  <div className="text-center py-4 border border-slate-850 rounded-xl bg-slate-900 text-slate-500 text-xs">
                    Koi videos abhi added nahi hain. Add video link button pe click karein!
                  </div>
                ) : (
                  (localDb.videos || []).map((vid, vidx) => (
                    <div key={vid.id} className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                      <div className="flex justify-between items-center bg-slate-950 px-2 py-1 h-7 rounded">
                        <span className="text-[10px] font-mono text-amber-200">Video #{vidx+1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const list = (localDb.videos || []).filter(v => v.id !== vid.id);
                            updateField("videos", list);
                          }}
                          className="text-rose-500 hover:text-rose-450 text-[10px] bg-rose-500/10 px-2.5 py-0.5 rounded transition-all font-bold"
                        >
                          × Delete
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="text-[9px] text-slate-500 font-mono font-bold uppercase block mb-0.5">Video Title</label>
                          <input
                            type="text"
                            value={vid.title}
                            onChange={(e) => {
                              const list = (localDb.videos || []).map(v => v.id === vid.id ? { ...v, title: e.target.value } : v);
                              updateField("videos", list);
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                            placeholder="Enter video title..."
                          />
                        </div>

                        <div>
                          <label className="text-[9px] text-slate-500 font-mono font-bold uppercase block mb-0.5">Video/YouTube URL</label>
                          <input
                            type="text"
                            value={vid.url}
                            onChange={(e) => {
                              const list = (localDb.videos || []).map(v => v.id === vid.id ? { ...v, url: e.target.value } : v);
                              updateField("videos", list);
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                            placeholder="https://www.youtube.com/watch?v=..."
                          />
                        </div>

                        <div>
                          <label className="text-[9px] text-slate-500 font-mono font-bold uppercase block mb-0.5">Description (Optional)</label>
                          <textarea
                            value={vid.description || ""}
                            onChange={(e) => {
                              const list = (localDb.videos || []).map(v => v.id === vid.id ? { ...v, description: e.target.value } : v);
                              updateField("videos", list);
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white h-11 resize-none"
                            placeholder="Enter description details..."
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <h3 className="text-xs uppercase font-bold text-amber-400 tracking-wider">Drag/Button Re-order Home Cards</h3>
            
            {/* Reorder card layout */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2">
              <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block mb-1">Rendering Card Stack Order</span>
              {localDb.homeTab.sectionsOrder.map((section, idx) => (
                <div key={section} className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between text-xs text-white">
                  <span className="font-bold uppercase tracking-wider text-slate-400 font-mono text-[11px]">{section} card block</span>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => moveHomeSection(idx, "up")}
                      disabled={idx === 0}
                      className="p-1 rounded bg-slate-950 border border-slate-800 hover:text-amber-300 disabled:opacity-20"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => moveHomeSection(idx, "down")}
                      disabled={idx === localDb.homeTab.sectionsOrder.length - 1}
                      className="p-1 rounded bg-slate-950 border border-slate-800 hover:text-amber-300 disabled:opacity-20"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Daily Ayah, Hadith, Dua edit */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4">
              <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Home Content Elements details</h4>

              {/* Ayah block */}
              <div className="space-y-2.5 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Daily Ayah Settings</span>
                  <input 
                    type="checkbox" 
                    checked={localDb.homeTab.dailyAyah.visible} 
                    onChange={(e) => updateField("homeTab.dailyAyah.visible", e.target.checked)}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Arabic original..."
                  value={localDb.homeTab.dailyAyah.arabic}
                  onChange={(e) => updateField("homeTab.dailyAyah.arabic", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white"
                />
                <textarea
                  placeholder="Translation / Meaning in Latin..."
                  value={localDb.homeTab.dailyAyah.translation}
                  onChange={(e) => updateField("homeTab.dailyAyah.translation", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white h-16 resize-none"
                />
                <input
                  type="text"
                  placeholder="Verse ID reference..."
                  value={localDb.homeTab.dailyAyah.verseId}
                  onChange={(e) => updateField("homeTab.dailyAyah.verseId", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              {/* Hadith block */}
              <div className="space-y-2.5 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Daily Hadith Settings</span>
                  <input 
                    type="checkbox" 
                    checked={localDb.homeTab.dailyHadith.visible} 
                    onChange={(e) => updateField("homeTab.dailyHadith.visible", e.target.checked)}
                  />
                </div>
                <textarea
                  placeholder="Hadith Text body..."
                  value={localDb.homeTab.dailyHadith.text}
                  onChange={(e) => updateField("homeTab.dailyHadith.text", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white h-16 resize-none"
                />
                <input
                  type="text"
                  placeholder="Source Hadith reference..."
                  value={localDb.homeTab.dailyHadith.reference}
                  onChange={(e) => updateField("homeTab.dailyHadith.reference", e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              {/* Daily Timings config */}
              <div className="space-y-3.5 pt-3 border-t border-slate-800">
                <span className="text-xs font-bold text-white">Salah Timings Schedules</span>
                <div className="grid grid-cols-2 gap-2">
                  {localDb.homeTab.prayerSection.timings.map((prayer, idx) => (
                    <div key={idx} className="bg-slate-900 p-2 rounded border border-slate-850 flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400 capitalize shrink-0 w-12">{prayer.name}:</span>
                      <input
                        type="text"
                        value={prayer.time}
                        onChange={(e) => {
                          const updated = localDb.homeTab.prayerSection.timings.map((pt, i) => i === idx ? { ...pt, time: e.target.value } : pt);
                          updateField("homeTab.prayerSection.timings", updated);
                        }}
                        className="bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs text-white w-full text-right"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ASK TAB OPTION */}
        {activeAdminTab === "ask" && (
          <div className="space-y-4" id="editor-asktab">
            <h3 className="text-xs uppercase font-bold text-amber-400 tracking-wider">Hinglish AI Scholarship Setup</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase font-mono block mb-1">AI Prompt instructions (Persona definition)</label>
                <textarea
                  value={localDb.askTab.aiInstructions}
                  onChange={(e) => updateField("askTab.aiInstructions", e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2 rounded-xl border border-slate-800 h-32 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase font-mono block mb-1">Reference and Sunni Authorities</label>
                <input
                  type="text"
                  value={localDb.askTab.referenceSources}
                  onChange={(e) => updateField("askTab.referenceSources", e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase font-mono block mb-1">Scholar Verification Board Notice</label>
                <input
                  type="text"
                  value={localDb.askTab.scholarVerification.info}
                  onChange={(e) => updateField("askTab.scholarVerification.info", e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Suggested Questions builder */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Suggested clickable starting questions</span>
                  <button
                    onClick={() => {
                      const list = [...localDb.askTab.suggestedQuestions];
                      list.push("New custom quick question?");
                      updateField("askTab.suggestedQuestions", list);
                    }}
                    className="text-[10px] text-amber-400 font-bold border border-slate-800 px-2 py-0.5 rounded"
                  >
                    + Add suggested
                  </button>
                </div>
                {localDb.askTab.suggestedQuestions.map((q, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={q}
                      onChange={(e) => {
                        const list = [...localDb.askTab.suggestedQuestions];
                        list[idx] = e.target.value;
                        updateField("askTab.suggestedQuestions", list);
                      }}
                      className="w-full bg-slate-905 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                    />
                    <button
                      onClick={() => {
                        const list = localDb.askTab.suggestedQuestions.filter((_, i) => i !== idx);
                        updateField("askTab.suggestedQuestions", list);
                      }}
                      className="text-rose-500 hover:text-rose-400 bg-rose-500/10 p-1.5 rounded shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GUIDES EDITOR TAB */}
        {activeAdminTab === "guides" && (
          <div className="space-y-4" id="editor-guides">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-bold text-amber-400 tracking-wider">Islamic Guide Documents</h3>
              <button
                onClick={() => {
                  const arr = [...localDb.guidesTab.guides];
                  arr.push({
                    id: `g-${Date.now()}`,
                    title: "New Ablution guide",
                    category: "General",
                    description: "Learn instructions step-by-step.",
                    steps: ["Step 1 description body text"],
                    faqs: [{ q: "Faq?", a: "Faq reply" }]
                  });
                  updateField("guidesTab.guides", arr);
                }}
                className="text-[10px] text-amber-400 font-bold border border-slate-800 bg-slate-950 px-2 py-1 rounded"
              >
                + Add New Guide
              </button>
            </div>

            <div className="space-y-4">
              {localDb.guidesTab.guides.map((guide, idx) => (
                <div key={guide.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-amber-200 font-mono">Guide #{idx+1} ({guide.category})</span>
                    <button
                      onClick={() => {
                        const arr = localDb.guidesTab.guides.filter((_, i) => i !== idx);
                        updateField("guidesTab.guides", arr);
                      }}
                      className="text-rose-500 hover:text-rose-400 bg-rose-500/10 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Title of Guide..."
                      value={guide.title}
                      onChange={(e) => {
                        const arr = localDb.guidesTab.guides.map((g, i) => i === idx ? { ...g, title: e.target.value } : g);
                        updateField("guidesTab.guides", arr);
                      }}
                      className="bg-slate-900 border border-slate-800 text-xs px-2 py-1.5 rounded text-white"
                    />
                    <input
                      type="text"
                      placeholder="Category..."
                      value={guide.category}
                      onChange={(e) => {
                        const arr = localDb.guidesTab.guides.map((g, i) => i === idx ? { ...g, category: e.target.value } : g);
                        updateField("guidesTab.guides", arr);
                      }}
                      className="bg-slate-900 border border-slate-800 text-xs px-2 py-1.5 rounded text-white"
                    />
                  </div>

                  <textarea
                    placeholder="Brief description of guide"
                    value={guide.description}
                    onChange={(e) => {
                      const arr = localDb.guidesTab.guides.map((g, i) => i === idx ? { ...g, description: e.target.value } : g);
                      updateField("guidesTab.guides", arr);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-xs px-2 py-1.5 rounded text-white h-12"
                  />

                  {/* Steps custom lists */}
                  <div className="border-t border-slate-800/80 pt-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold mb-2">
                      <span>Step-by-step description array:</span>
                      <button
                        onClick={() => {
                          const steps = [...guide.steps, "New procedure instructions"];
                          const arr = localDb.guidesTab.guides.map((g, i) => i === idx ? { ...g, steps } : g);
                          updateField("guidesTab.guides", arr);
                        }}
                        className="text-amber-400 text-[10px]"
                      >
                        + Add Step
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {guide.steps.map((st, sidx) => (
                        <div key={sidx} className="flex gap-1.5 items-center">
                          <span className="text-[10px] text-slate-500 font-mono shrink-0">#{sidx+1}</span>
                          <input
                            type="text"
                            value={st}
                            onChange={(e) => {
                              const steps = [...guide.steps];
                              steps[sidx] = e.target.value;
                              const arr = localDb.guidesTab.guides.map((g, i) => i === idx ? { ...g, steps } : g);
                              updateField("guidesTab.guides", arr);
                            }}
                            className="bg-slate-900 border border-slate-800 text-[11px] px-2 py-1 rounded text-white w-full"
                          />
                          <button
                            onClick={() => {
                              const steps = guide.steps.filter((_, s) => s !== sidx);
                              const arr = localDb.guidesTab.guides.map((g, i) => i === idx ? { ...g, steps } : g);
                              updateField("guidesTab.guides", arr);
                            }}
                            className="text-rose-500 shrink-0 hover:bg-rose-500/10 p-1 rounded"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STUDY CLASSES & LESSONS TAB */}
        {activeAdminTab === "learn" && (
          <div className="space-y-4" id="editor-classes flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-bold text-amber-400 tracking-wider">Faith Madrassah Courses</h3>
              <button
                onClick={() => {
                  const arr = [...localDb.learnTab.courses];
                  arr.push({
                    id: `c-${Date.now()}`,
                    title: "New Curriculum",
                    description: "Details of faith syllabus.",
                    lessons: [
                      { id: `l-${Date.now()}`, title: "Lesson titles", content: "Details of the lesson parameters go here", videoUrl: "", quiz: [{ q: "Sawaal context?", options: ["Option A", "Option B"], answer: "Option A" }] }
                    ]
                  });
                  updateField("learnTab.courses", arr);
                }}
                className="text-[10px] text-amber-400 font-bold border border-slate-800 bg-slate-950 px-2 py-1 rounded"
              >
                + Add Course
              </button>
            </div>

            <div className="space-y-4">
              {localDb.learnTab.courses.map((course, idx) => (
                <div key={course.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400">Course #{idx+1} Code</span>
                    <button
                      onClick={() => {
                        const arr = localDb.learnTab.courses.filter((_, i) => i !== idx);
                        updateField("learnTab.courses", arr);
                      }}
                      className="text-rose-500 hover:text-rose-400 bg-rose-500/10 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={course.title}
                    onChange={(e) => {
                      const arr = localDb.learnTab.courses.map((c, i) => i === idx ? { ...c, title: e.target.value } : c);
                      updateField("learnTab.courses", arr);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded text-xs px-2.5 py-1.5 text-white font-bold"
                    placeholder="Course Title"
                  />

                  <textarea
                    value={course.description}
                    onChange={(e) => {
                      const arr = localDb.learnTab.courses.map((c, i) => i === idx ? { ...c, description: e.target.value } : c);
                      updateField("learnTab.courses", arr);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded text-[11px] px-2.5 py-1.5 text-white h-12"
                    placeholder="Course Description"
                  />

                  {/* Course Image configuration and WhatsApp check fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-1">
                    <div>
                      <label className="text-[10px] text-slate-500 font-mono font-bold uppercase block mb-1">Course Image URL</label>
                      <input
                        type="text"
                        value={course.courseImage || ""}
                        onChange={(e) => {
                          const arr = localDb.learnTab.courses.map((c, i) => i === idx ? { ...c, courseImage: e.target.value } : c);
                          updateField("learnTab.courses", arr);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded text-xs px-2.5 py-1.5 text-white font-mono"
                        placeholder="https://example.com/course-banner.jpg"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-mono font-bold uppercase block mb-1">WhatsApp enroll action</label>
                      <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded border border-slate-800 h-[32px]">
                        <input
                          type="checkbox"
                          id={`chk-wa-${course.id}`}
                          checked={course.whatsappEnroll !== false}
                          onChange={(e) => {
                            const arr = localDb.learnTab.courses.map((c, i) => i === idx ? { ...c, whatsappEnroll: e.target.checked } : c);
                            updateField("learnTab.courses", arr);
                          }}
                          className="rounded text-amber-500 focus:ring-amber-500 bg-slate-950 border-slate-800 cursor-pointer"
                        />
                        <label htmlFor={`chk-wa-${course.id}`} className="text-[10.5px] text-slate-400 font-bold cursor-pointer select-none">
                          Show Enroll now button
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-mono font-bold uppercase block mb-1">Or Upload Course banner photo</label>
                    <div className="flex items-center gap-3 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <input
                        type="file"
                        accept="image/*"
                        id={`file-course-${course.id}`}
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            if (file.size > 2 * 1024 * 1024) {
                              alert("Kripya 2MB se chhoti image select karein.");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (upl) => {
                              const result = upl.target?.result as string;
                              const arr = localDb.learnTab.courses.map((c, i) => i === idx ? { ...c, courseImage: result } : c);
                              updateField("learnTab.courses", arr);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById(`file-course-${course.id}`)?.click()}
                        className="bg-slate-950 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-lg text-[9.5px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1 shrink-0"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Select banner file</span>
                      </button>
                      <span className="text-[9.5px] text-slate-500 truncate">
                        {course.courseImage ? "✅ Loaded" : "No device image file loaded"}
                      </span>
                    </div>
                  </div>

                  {/* Lessons list inside course */}
                  <div className="bg-slate-900/60 p-3 rounded-lg space-y-3 border border-slate-850">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                      <span>Curriculum Lessons:</span>
                      <button
                        onClick={() => {
                          const lessons = [...course.lessons, { id: `l-${Date.now()}`, title: "New Lesson", content: "Details placeholder text.", quiz: [{ q: "Interactive question?", options: ["Correct option", "Incorrect option"], answer: "Correct option" }] }];
                          const arr = localDb.learnTab.courses.map((c, i) => i === idx ? { ...c, lessons } : c);
                          updateField("learnTab.courses", arr);
                        }}
                        className="text-amber-400"
                      >
                        + Add Lesson
                      </button>
                    </div>

                    {course.lessons.map((les, lidx) => (
                      <div key={les.id} className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2">
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                          <span>Lesson Unit L.{lidx+1}</span>
                          <button
                            onClick={() => {
                              const lessons = course.lessons.filter((_, l) => l !== lidx);
                              const arr = localDb.learnTab.courses.map((c, i) => i === idx ? { ...c, lessons } : c);
                              updateField("learnTab.courses", arr);
                            }}
                            className="text-rose-500 font-bold"
                          >
                            × Remove
                          </button>
                        </div>

                        <input
                          type="text"
                          value={les.title}
                          onChange={(e) => {
                            const lessons = course.lessons.map((l, lIndex) => lIndex === lidx ? { ...l, title: e.target.value } : l);
                            const arr = localDb.learnTab.courses.map((c, i) => i === idx ? { ...c, lessons } : c);
                            updateField("learnTab.courses", arr);
                          }}
                          className="bg-slate-900 border border-slate-800 rounded text-xs px-2 py-1 text-white w-full"
                          placeholder="Lesson Title..."
                        />

                        <textarea
                          value={les.content}
                          onChange={(e) => {
                            const lessons = course.lessons.map((l, lIndex) => lIndex === lidx ? { ...l, content: e.target.value } : l);
                            const arr = localDb.learnTab.courses.map((c, i) => i === idx ? { ...c, lessons } : c);
                            updateField("learnTab.courses", arr);
                          }}
                          className="bg-slate-900 border border-slate-800 rounded text-[11px] px-2 py-1.5 text-white w-full h-20"
                          placeholder="Lesson main content details..."
                        />

                        <input
                          type="text"
                          value={les.videoUrl || ""}
                          onChange={(e) => {
                            const lessons = course.lessons.map((l, lIndex) => lIndex === lidx ? { ...l, videoUrl: e.target.value } : l);
                            const arr = localDb.learnTab.courses.map((c, i) => i === idx ? { ...c, lessons } : c);
                            updateField("learnTab.courses", arr);
                          }}
                          className="bg-slate-900 border border-slate-800 rounded text-[10px] px-2 py-1 text-slate-300 w-full"
                          placeholder="Video URL link (Optional)..."
                        />

                        {/* Lesson Quiz editor */}
                        {les.quiz && les.quiz[0] && (
                          <div className="bg-slate-900 p-2.5 rounded border border-slate-850 space-y-2">
                            <span className="text-[9px] uppercase font-bold text-purple-400 block font-mono">Interactive Quiz Question</span>
                            <input
                              type="text"
                              value={les.quiz[0].q}
                              onChange={(e) => {
                                const qObj = { ...les.quiz![0], q: e.target.value };
                                const lessons = course.lessons.map((l, lIndex) => lIndex === lidx ? { ...l, quiz: [qObj] } : l);
                                const arr = localDb.learnTab.courses.map((c, i) => i === idx ? { ...c, lessons } : c);
                                updateField("learnTab.courses", arr);
                              }}
                              className="bg-slate-950 border border-slate-800 text-[11px] px-2 py-1 rounded text-white w-full"
                            />
                            
                            <div className="grid grid-cols-2 gap-1.5 pt-1">
                              {les.quiz[0].options.map((opt, oidx) => (
                                <input
                                  key={oidx}
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const opts = [...les.quiz![0].options];
                                    opts[oidx] = e.target.value;
                                    const qObj = { ...les.quiz![0], options: opts };
                                    const lessons = course.lessons.map((l, lIndex) => lIndex === lidx ? { ...l, quiz: [qObj] } : l);
                                    const arr = localDb.learnTab.courses.map((c, i) => i === idx ? { ...c, lessons } : c);
                                    updateField("learnTab.courses", arr);
                                  }}
                                  className="bg-slate-955 border border-slate-800/80 text-[10px] px-2 py-1 rounded text-slate-300"
                                />
                              ))}
                            </div>

                            <input
                              type="text"
                              placeholder="Correct answer string..."
                              value={les.quiz[0].answer}
                              onChange={(e) => {
                                const qObj = { ...les.quiz![0], answer: e.target.value };
                                const lessons = course.lessons.map((l, lIndex) => lIndex === lidx ? { ...l, quiz: [qObj] } : l);
                                const arr = localDb.learnTab.courses.map((c, i) => i === idx ? { ...c, lessons } : c);
                                updateField("learnTab.courses", arr);
                              }}
                              className="bg-slate-950 border border-slate-800 text-[10px] px-2 py-1 rounded text-emerald-400 w-full"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PDF MANAGER TAB */}
        {activeAdminTab === "pdfs" && (
          <div className="space-y-4" id="editor-pdfs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs uppercase font-bold text-amber-400 tracking-wider">JFZ PDF Library Library</h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Upload deeni booklets or attach archive.org / GDrive direct links.</p>
              </div>
              <button
                onClick={() => {
                  const arr = [...(localDb.pdfsTab?.pdfs || [])];
                  arr.push({
                    id: `pdf-${Date.now()}`,
                    title: "Nayi Deeni Kitab",
                    description: "Abhi is kitab ka ahem wazaif aur masail ka mukammal tareeqa seekhein.",
                    thumbnail: "",
                    pdfUrl: ""
                  });
                  updateField("pdfsTab.pdfs", arr);
                }}
                className="text-[10px] text-amber-400 font-bold border border-slate-800 bg-slate-950 px-2.5 py-1.5 rounded-lg hover:bg-slate-900 transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add New PDF Book
              </button>
            </div>

            <div className="space-y-4">
              {(localDb.pdfsTab?.pdfs || []).map((pdf, idx) => (
                <div key={pdf.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3.5 relative">
                  
                  {/* Row 1: Header indices & actions */}
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Book #{idx + 1} ({pdf.id})</span>
                    <button
                      onClick={() => {
                        const arr = localDb.pdfsTab.pdfs.filter((_, i) => i !== idx);
                        updateField("pdfsTab.pdfs", arr);
                      }}
                      className="text-rose-500 hover:text-rose-400 p-1 bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>

                  {/* Row 2: Columns layout */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    
                    {/* Cover Photo / Thumbnail management (4 cols) */}
                    <div className="md:col-span-3 flex flex-col items-center justify-center bg-slate-900/60 p-2 border border-slate-900 rounded-lg space-y-2">
                      {pdf.thumbnail ? (
                        <div className="relative group/cover w-20 h-28 border border-slate-800 rounded overflow-hidden">
                          <img src={pdf.thumbnail} alt="Cover Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button
                            onClick={() => {
                              const arr = [...localDb.pdfsTab.pdfs];
                              arr[idx] = { ...arr[idx], thumbnail: "" };
                              updateField("pdfsTab.pdfs", arr);
                            }}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover/cover:opacity-100 flex items-center justify-center text-rose-400 text-[10px] font-black transition-opacity uppercase"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-28 border-2 border-dashed border-slate-800 rounded flex flex-col items-center justify-center text-slate-600">
                          <ImageIcon className="w-6 h-6 mb-1 text-slate-700" />
                          <span className="text-[8px] font-bold">No Cover</span>
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-1 w-full text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 2 * 1024 * 1024) {
                              alert("Size under 2MB please.");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                const arr = [...localDb.pdfsTab.pdfs];
                                arr[idx] = { ...arr[idx], thumbnail: event.target.result as string };
                                updateField("pdfsTab.pdfs", arr);
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                          className="hidden"
                          id={`cover-file-${pdf.id}`}
                        />
                        <label
                          htmlFor={`cover-file-${pdf.id}`}
                          className="cursor-pointer bg-slate-900 ring-1 ring-slate-800 hover:ring-slate-700 hover:text-white px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded text-slate-400 block transition-all"
                        >
                          Upload Cover
                        </label>
                      </div>
                    </div>

                    {/* Book Metadata Fields (9 cols) */}
                    <div className="md:col-span-9 space-y-3">
                      <div>
                        <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block mb-1">Kitab ka Naam / Title</label>
                        <input
                          type="text"
                          value={pdf.title}
                          onChange={(e) => {
                            const arr = localDb.pdfsTab.pdfs.map((item, i) => i === idx ? { ...item, title: e.target.value } : item);
                            updateField("pdfsTab.pdfs", arr);
                          }}
                          className="bg-slate-900 border border-slate-800 rounded-[10px] px-3 py-1.5 text-xs text-white w-full font-bold focus:border-amber-500 outline-none"
                          placeholder="e.g., Kamil Namaz Sunni Tareeqa"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block mb-1">Description / Tafseel</label>
                        <textarea
                          value={pdf.description}
                          onChange={(e) => {
                            const arr = localDb.pdfsTab.pdfs.map((item, i) => i === idx ? { ...item, description: e.target.value } : item);
                            updateField("pdfsTab.pdfs", arr);
                          }}
                          rows={2}
                          className="bg-slate-900 border border-slate-800 rounded-[10px] px-3 py-1.5 text-xs text-slate-300 w-full font-bold focus:border-amber-500 outline-none resize-none"
                          placeholder="Kitab ke mutaliq choti si jankari likhein..."
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-8">
                          <label className="text-[9px] text-slate-500 font-bold uppercase font-mono block mb-1">
                            PDF Link / Document URI (or Upload below)
                          </label>
                          <input
                            type="text"
                            value={pdf.pdfUrl}
                            onChange={(e) => {
                              const arr = localDb.pdfsTab.pdfs.map((item, i) => i === idx ? { ...item, pdfUrl: e.target.value } : item);
                              updateField("pdfsTab.pdfs", arr);
                            }}
                            className="bg-slate-900 border border-slate-800 rounded-[10px] px-3 py-1.5 text-xs text-slate-300 w-full font-bold focus:border-amber-500 outline-none truncate"
                            placeholder="https://example.com/books/namaz.pdf aur upload niche se karein..."
                          />
                        </div>

                        <div className="sm:col-span-4 select-none">
                          <input
                            type="file"
                            accept="application/pdf"
                            disabled={uploadingPdfId === pdf.id}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 2048 * 1024 * 1024) {
                                alert("Document size check: Yeh file bahut badi hai! Kripya update/upload karne ke liye 2GB se kam ki PDF chunein.");
                                return;
                              }
                              setUploadingPdfId(pdf.id);

                              const CHUNK_SIZE = 500 * 1024; // 500 KB chunk size ensures safe base64 expansion under Firestore's strict 1MB doc limit
                              const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

                              const uploadProcess = async () => {
                                try {
                                  // 1. Initialize upload session
                                  const initRes = await fetch("/api/upload-pdf-init", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ fileName: file.name, totalChunks })
                                  });
                                  if (!initRes.ok) throw new Error("Could not initialize upload session on server.");
                                  const { pdfId } = await initRes.json();

                                  // 2. Slice and upload chunk by chunk sequentially
                                  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                                    const start = chunkIndex * CHUNK_SIZE;
                                    const end = Math.min(start + CHUNK_SIZE, file.size);
                                    const sliceBlob = file.slice(start, end);

                                    // Convert slice to base64
                                    const chunkDataBase64 = await new Promise<string>((resolve, reject) => {
                                      const reader = new FileReader();
                                      reader.onload = () => {
                                        if (typeof reader.result === "string") {
                                          const base64Str = reader.result.split(";base64,")[1];
                                          resolve(base64Str);
                                        } else {
                                          reject(new Error("File format read failed on index " + chunkIndex));
                                        }
                                      };
                                      reader.onerror = () => reject(reader.error);
                                      reader.readAsDataURL(sliceBlob);
                                    });

                                    // Push segment to cloud database and server storage
                                    const chunkRes = await fetch("/api/upload-pdf-chunk", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        pdfId,
                                        chunkIndex,
                                        totalChunks,
                                        chunkData: chunkDataBase64
                                      })
                                    });
                                    if (!chunkRes.ok) {
                                      throw new Error(`Failed to upload segment ${chunkIndex + 1} of ${totalChunks}`);
                                    }
                                  }

                                  // 3. Complete and compile file on system
                                  const completeRes = await fetch("/api/upload-pdf-complete", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ pdfId, fileName: file.name, totalChunks })
                                  });
                                  if (!completeRes.ok) throw new Error("Session finalize failed during compilation.");
                                  const completeData = await completeRes.json();

                                  // Save response pdfUrl to database state structure
                                  const arr = [...localDb.pdfsTab.pdfs];
                                  arr[idx] = { ...arr[idx], pdfUrl: completeData.pdfUrl };
                                  updateField("pdfsTab.pdfs", arr);

                                } catch (error: any) {
                                  alert("PDF Upload Error: " + (error.message || "Failed to sync completely."));
                                } finally {
                                  setUploadingPdfId(null);
                                }
                              };

                              uploadProcess();
                            }}
                            className="hidden"
                            id={`pdf-file-upload-${pdf.id}`}
                          />
                          <label
                            htmlFor={uploadingPdfId === pdf.id ? undefined : `pdf-file-upload-${pdf.id}`}
                            className={`cursor-pointer ${uploadingPdfId === pdf.id ? "bg-slate-800 text-slate-400" : "bg-amber-500 text-slate-950 hover:bg-amber-600"} font-black px-2.5 py-1.5 text-[10px] rounded-[10px] flex items-center justify-center gap-1 tracking-wider transition-colors uppercase h-9 shadow-inner select-none`}
                          >
                            {uploadingPdfId === pdf.id ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Uploading To Cloud...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                                {(pdf.pdfUrl && (pdf.pdfUrl.startsWith("data:") || pdf.pdfUrl.includes("/api/view-pdf/"))) ? "Change PDF File" : "Upload any PDF"}
                              </>
                            )}
                          </label>
                        </div>
                      </div>

                      {/* Password Protection Option */}
                      <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800/80 mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-0.5">
                          <label className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wide block">Password Lock (Optional)</label>
                          <span className="text-[9.5px] text-slate-500 font-bold block">Keep empty if public. If set, users must enter this password to view or download.</span>
                        </div>
                        <input
                          type="text"
                          value={pdf.password || ""}
                          onChange={(e) => {
                            const arr = localDb.pdfsTab.pdfs.map((item, i) => i === idx ? { ...item, password: e.target.value } : item);
                            updateField("pdfsTab.pdfs", arr);
                          }}
                          className="bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-650 font-mono font-bold outline-none w-full sm:w-48 text-left"
                          placeholder="No Password"
                        />
                      </div>

                      {/* PDF Source indicator */}
                      <div className="text-[9.5px] font-mono text-slate-500 flex items-center gap-1 pt-1 justify-between">
                        <span>
                          Current: {pdf.pdfUrl ? (pdf.pdfUrl.includes("/api/view-pdf/") ? "☁️ Cloud Synced PDF Doc (Safe)" : pdf.pdfUrl.startsWith("data:") ? "⚠️ Local Base64 Doc (Big Size)" : "🌐 Web Link Resource URL") : "❌ No document attached"}
                        </span>
                        {pdf.pdfUrl && (pdf.pdfUrl.startsWith("data:") || pdf.pdfUrl.includes("/api/view-pdf/")) && (
                          <button
                            onClick={() => {
                              const arr = [...localDb.pdfsTab.pdfs];
                              arr[idx] = { ...arr[idx], pdfUrl: "" };
                              updateField("pdfsTab.pdfs", arr);
                            }}
                            className="text-amber-500 hover:underline leading-none/9 cursor-pointer"
                          >
                            Reset Link
                          </button>
                        )}
                      </div>

                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* VAULT ARTICLES TAB */}
        {activeAdminTab === "vault" && (
          <div className="space-y-4" id="editor-vault">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-bold text-amber-400 tracking-wider">Kutub Khana Vault Library</h3>
              <button
                onClick={() => {
                  const arr = [...localDb.vaultTab.articles];
                  arr.push({
                    id: `art-${Date.now()}`,
                    title: "New sunnah lessons",
                    category: "Sunnah Habits",
                    content: "Main body content details and references go here..."
                  });
                  updateField("vaultTab.articles", arr);
                }}
                className="text-[10px] text-amber-400 font-bold border border-slate-800 bg-slate-950 px-2 py-1 rounded"
              >
                + Add Article
              </button>
            </div>

            <div className="space-y-4">
              {localDb.vaultTab.articles.map((art, idx) => (
                <div key={art.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-slate-500">Article #{idx+1}</span>
                    <button
                      onClick={() => {
                        const arr = localDb.vaultTab.articles.filter((_, i) => i !== idx);
                        updateField("vaultTab.articles", arr);
                      }}
                      className="text-rose-500 hover:text-rose-400 bg-rose-500/10 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Title..."
                      value={art.title}
                      onChange={(e) => {
                        const arr = localDb.vaultTab.articles.map((a, i) => i === idx ? { ...a, title: e.target.value } : a);
                        updateField("vaultTab.articles", arr);
                      }}
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white font-bold"
                    />
                    
                    <select
                      value={art.category}
                      onChange={(e) => {
                        const arr = localDb.vaultTab.articles.map((a, i) => i === idx ? { ...a, category: e.target.value } : a);
                        updateField("vaultTab.articles", arr);
                      }}
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300"
                    >
                      {localDb.vaultTab.categories.map((c, ci) => (
                        <option key={ci} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <textarea
                    placeholder="Article Content body description..."
                    value={art.content}
                    onChange={(e) => {
                      const arr = localDb.vaultTab.articles.map((a, i) => i === idx ? { ...a, content: e.target.value } : a);
                      updateField("vaultTab.articles", arr);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded text-xs px-2 py-1.5 text-white h-24"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
