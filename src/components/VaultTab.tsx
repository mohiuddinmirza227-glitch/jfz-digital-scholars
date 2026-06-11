import React, { useState } from "react";
import { DatabaseState, Article } from "../types";
import { BookOpen, Search, ShieldCheck, ChevronRight, ArrowLeft } from "lucide-react";

interface VaultTabProps {
  db: DatabaseState;
}

export default function VaultTab({ db }: VaultTabProps) {
  const { vaultTab, primaryColor } = db;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const getThemeColors = () => {
    switch (primaryColor) {
      case "emerald":
        return {
          text: "text-emerald-600",
          bg: "bg-emerald-600",
          lightBg: "bg-emerald-50",
          border: "border-emerald-200"
        };
      case "gold":
        return {
          text: "text-amber-600",
          bg: "bg-amber-600",
          lightBg: "bg-amber-50",
          border: "border-amber-200"
        };
      case "sky":
        return {
          text: "text-sky-600",
          bg: "bg-sky-600",
          lightBg: "bg-sky-50",
          border: "border-sky-200"
        };
      case "indigo":
        return {
          text: "text-indigo-600",
          bg: "bg-indigo-600",
          lightBg: "bg-indigo-55",
          border: "border-indigo-200"
        };
      case "slate":
      default:
        return {
          text: "text-slate-700",
          bg: "bg-slate-700",
          lightBg: "bg-slate-100",
          border: "border-slate-205"
        };
    }
  };

  const t = getThemeColors();

  // Filter articles based on query & category
  const filteredArticles = vaultTab.articles.filter((art) => {
    const matchesSearch = 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || art.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (selectedArticle) {
    return (
      <div className="space-y-5" id="individual-article-viewer">
        <button 
          onClick={() => setSelectedArticle(null)}
          className="flex items-center gap-2 text-xs sm:text-sm text-slate-705 hover:text-slate-950 bg-white border-2 border-slate-150 px-4 py-2.5 rounded-xl active:scale-95 transition-all shadow-sm font-black"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
          <span>Articles Se Wapas Jayein</span>
        </button>

        <div className="bg-white rounded-[24px] p-6 border-2 border-slate-100 space-y-1.5 shadow-sm">
          <span className={`text-[10px] font-black uppercase tracking-wider ${t.text}`}>
            {selectedArticle.category}
          </span>
          <h2 className="text-lg font-black text-slate-900 leading-tight mt-1">{selectedArticle.title}</h2>
        </div>

        <div className="bg-white rounded-[24px] p-6 border-2 border-slate-100 space-y-4 shadow-sm">
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap select-text font-semibold">
            {selectedArticle.content}
          </p>
        </div>

        <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-100 flex items-center gap-3 shadow-xs">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
          <span className="text-[10px] text-slate-500 font-extrabold leading-normal">
            Authentic Sunni knowledge files. Verifiable with Islamic scholars.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5" id="vault-tab-root">
      {/* Intro block */}
      <div className="bg-gradient-to-tr from-slate-900 to-slate-800 rounded-[28px] p-6 text-white space-y-1.5 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-radial from-white/10 to-transparent pointer-events-none" />
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-amber-400" />
          <h2 className="text-base font-black uppercase tracking-wider text-white">Knowledge Vault (Kutub Khana)</h2>
        </div>
        <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-bold">
          Sahih Aqeedah, behtreen Sunnah aadaab aur barkat ke tariqo par authentic Islamic articles search karein.
        </p>
      </div>

      {/* Modern Search bar */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Articles search karein (e.g., 'Paani', 'Barkat')..."
          className="w-full bg-white text-slate-800 placeholder-slate-400 text-xs sm:text-sm pl-11 pr-5 py-4 rounded-xl border-2 border-slate-100 focus:outline-none focus:border-slate-350 transition-all font-semibold shadow-xs"
        />
      </div>

      {/* Category filters list */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none scrollbar-none">
        <button
          onClick={() => setSelectedCategory("All")}
          className={`px-4.5 py-2.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all border-2 ${
            selectedCategory === "All"
              ? `${t.bg} text-white border-transparent shadow-xs`
              : "bg-white border-slate-100 text-slate-600 hover:text-slate-900 hover:border-slate-300"
          }`}
        >
          All Categories
        </button>
        {vaultTab.categories.map((cat, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4.5 py-2.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all border-2 ${
              selectedCategory === cat
                ? `${t.bg} text-white border-transparent shadow-xs`
                : "bg-white border-slate-100 text-slate-600 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Articles Grid list */}
      <div className="space-y-4">
        {filteredArticles.length === 0 ? (
          <div className="p-10 text-center bg-slate-50 border-2 border-slate-100 rounded-[24px]">
            <p className="text-xs sm:text-sm text-slate-500 font-extrabold">Afsos, is category ya search query ke mutabiq koi article nahi mila.</p>
          </div>
        ) : (
          filteredArticles.map((art) => (
            <div
              key={art.id}
              onClick={() => setSelectedArticle(art)}
              className="bg-white hover:bg-slate-55 border-2 border-slate-100 rounded-2xl p-6 cursor-pointer hover:border-slate-350 hover:shadow-md transition-all duration-300 flex items-center justify-between group active:scale-[0.99] shadow-xs animate-fade-in"
            >
              <div className="space-y-2 max-w-[85%]">
                <span className={`text-[10px] font-black uppercase ${t.text} ${t.lightBg} px-3 py-1 rounded-xl border border-slate-100`}>
                  {art.category}
                </span>
                <h3 className="text-sm sm:text-base font-black text-slate-805 group-hover:text-amber-800 transition-colors leading-tight">
                  {art.title}
                </h3>
                <p className="text-xs text-slate-500 leading-normal line-clamp-1 font-bold">
                  {art.content}
                </p>
              </div>
              <button className={`w-9 h-9 rounded-full ${t.lightBg} ${t.text} flex items-center justify-center shrink-0 border border-slate-105 duration-300 group-hover:translate-x-1`}>
                <ChevronRight className="w-5 h-5 stroke-[2.5px]" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
