import React, { useState, useEffect } from "react";
import { DatabaseState } from "./types";
import HomeTab from "./components/HomeTab";
import AskTab from "./components/AskTab";
import GuidesTab from "./components/GuidesTab";
import LearnTab from "./components/LearnTab";
import PdfsTab from "./components/PdfsTab";
import VaultTab from "./components/VaultTab";
import AdminPanel from "./components/AdminPanel";
import { 
  Home as HomeIcon, MessageSquare, Compass, GraduationCap, 
  BookOpen, Settings, CheckCircle2, ShieldAlert, FileText 
} from "lucide-react";

export default function App() {
  const [db, setDb] = useState<DatabaseState | null>(null);
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  // Real-time clock tick for PC sidebar details updates
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    tick();
    const interval = setInterval(tick, 20000);
    return () => clearInterval(interval);
  }, []);

  // Retrieve entire DB on load, manually triggered refreshes, or real-time 5s auto-polling
  useEffect(() => {
    async function fetchDb(silent = false) {
      try {
        const res = await fetch("/api/db");
        if (res.ok) {
          const data = await res.json();
          setDb(data);
          if (loadError) setLoadError("");
        } else if (!silent) {
          setLoadError("Database files failed to synchronize.");
        }
      } catch (err: any) {
        console.error("Fetch DB error:", err);
        if (!silent) {
          setLoadError("Network connectivity problem. Could not establish Sync.");
        }
      }
    }

    // Immediate initial fetch
    fetchDb(false);

    // Dynamic background polling loop to sync edits in real-time across all devices
    const pollInterval = setInterval(() => {
      fetchDb(true);
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [refreshTrigger, loadError]);

  const handleUpdateDatabase = async (newDb: DatabaseState): Promise<boolean> => {
    try {
      const res = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newDb,
          password: newDb.adminPassword
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDb(data.db);
        setRefreshTrigger((prev) => prev + 1);
        return true;
      }
    } catch (err) {
      console.error("Save database error:", err);
    }
    return false;
  };

  const getThemeHighlight = () => {
    const defaultTheme = {
      textColor: "text-emerald-600",
      itemActiveColor: "bg-emerald-50 text-emerald-700 border border-emerald-100/80 shadow-sm shadow-emerald-50/50",
      borderHover: "hover:border-emerald-300"
    };
    if (!db) return defaultTheme;
    switch (db.primaryColor) {
      case "emerald":
        return defaultTheme;
      case "gold":
        return {
          textColor: "text-amber-600",
          itemActiveColor: "bg-amber-50 text-amber-700 border border-amber-100/80 shadow-sm shadow-amber-50/50",
          borderHover: "hover:border-amber-300"
        };
      case "sky":
        return {
          textColor: "text-sky-600",
          itemActiveColor: "bg-sky-50 text-sky-700 border border-sky-100/80 shadow-sm shadow-sky-50/50",
          borderHover: "hover:border-sky-300"
        };
      case "indigo":
        return {
          textColor: "text-indigo-600",
          itemActiveColor: "bg-indigo-50 text-indigo-700 border border-indigo-100/80 shadow-sm shadow-indigo-50/50",
          borderHover: "hover:border-indigo-300"
        };
      case "slate":
      default:
        return {
          textColor: "text-slate-700",
          itemActiveColor: "bg-slate-100 text-slate-800 border border-slate-200 font-bold",
          borderHover: "hover:border-slate-300"
        };
    }
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 text-center" id="error-screen">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm space-y-4 shadow-xl">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto animate-bounce" />
          <h2 className="text-md font-extrabold uppercase tracking-widest text-slate-200">Sync Pipeline Failure</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {loadError}. Please double-check if your Express dev server has completed compilation and is online.
          </p>
          <button 
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="w-full bg-slate-800 hover:bg-slate-700 font-bold text-xs py-2.5 rounded-xl border border-slate-700 active:scale-95 transition-all"
          >
            Retry Synchronization
          </button>
        </div>
      </div>
    );
  }

  if (!db) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center text-center font-sans tracking-wider" id="loading-screen">
        <div className="space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h1 className="text-xs uppercase font-extrabold text-slate-500 tracking-widest animate-pulse">JFZ Digital Scholars booting...</h1>
        </div>
      </div>
    );
  }

  const th = getThemeHighlight();

  return (
    <div className="h-[100dvh] w-full bg-slate-50 text-slate-800 font-sans select-none overflow-hidden" id="app-wrapper">
      {/* Full Screen content viewport */}
      <div className="w-full h-full relative flex flex-col md:flex-row overflow-hidden">
        
        {/* DESKTOP LEFT SIDEBAR PANEL (Visible only on md screens and above) */}
        <div className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 p-5 shrink-0 justify-between">
          <div className="space-y-6">
            {/* Logo Image & Branding */}
            <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
              {db.logoImage ? (
                <img 
                  src={db.logoImage} 
                  alt="App Logo" 
                  className="w-10 h-10 rounded-xl object-cover shadow border border-slate-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-500 flex items-center justify-center text-xl font-black shadow-inner shadow-black/15">
                  🕌
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-xs font-black tracking-tight text-slate-900 uppercase truncate" title={db.logoText || "JFZ Scholars"}>
                  {db.logoText || "JFZ Scholars"}
                </h1>
                <a 
                  href="https://www.adflect.in" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[8.5px] text-slate-450 hover:text-emerald-705 font-black tracking-tight block mt-1.5 transition-colors select-none leading-none"
                >
                  Made by <span className="underline decoration-slate-200">Adflect</span>
                </a>
              </div>
            </div>

            {/* Navigation item vertical list */}
            <div className="space-y-1.5">
              <span className="text-[9px] text-slate-400 font-mono font-black uppercase tracking-widest block pl-2.5 mb-2">Navigator</span>
              {[
                { id: "home", label: "Home Screen", icon: HomeIcon },
                { id: "ask", label: "Ask Islamic AI", icon: MessageSquare },
                { id: "guides", label: "Authentic Guides", icon: Compass },
                { id: "learn", label: "JFZ Courses", icon: GraduationCap },
                { id: "pdfs", label: "JFZ PDFs", icon: FileText },
                { id: "vault", label: "Kutub Khana Vault", icon: BookOpen }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = !showAdminPortal && currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setShowAdminPortal(false);
                      setCurrentTab(item.id);
                    }}
                    className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl transition-all text-left ${
                      isActive 
                        ? th.itemActiveColor + " font-black translate-x-1" 
                        : "text-slate-650 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold tracking-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer controls inside sidebar */}
          <div className="space-y-3.5 pt-3.5 border-t border-slate-100">
            {currentTime && (
              <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-150 flex items-center justify-between text-slate-600">
                <span className="text-[9px] uppercase font-bold tracking-wide text-slate-400">Time (Waqt)</span>
                <span className="text-xs font-mono font-black text-slate-800">{currentTime}</span>
              </div>
            )}

            {/* Settings uploader manager */}
            <button
              onClick={() => setShowAdminPortal(!showAdminPortal)}
              className={`flex items-center gap-2.5 w-full px-3.5 py-3 rounded-xl transition-all border text-left ${
                showAdminPortal 
                  ? "bg-slate-900 border-slate-900 text-white shadow-md font-black" 
                  : "bg-slate-50 border-slate-200 text-slate-650 hover:text-slate-900 hover:bg-slate-100 font-bold"
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span className="text-xs tracking-tight">{showAdminPortal ? "Active Editor" : "Manage Settings"}</span>
            </button>
          </div>
        </div>

        {/* MAIN BODY LAYOUT LAYER */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-slate-50">
          
          {/* Notch Header Simulation (Visible only on MOBILE) */}
          <div className="md:hidden bg-white shrink-0 px-6 pt-5 pb-3.5 border-b border-slate-200 text-slate-800 flex items-center justify-between shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3">
              {db.logoImage ? (
                <img 
                  src={db.logoImage} 
                  alt="App Logo" 
                  className="w-9 h-9 rounded-xl object-cover shadow border border-slate-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-500 flex items-center justify-center text-lg font-black shadow-inner shadow-black/15">
                  🕌
                </div>
              )}
              <div>
                <h1 className="text-sm font-black tracking-tight text-slate-900 uppercase">{db.logoText || "JFZ Scholars"}</h1>
                <a 
                  href="https://www.adflect.in" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[9px] text-slate-450 hover:text-emerald-705 font-black tracking-tight block mt-1 transition-colors select-none leading-none"
                >
                  Made by <span className="underline decoration-slate-200">Adflect</span>
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Visual Admin Controller toggle */}
              <button
                onClick={() => setShowAdminPortal(!showAdminPortal)}
                className={`p-2.5 rounded-xl transition-all border-2 ${
                  showAdminPortal 
                    ? "bg-slate-900 border-slate-900 text-white shadow-md scale-105" 
                    : "bg-slate-50 border-slate-200 text-slate-650 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title="Admin Portal Toggle"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Dynamic header notification banner (Visible on both Mobile + PC) */}
          {!showAdminPortal && (
            <div className="bg-emerald-600 px-5 py-2 text-center text-xs text-white font-extrabold select-none truncate shadow-inner tracking-wide">
              {db.headerBanner}
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto px-5 py-5 pb-24 md:pb-6 min-h-0 bg-slate-50">
            
            {/* If admin toggled */}
            {showAdminPortal ? (
              <AdminPanel 
                db={db}
                onSave={handleUpdateDatabase}
                onClose={() => setShowAdminPortal(false)}
              />
            ) : (
              <div className="w-full max-w-5xl mx-auto space-y-6">
                {currentTab === "home" && (
                  <HomeTab db={db} onNavigate={(target) => setCurrentTab(target)} />
                )}
                {currentTab === "ask" && (
                  <AskTab db={db} />
                )}
                {currentTab === "guides" && (
                  <GuidesTab db={db} />
                )}
                {currentTab === "learn" && (
                  <LearnTab db={db} />
                )}
                {currentTab === "pdfs" && (
                  <PdfsTab db={db} />
                )}
                {currentTab === "vault" && (
                  <VaultTab db={db} />
                )}
              </div>
            )}


          </div>

          {/* Dynamic bottom-nav menu (Visible only on MOBILE) */}
          {!showAdminPortal && (
            <div className="md:hidden absolute bottom-0 inset-x-0 bg-white border-t border-slate-200 shrink-0 z-30 pb-5 pt-3.5 px-3 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-around">
                
                <button
                  onClick={() => setCurrentTab("home")}
                  className={`flex flex-col items-center justify-center w-14 py-2 rounded-2xl transition-all ${
                    currentTab === "home" ? th.itemActiveColor + " font-black" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <HomeIcon className="w-5 h-5 mb-1 shrink-0" />
                  <span className="text-[10px] font-extrabold tracking-tight">Home</span>
                </button>
   
                <button
                  onClick={() => setCurrentTab("ask")}
                  className={`flex flex-col items-center justify-center w-14 py-2 rounded-2xl transition-all ${
                    currentTab === "ask" ? th.itemActiveColor + " font-black" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <MessageSquare className="w-5 h-5 mb-1 shrink-0" />
                  <span className="text-[10px] font-extrabold tracking-tight">Ask AI</span>
                </button>

                <button
                  onClick={() => setCurrentTab("guides")}
                  className={`flex flex-col items-center justify-center w-14 py-2 rounded-2xl transition-all ${
                    currentTab === "guides" ? th.itemActiveColor + " font-black" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Compass className="w-5 h-5 mb-1 shrink-0" />
                  <span className="text-[10px] font-extrabold tracking-tight">Guides</span>
                </button>

                <button
                  onClick={() => setCurrentTab("learn")}
                  className={`flex flex-col items-center justify-center w-14 py-2 rounded-2xl transition-all ${
                    currentTab === "learn" ? th.itemActiveColor + " font-black" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <GraduationCap className="w-5 h-5 mb-1 shrink-0" />
                  <span className="text-[10px] font-extrabold tracking-tight">JFZ Courses</span>
                </button>

                <button
                  onClick={() => setCurrentTab("pdfs")}
                  className={`flex flex-col items-center justify-center w-14 py-2 rounded-2xl transition-all ${
                    currentTab === "pdfs" ? th.itemActiveColor + " font-black" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <FileText className="w-5 h-5 mb-1 shrink-0" />
                  <span className="text-[10px] font-extrabold tracking-tight">JFZ PDFs</span>
                </button>

                <button
                  onClick={() => setCurrentTab("vault")}
                  className={`flex flex-col items-center justify-center w-14 py-2 rounded-2xl transition-all ${
                    currentTab === "vault" ? th.itemActiveColor + " font-black" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <BookOpen className="w-5 h-5 mb-1 shrink-0" />
                  <span className="text-[10px] font-extrabold tracking-tight">Vault</span>
                </button>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
