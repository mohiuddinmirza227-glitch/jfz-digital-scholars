import React, { useState } from "react";
import { DatabaseState, PdfItem } from "../types";
import { Search, FileText, Download, ExternalLink, BookOpen, FileUp, Lock, Unlock, X, AlertTriangle } from "lucide-react";

interface PdfsTabProps {
  db: DatabaseState;
}

export default function PdfsTab({ db }: PdfsTabProps) {
  // Graceful fallback if undefined or empty
  const pdfs = db.pdfsTab?.pdfs || [];
  const primaryColor = db.primaryColor || "emerald";

  const [searchQuery, setSearchQuery] = useState("");
  
  // Password protection state variables
  const [selectedLockPdf, setSelectedLockPdf] = useState<PdfItem | null>(null);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const getThemeHighlight = () => {
    switch (primaryColor) {
      case "emerald":
        return {
          text: "text-emerald-700",
          bg: "bg-emerald-600",
          hoverBg: "hover:bg-emerald-700",
          lightBg: "bg-emerald-50",
          border: "border-emerald-100",
          accentColor: "emerald-600"
        };
      case "gold":
        return {
          text: "text-amber-700",
          bg: "bg-amber-600",
          hoverBg: "hover:bg-amber-700",
          lightBg: "bg-amber-50",
          border: "border-amber-100",
          accentColor: "amber-600"
        };
      case "sky":
        return {
          text: "text-sky-700",
          bg: "bg-sky-600",
          hoverBg: "hover:bg-sky-700",
          lightBg: "bg-sky-50",
          border: "border-sky-100",
          accentColor: "sky-600"
        };
      case "indigo":
        return {
          text: "text-indigo-700",
          bg: "bg-indigo-600",
          hoverBg: "hover:bg-indigo-700",
          lightBg: "bg-indigo-50",
          border: "border-indigo-100",
          accentColor: "indigo-600"
        };
      default:
        return {
          text: "text-emerald-700",
          bg: "bg-emerald-600",
          hoverBg: "hover:bg-emerald-700",
          lightBg: "bg-emerald-50",
          border: "border-emerald-100",
          accentColor: "emerald-600"
        };
    }
  };

  const t = getThemeHighlight();

  // Filter PDFs
  const filteredPdfs = pdfs.filter(pdf => {
    const term = searchQuery.toLowerCase();
    return (
      pdf.title.toLowerCase().includes(term) ||
      (pdf.description && pdf.description.toLowerCase().includes(term))
    );
  });

  // Base64 detection
  const isBase64Pdf = (url: string) => {
    return url && url.startsWith("data:application/pdf");
  };

  const handlePdfClick = (pdf: PdfItem) => {
    if (pdf.password && pdf.password.trim() !== "") {
      setSelectedLockPdf(pdf);
      setEnteredPassword("");
      setPasswordError("");
    } else {
      executeOpen(pdf);
    }
  };

  const executeOpen = (pdf: PdfItem) => {
    if (!pdf.pdfUrl) return;
    try {
      if (isBase64Pdf(pdf.pdfUrl)) {
        // Create an object URL or download natively
        const link = document.createElement("a");
        link.href = pdf.pdfUrl;
        link.download = `${pdf.title.replace(/\s+/g, "_")}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const link = document.createElement("a");
        link.href = pdf.pdfUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      alert("Nahi khul saka: Kripya valid PDF download ya external link check karein.");
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLockPdf) return;
    if (enteredPassword === selectedLockPdf.password) {
      executeOpen(selectedLockPdf);
      setSelectedLockPdf(null);
      setEnteredPassword("");
      setPasswordError("");
    } else {
      setPasswordError("Ghalat password! Kripya sahi password darj karein.");
    }
  };

  return (
    <div className="space-y-6" id="pdfs-tab-container">
      {/* Tab Header Banner */}
      <div className={`p-6 rounded-[28px] bg-gradient-to-br from-slate-900 to-slate-950 text-white border-2 border-slate-900 shadow-md relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative space-y-2">
          <span className="text-[10px] font-black tracking-widest uppercase text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20 inline-block">
            Important Library
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            📚 JFZ Important PDFs
          </h2>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed font-bold">
            Deeni, Sunni Aqeedah aur rojana ke ahem masail par authentic scholars ki likhi hui important PDFs yahan se download aur study karein.
          </p>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative group" id="pdf-search-box">
        <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
        <input
          type="text"
          placeholder="Kitab ka naam ya topic search karein..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border-2 border-slate-100 hover:border-slate-300 focus:border-amber-600 focus:ring-0 rounded-[22px] pl-12 pr-5 py-3.5 text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 shadow-xs transition-all duration-300 outline-none"
        />
      </div>

      {/* PDFs Grid List */}
      {filteredPdfs.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[28px] p-10 text-center space-y-3.5">
          <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-inner">
            🔍
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-800">Koi PDF nahi mili</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto font-bold leading-relaxed">
              Aapki tallash ke mutabiq koi kitab ya parcha nahi mila. Kripya dushra keyword search karein.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="pdfs-cards-grid">
          {filteredPdfs.map((pdf) => (
            <div
              key={pdf.id}
              className="bg-white rounded-[24px] border-2 border-slate-100 hover:border-slate-350 hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden relative group"
            >
              {/* Optional Password Badge indicator */}
              {pdf.password && pdf.password.trim() !== "" && (
                <div className="absolute top-3.5 right-3.5 bg-amber-500/10 border border-amber-400/25 text-amber-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 z-10">
                  <Lock className="w-3 h-3 text-amber-600" />
                  <span>Locked</span>
                </div>
              )}

              <div className="p-4.5 flex gap-4 items-start">
                {/* Thumbnail Display with graceful Fallback */}
                {pdf.thumbnail ? (
                  <div className="relative shrink-0">
                    <img
                      src={pdf.thumbnail}
                      alt={pdf.title}
                      className="w-16 h-22 object-cover rounded-xl shadow-xs border border-slate-200 select-none pointer-events-none"
                      referrerPolicy="no-referrer"
                    />
                    {pdf.password && pdf.password.trim() !== "" && (
                      <div className="absolute inset-0 bg-slate-900/40 rounded-xl flex items-center justify-center backdrop-blur-[1px]">
                        <Lock className="w-4 h-4 text-white drop-shadow-md" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`w-16 h-22 ${t.lightBg} border-2 border-dashed ${t.border} rounded-xl shrink-0 flex flex-col items-center justify-center text-slate-400 relative`}>
                    {pdf.password && pdf.password.trim() !== "" ? (
                      <Lock className={`w-6 h-6 text-amber-600`} />
                    ) : (
                      <FileText className={`w-6 h-6 ${t.text}`} />
                    )}
                    <span className="text-[8px] font-black uppercase text-slate-500 font-mono mt-1">PDF</span>
                  </div>
                )}

                <div className="space-y-1 min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-black text-slate-800 leading-snug group-hover:text-amber-700 transition-colors line-clamp-2">
                    {pdf.title}
                  </h3>
                  <p className="text-[11px] text-slate-450 leading-relaxed font-bold line-clamp-3">
                    {pdf.description || "Koi extra description details available nahi hain."}
                  </p>
                </div>
              </div>

              {/* View/Download Triggers Bar */}
              <div className="bg-slate-50/50 border-t border-slate-100 px-4.5 py-3.5 flex items-center justify-between gap-2.5">
                <span className="text-[9.5px] font-mono font-black text-slate-400 uppercase flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  {(pdf.pdfUrl || "").includes("/api/view-pdf/") ? "Cloud Document" : isBase64Pdf(pdf.pdfUrl || "") ? "Uploaded Document" : "Web Portal PDF"}
                </span>

                <button
                  onClick={() => handlePdfClick(pdf)}
                  className={`bg-slate-900 text-white ${t.hoverBg} text-[10px] sm:text-[11px] px-4 py-2 rounded-xl font-black uppercase tracking-wider transition-all scale-100 active:scale-95 inline-flex items-center gap-1.5 shadow-xs cursor-pointer`}
                >
                  {pdf.password && pdf.password.trim() !== "" ? (
                    <>
                      <Lock className="w-3.5 h-3.5 stroke-[2.5] text-amber-400 animate-pulse" />
                      <span>Unlock PDF</span>
                    </>
                  ) : (isBase64Pdf(pdf.pdfUrl || "") || (pdf.pdfUrl || "").includes("/api/view-pdf/")) ? (
                    <>
                      <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Open PDF</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Open Library</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Polish Password Unlocking Dialog Modal */}
      {selectedLockPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in" id="pdf-password-modal">
          <div className="bg-white rounded-[28px] border-2 border-slate-900 shadow-2xl max-w-md w-full overflow-hidden transition-all duration-300 scale-100">
            
            {/* Modal Header banner */}
            <div className="p-5 bg-slate-950 text-white flex items-center justify-between border-b-2 border-slate-900">
              <div className="flex items-center gap-2">
                <div className="bg-amber-500/10 p-1.5 rounded-lg border border-amber-400/20 text-amber-400">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight">🔒 Password Protected PDF</h3>
              </div>
              <button 
                onClick={() => setSelectedLockPdf(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-500/10 px-2.5 py-1 rounded-md inline-block">
                  Aura of Security
                </span>
                <p className="text-xs sm:text-sm font-black text-slate-800 leading-snug">
                  "{selectedLockPdf.title}" ko kholne ke liye admin ka lagaya gaya security code/password darj karein.
                </p>
                <p className="text-[11px] text-slate-450 leading-relaxed font-bold">
                  Yadi aapse password manga ja raha hai toh iska matlab hai ki yah document swayam admin ke adhikar me surakshit kiya gaya hai.
                </p>
              </div>

              {/* Password Input Input Area */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-black uppercase text-slate-400 block">Dastawez Ka Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    autoFocus
                    placeholder="Enter security key..."
                    value={enteredPassword}
                    onChange={(e) => {
                      setEnteredPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                    }}
                    className="w-full bg-slate-50 border-2 border-slate-150 focus:border-slate-900 focus:bg-white focus:ring-0 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm font-bold text-slate-800 placeholder-slate-400 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Error feedback indicator */}
              {passwordError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-xl flex items-start gap-2 text-[11px] font-bold leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{passwordError}</span>
                </div>
              )}

              {/* Footer action buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLockPdf(null)}
                  className="flex-1 border-2 border-slate-100 hover:border-slate-200 text-slate-750 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all scale-100 active:scale-95 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 bg-slate-900 hover:bg-slate-950 text-white px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all scale-100 active:scale-95 cursor-pointer shadow-xs inline-flex items-center justify-center gap-1.5`}
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Verify & Unlock</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
