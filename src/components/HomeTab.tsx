import React, { useState, useEffect } from "react";
import { DatabaseState, PrayerTiming } from "../types";
import { 
  Clock, BookOpen, Quote, Heart, AlertCircle, Copy, Check, Share2, 
  ChevronRight, Calendar, ArrowUpRight, Flame, MapPin, Search, Navigation, Info,
  PlayCircle
} from "lucide-react";

interface HomeTabProps {
  db: DatabaseState;
  onNavigate: (tab: string) => void;
}

function getYouTubeEmbedUrl(url: string) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return null;
}

export default function HomeTab({ db, onNavigate }: HomeTabProps) {
  const { homeTab, announcements, primaryColor } = db;
  const [currentTime, setCurrentTime] = useState("");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Geo and manual city states for personalized real-time Sunni Hanafi prayer timings
  const [locationName, setLocationName] = useState(() => {
    return localStorage.getItem("jfz_prayer_location_name") || "Mumbai (Default)";
  });
  
  const [prayerTimings, setPrayerTimings] = useState<any[]>(() => {
    const saved = localStorage.getItem("jfz_prayer_timings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return homeTab.prayerSection.timings;
  });

  const [cityInput, setCityInput] = useState("");
  const [countryInput, setCountryInput] = useState("India");
  const [loadingTimings, setLoadingTimings] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const formatTo12Hour = (time24: string) => {
    if (!time24) return "";
    const cleanTime = time24.split(" ")[0]; // Clean off any weird format appends
    const [hourStr, minStr] = cleanTime.split(":");
    const hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour.toString().padStart(2, '0')}:${minStr} ${ampm}`;
  };

  const updateTimingsInStateAndStorage = (apiTimings: any, locName: string) => {
    const updated = [
      { name: "Fajr", time: formatTo12Hour(apiTimings.Fajr), active: true },
      { name: "Sunrise", time: formatTo12Hour(apiTimings.Sunrise), active: true },
      { name: "Dhuhr", time: formatTo12Hour(apiTimings.Dhuhr), active: true },
      { name: "Asr", time: formatTo12Hour(apiTimings.Asr), active: true },
      { name: "Maghrib", time: formatTo12Hour(apiTimings.Maghrib), active: true },
      { name: "Isha", time: formatTo12Hour(apiTimings.Isha), active: true }
    ];
    setPrayerTimings(updated);
    setLocationName(locName);
    localStorage.setItem("jfz_prayer_timings", JSON.stringify(updated));
    localStorage.setItem("jfz_prayer_location_name", locName);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setLoadingTimings(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Sunni Hanafi system parameters: method=1 (University of Islamic Sciences, Karachi), school=1 (Hanafi)
          const response = await fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=1&school=1`);
          const data = await response.json();
          if (data && data.code === 200) {
            const tz = data.data.meta.timezone || "Detected Zone";
            updateTimingsInStateAndStorage(data.data.timings, `Loc: ${tz.split("/")[1] || tz} (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`);
            setShowLocationModal(false);
          } else {
            throw new Error("API returned invalid status code");
          }
        } catch (err) {
          console.error(err);
          setLocationError("Aladhan API se timings fetch nahi ho paye.");
        } finally {
          setLoadingTimings(false);
        }
      },
      (error) => {
        console.error(error);
        setLoadingTimings(false);
        setLocationError("Location permission block hai ya accuracy low hai. Kripya niche City Search feature use karein.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSearchCityByAPI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) {
      setLocationError("Kripya City name fill karein.");
      return;
    }
    setLoadingTimings(true);
    setLocationError(null);

    try {
      const encodedCity = encodeURIComponent(cityInput.trim());
      const encodedCountry = encodeURIComponent((countryInput || "India").trim());
      // school=1 Hanafi school, method=1 Karachi Sunni
      const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodedCity}&country=${encodedCountry}&method=1&school=1`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.code === 200) {
        const titleFormatted = `${cityInput.trim().toUpperCase()}, ${countryInput.trim().toUpperCase()}`;
        updateTimingsInStateAndStorage(data.data.timings, titleFormatted);
        setShowLocationModal(false);
        setCityInput("");
      } else {
        throw new Error("Invalid response status code");
      }
    } catch (err) {
      console.error(err);
      setLocationError("City or Country match nahi hua. Spellings check karein.");
    } finally {
      setLoadingTimings(false);
    }
  };

  // Approximate Hijri date for June 2026 (roughly Dhul-Hijjah 1447 AH)
  const getHijriDate = () => {
    return "24 Dhul-Hijjah 1447 AH";
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const getThemeColors = () => {
    switch (primaryColor) {
      case "emerald":
        return {
          bg: "bg-emerald-600",
          text: "text-emerald-600",
          border: "border-emerald-100",
          lightBg: "bg-emerald-50",
          accentText: "text-emerald-800",
          shadow: "shadow-emerald-150/40"
        };
      case "gold":
        return {
          bg: "bg-amber-600",
          text: "text-amber-600",
          border: "border-amber-100",
          lightBg: "bg-amber-50",
          accentText: "text-amber-805",
          shadow: "shadow-amber-150/40"
        };
      case "sky":
        return {
          bg: "bg-sky-600",
          text: "text-sky-600",
          border: "border-sky-100",
          lightBg: "bg-sky-50",
          accentText: "text-sky-800",
          shadow: "shadow-sky-150/40"
        };
      case "indigo":
        return {
          bg: "bg-indigo-600",
          text: "text-indigo-600",
          border: "border-indigo-100",
          lightBg: "bg-indigo-50",
          accentText: "text-indigo-800",
          shadow: "shadow-indigo-150/40"
        };
      case "slate":
      default:
        return {
          bg: "bg-slate-700",
          text: "text-slate-700",
          border: "border-slate-200",
          lightBg: "bg-slate-100",
          accentText: "text-slate-900",
          shadow: "shadow-slate-150/40"
        };
    }
  };

  const t = getThemeColors();

  // Map the rendering of components dynamically based on the sectionOrder
  const renderSection = (sectionName: string) => {
    switch (sectionName) {
      case "prayer":
        if (!homeTab.prayerSection.visible) return null;
        return (
          <div key="prayer" id="prayer-tracker-section" className="bg-white rounded-[24px] p-6 border-2 border-slate-100 shadow-sm shadow-slate-150/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
                {homeTab.prayerSection.title || "Salah Timings"} (Hanafi)
              </span>
              <Calendar className="w-5 h-5 text-slate-400" />
            </div>
            
            <div className="grid grid-cols-3 gap-2.5">
              {prayerTimings.map((p: any, idx: number) => {
                if (!p.active) return null;
                return (
                  <div key={idx} className="bg-slate-50 rounded-xl p-3.5 border border-slate-205 text-center flex flex-col justify-between transition-all hover:border-emerald-400 hover:scale-[1.03] duration-150 hover:shadow-xs">
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">{p.name}</span>
                    <span className="text-base font-black text-slate-800 mt-1.5 leading-none">{p.time}</span>
                  </div>
                );
              })}
            </div>

            {/* Personalized Location indicator */}
            <div className="flex items-center justify-between text-xs mt-4.5 pt-3.5 border-t border-slate-200/70 font-sans text-slate-500">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate text-slate-705 text-xs text-slate-600 font-medium">Location: <span className="text-emerald-700 font-black">{locationName}</span></span>
              </div>
              <button 
                onClick={() => setShowLocationModal(!showLocationModal)}
                className="text-[10px] font-black text-emerald-600 bg-emerald-50/80 hover:bg-emerald-100 border-2 border-emerald-100 px-3 py-1.5 rounded-xl transition-all shrink-0 uppercase tracking-wide active:scale-95"
              >
                Change Loc
              </button>
            </div>

            {/* Compact collapsible change settings menu */}
            {showLocationModal && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3.5 font-sans transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Info className="w-4 h-4 text-slate-400" />
                    Sunni Hanafi Calculation Settings
                  </span>
                  <button onClick={() => setShowLocationModal(false)} className="text-xs font-extrabold text-rose-500 hover:underline">
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handleDetectLocation}
                    disabled={loadingTimings}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-350 text-white font-black p-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                  >
                    <Navigation className="w-3.5 h-3.5 animate-pulse" />
                    {loadingTimings ? "Detecting..." : "GPS Auto Detect"}
                  </button>
                  
                  <div className="text-[10px] text-slate-450 font-semibold leading-tight flex items-center">
                    Uses physical location for precise Hanafi calculations.
                  </div>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t-2 border-slate-200"></div>
                  <span className="flex-shrink mx-2.5 text-[9px] text-slate-400 font-black uppercase tracking-widest">Or Search manually</span>
                  <div className="flex-grow border-t-2 border-slate-200"></div>
                </div>

                <form onSubmit={handleSearchCityByAPI} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[9px] font-black text-slate-450 uppercase block mb-1">City Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Mumbai"
                        value={cityInput}
                        onChange={(e) => setCityInput(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-450 uppercase block mb-1">Country</label>
                      <input 
                        type="text" 
                        placeholder="e.g. India"
                        value={countryInput}
                        onChange={(e) => setCountryInput(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white font-medium"
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loadingTimings}
                    className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-350 text-white font-black py-2.5 rounded-xl text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Search className="w-3.5 h-3.5" />
                    {loadingTimings ? "Loading Timings..." : "Fetch Times"}
                  </button>
                </form>

                {locationError && (
                  <div className="text-xs text-rose-600 bg-rose-50 border-2 border-rose-100 p-2.5 rounded-xl font-bold flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{locationError}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case "ayah":
        if (!homeTab.dailyAyah.visible) return null;
        return (
          <div key="ayah" id="ayah-section" className="bg-white rounded-[24px] p-6 border-2 border-slate-100 shadow-sm relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 p-8 text-slate-100/50 pointer-events-none">
              <BookOpen className="w-28 h-28" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-xl ${t.lightBg} ${t.text} border border-emerald-100`}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                  {homeTab.dailyAyah.title || "Daily Ayah"}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">Verse {homeTab.dailyAyah.verseId}</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl text-right font-serif leading-loose text-slate-900 font-black mb-4 dir-rtl tracking-wide">
                {homeTab.dailyAyah.arabic}
              </p>
              <p className="text-sm text-slate-755 text-slate-705 leading-relaxed font-extrabold italic bg-slate-50/70 p-4 rounded-2xl border-l-[6px] border-emerald-500 text-slate-800">
                "{homeTab.dailyAyah.translation}"
              </p>
            </div>
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-extrabold">Sunni Quranic Companion</span>
              <button 
                onClick={() => handleCopy(`${homeTab.dailyAyah.arabic} \n"${homeTab.dailyAyah.translation}" (${homeTab.dailyAyah.verseId})`, "ayah")}
                className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border-2 border-slate-200/80 active:scale-95 transition-all font-bold"
              >
                {copiedText === "ayah" ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-black">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Ayah</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case "hadith":
        if (!homeTab.dailyHadith.visible) return null;
        return (
          <div key="hadith" id="hadith-section" className="bg-white rounded-[24px] p-6 border-2 border-slate-100 shadow-sm relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 p-8 text-slate-100/50 pointer-events-none">
              <Quote className="w-28 h-28" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-xl ${t.lightBg} ${t.text} border border-emerald-100`}>
                  <Quote className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                  {homeTab.dailyHadith.title || "Daily Hadith"}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">{homeTab.dailyHadith.reference}</span>
            </div>
            <p className="text-sm text-slate-800 leading-relaxed mt-3 bg-slate-50/65 p-4 rounded-2xl border-l-[6px] border-emerald-500 font-extrabold italic">
              "{homeTab.dailyHadith.text}"
            </p>
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
              <span className="text-[11px] text-slate-450 font-mono font-bold">Source: {homeTab.dailyHadith.reference}</span>
              <button 
                onClick={() => handleCopy(`Hadith: "${homeTab.dailyHadith.text}" - [${homeTab.dailyHadith.reference}]`, "hadith")}
                className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border-2 border-slate-200/80 active:scale-95 transition-all font-bold"
              >
                {copiedText === "hadith" ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-black">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Hadith</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case "dua":
        if (!homeTab.dailyDua.visible) return null;
        return (
          <div key="dua" id="dua-section" className="bg-white rounded-[24px] p-6 border-2 border-slate-100 shadow-sm transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-xl ${t.lightBg} ${t.text} border border-emerald-100`}>
                  <Heart className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                  {homeTab.dailyDua.title || "Dua of the Day"}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">{homeTab.dailyDua.reference}</span>
            </div>
            <div className="mt-4 text-center">
              <p className="text-3xl font-serif text-slate-900 py-3 tracking-wide leading-relaxed mb-4 font-black">
                {homeTab.dailyDua.arabic}
              </p>
              <p className="text-sm font-extrabold text-slate-705 text-slate-755 leading-relaxed bg-amber-50/70 p-4 rounded-2xl border-l-[6px] border-amber-400 text-left">
                "{homeTab.dailyDua.translation}"
              </p>
            </div>
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-medium">Quranic supplicational guidance</span>
              <button 
                onClick={() => handleCopy(`Dua: ${homeTab.dailyDua.arabic} \nTranslation: "${homeTab.dailyDua.translation}" (${homeTab.dailyDua.reference})`, "dua")}
                className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border-2 border-slate-200/80 active:scale-95 transition-all font-bold"
              >
                {copiedText === "dua" ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-black">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Dua</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case "reminder":
        if (!homeTab.reminder.visible) return null;
        return (
          <div key="reminder" id="reminder-section" className="bg-amber-50/70 rounded-[24px] p-5 border-2 border-amber-200/70 text-slate-750 flex items-start gap-4 shadow-sm transition-all duration-300">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <span className="text-xs sm:text-sm font-black text-amber-900 uppercase tracking-wider block mb-1">
                {homeTab.reminder.title || "Daily Reminder"}
              </span>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-800 font-extrabold">
                {homeTab.reminder.text}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Clock Block */}
      <div className="bg-gradient-to-tr from-slate-900 to-slate-800 rounded-[28px] p-6 text-white relative overflow-hidden flex items-center justify-between shadow-lg shadow-slate-900/10">
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-radial from-slate-50/10 to-transparent pointer-events-none" />
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-zinc-300 text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>{getHijriDate()}</span>
          </div>
          <div className="text-3xl font-black font-sans tracking-tight text-white">{currentTime || "Loading..."}</div>
        </div>
        <div className="text-right z-10">
          <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Companion state</div>
          <div className="inline-flex items-center gap-1.5 mt-2 bg-emerald-500/20 text-emerald-400 text-[10.5px] px-3.5 py-1 rounded-full border border-emerald-500/30 font-black uppercase shadow-inner">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            Online
          </div>
        </div>
      </div>

      {/* Announcements Carousel Panel */}
      {announcements && announcements.some(a => a.active) && (
        <div className="space-y-2.5">
          {announcements
            .filter(a => a.active)
            .map((ann) => (
              <div 
                key={ann.id} 
                className="bg-sky-50 border-2 border-sky-100 text-sky-800 rounded-2xl p-4 text-xs flex items-center gap-3.5 shadow-xs"
              >
                <div className="bg-sky-100/80 p-2 rounded-xl shrink-0">
                  <span className="text-sky-800 text-[10px] font-black tracking-wider uppercase px-1">INFO</span>
                </div>
                <p className="leading-relaxed font-extrabold text-slate-800">{ann.text}</p>
              </div>
            ))}
        </div>
      )}

      {/* Dynamic Render Order of main Sections managed by Admin */}
      {homeTab.sectionsOrder.map((section) => renderSection(section))}

      {/* Scholars Video Feed Block */}
      {db.videos && db.videos.length > 0 && (
        <div className="space-y-4" id="scholars-video-feed">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block animate-ping"></span>
              Scholars Video Feed
            </span>
            <span className="text-[10px] text-amber-600 bg-amber-50 font-black px-2.5 py-1 rounded-lg border border-amber-100 uppercase font-sans">Featured</span>
          </div>

          <div className="space-y-4">
            {db.videos.map((vid) => {
              const youtubeEmbedUrl = getYouTubeEmbedUrl(vid.url);
              return (
                <div key={vid.id} className="bg-white rounded-[24px] p-4.5 border-2 border-slate-100 hover:border-slate-300 shadow-xs transition-all duration-300 space-y-3.5">
                  <div className="space-y-1">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">{vid.title}</h3>
                    {vid.description && (
                      <p className="text-xs text-slate-500 leading-relaxed font-bold">{vid.description}</p>
                    )}
                  </div>

                  {youtubeEmbedUrl ? (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-inner border border-slate-250">
                      <iframe
                        className="absolute inset-0 w-full h-full"
                        src={youtubeEmbedUrl}
                        title={vid.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        referrerPolicy="no-referrer"
                      ></iframe>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-150">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <PlayCircle className="w-8 h-8 text-amber-500 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[11px] font-black text-slate-700 block truncate">Watch Video</span>
                          <span className="text-[9.5px] text-slate-450 block truncate font-mono">{vid.url}</span>
                        </div>
                      </div>
                      <a
                        href={vid.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-black uppercase text-white bg-amber-500 hover:bg-amber-600 px-3.5 py-1.5 rounded-xl transition-all font-mono shadow-xs active:scale-95 text-center whitespace-nowrap"
                      >
                        Watch Video
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Access Menu Cards */}
      <div className="grid grid-cols-2 gap-3.5" id="quick-actions-grid">
        <button 
          onClick={() => onNavigate("ask")}
          className="bg-white border-2 border-slate-100 p-5 rounded-2xl text-left hover:bg-slate-50/55 hover:border-amber-300 hover:shadow-md transition-all active:scale-[0.98] group flex flex-col justify-between h-32 shadow-xs shadow-slate-100/40"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.lightBg} ${t.text} mb-2.5 border border-amber-100 text-lg`}>
            ✨
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black text-slate-800 group-hover:text-amber-700 flex items-center gap-1">
              Ask Islamic AI
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
            </div>
            <p className="text-[11px] text-slate-500 font-extrabold mt-0.5">Instant Hinglish responses</p>
          </div>
        </button>

        <button 
          onClick={() => onNavigate("learn")}
          className="bg-white border-2 border-slate-100 p-5 rounded-2xl text-left hover:bg-slate-50/55 hover:border-purple-300 hover:shadow-md transition-all active:scale-[0.98] group flex flex-col justify-between h-32 shadow-xs shadow-slate-100/40"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600 mb-2.5 border border-purple-100 text-lg">
            📖
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black text-slate-800 group-hover:text-purple-700 flex items-center gap-1">
              Learn Islam
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <p className="text-[11px] text-slate-500 font-extrabold mt-0.5">Interactive faith classes</p>
          </div>
        </button>

        <button 
          onClick={() => onNavigate("guides")}
          className="bg-white border-2 border-slate-100 p-5 rounded-2xl text-left hover:bg-slate-50/55 hover:border-sky-300 hover:shadow-md transition-all active:scale-[0.98] group flex flex-col justify-between h-32 shadow-xs shadow-slate-100/40"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-50 text-sky-600 mb-2.5 border border-sky-100 text-lg">
            🕋
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black text-slate-800 group-hover:text-sky-700 flex items-center gap-1">
              Purity Guides
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors" />
            </div>
            <p className="text-[11px] text-slate-500 font-extrabold mt-0.5">Wudu & Salah step guides</p>
          </div>
        </button>

        <button 
          onClick={() => onNavigate("pdfs")}
          className="bg-white border-2 border-slate-100 p-5 rounded-2xl text-left hover:bg-slate-50/55 hover:border-amber-300 hover:shadow-md transition-all active:scale-[0.98] group flex flex-col justify-between h-32 shadow-xs shadow-slate-100/40"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600 mb-2.5 border border-amber-100 text-lg">
            📚
          </div>
          <div>
            <div className="text-xs sm:text-sm font-black text-slate-800 group-hover:text-amber-700 flex items-center gap-1">
              JFZ PDFs
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
            </div>
            <p className="text-[11px] text-slate-500 font-extrabold mt-0.5">Ahem Masail & Dua Books</p>
          </div>
        </button>
      </div>

      <div className="pt-3" />
    </div>
  );
}
