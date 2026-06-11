import React, { useState } from "react";
import { DatabaseState, Guide } from "../types";
import { Compass, BookOpen, ChevronRight, ArrowLeft, CheckCircle2, Award, HelpCircle } from "lucide-react";

interface GuidesTabProps {
  db: DatabaseState;
}

export default function GuidesTab({ db }: GuidesTabProps) {
  const { guidesTab, primaryColor } = db;
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const getThemeColors = () => {
    switch (primaryColor) {
      case "emerald":
        return {
          text: "text-emerald-600",
          bg: "bg-emerald-600",
          lightBg: "bg-emerald-50",
          border: "border-emerald-100/80"
        };
      case "gold":
        return {
          text: "text-amber-600",
          bg: "bg-amber-600",
          lightBg: "bg-amber-50",
          border: "border-amber-100/85"
        };
      case "sky":
        return {
          text: "text-sky-600",
          bg: "bg-sky-600",
          lightBg: "bg-sky-50",
          border: "border-sky-100/85"
        };
      case "indigo":
        return {
          text: "text-indigo-600",
          bg: "bg-indigo-600",
          lightBg: "bg-indigo-50",
          border: "border-indigo-100/85"
        };
      case "slate":
      default:
        return {
          text: "text-slate-700",
          bg: "bg-slate-700",
          lightBg: "bg-slate-100",
          border: "border-slate-200"
        };
    }
  };

  const t = getThemeColors();

  const handleSelectGuide = (guide: Guide) => {
    setSelectedGuide(guide);
    setActiveStep(0);
  };

  if (selectedGuide) {
    return (
      <div className="space-y-5" id="active-guide-step-portal">
        {/* Back Button */}
        <button 
          onClick={() => setSelectedGuide(null)}
          className="flex items-center gap-2 text-xs sm:text-sm text-slate-705 hover:text-slate-950 bg-white border-2 border-slate-150 px-4 py-2.5 rounded-xl active:scale-95 transition-all shadow-sm font-black"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
          <span>Guides Se Peeche Jayein</span>
        </button>

        {/* Guide Title Header */}
        <div className="bg-white rounded-[24px] p-6 border-2 border-slate-100 shadow-sm relative overflow-hidden">
          <span className="text-[10px] uppercase font-black tracking-wider text-amber-700">{selectedGuide.category}</span>
          <h2 className="text-lg font-black text-slate-900 mt-1.5 leading-tight">{selectedGuide.title}</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-bold">{selectedGuide.description}</p>
        </div>

        {/* Interactive Step-by-Step view */}
        <div className="bg-white rounded-[24px] p-6 border-2 border-slate-100 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">
              Step {activeStep + 1} of {selectedGuide.steps.length}
            </span>
            <span className="text-xs font-black text-slate-400 font-mono">Interactive Checklist</span>
          </div>

          {/* Stepper Progress bar indicators */}
          <div className="grid grid-flow-col gap-2 h-2">
            {selectedGuide.steps.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-full rounded-full transition-all duration-300 ${
                  idx <= activeStep ? t.bg : "bg-slate-100"
                }`} 
              />
            ))}
          </div>

          {/* Current Active Step content block */}
          <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-150 min-h-28 flex items-start gap-4 transition-all">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black ${t.bg} text-white font-mono text-sm shadow-sm`}>
              {activeStep + 1}
            </div>
            <p className="text-slate-800 text-xs sm:text-sm leading-relaxed pt-1.5 select-none font-black">
              {selectedGuide.steps[activeStep]}
            </p>
          </div>

          {/* Stepper Nav Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
              disabled={activeStep === 0}
              className={`flex-1 py-4 text-xs sm:text-sm font-black rounded-xl border-2 text-center transition-all ${
                activeStep === 0 
                  ? "text-slate-350 bg-slate-50 border-slate-100 cursor-not-allowed opacity-50" 
                  : "bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-55 active:scale-95 shadow-sm"
              }`}
            >
              Pehla Step (Prev)
            </button>
            <button
              onClick={() => setActiveStep((prev) => Math.min(selectedGuide.steps.length - 1, prev + 1))}
              disabled={activeStep === selectedGuide.steps.length - 1}
              className={`flex-1 py-4 text-xs sm:text-sm font-black rounded-xl text-center transition-all border-2 border-transparent ${
                activeStep === selectedGuide.steps.length - 1 
                  ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-55" 
                  : `${t.bg} text-white hover:opacity-95 active:scale-95 shadow-sm`
              }`}
            >
              Agla Step (Next)
            </button>
          </div>

          {/* Congratulations banner when guide completed */}
          {activeStep === selectedGuide.steps.length - 1 && (
            <div className="bg-emerald-50 border-2 border-emerald-150 text-emerald-900 rounded-2xl p-5 flex items-center gap-3.5 animate-fade-in-up shadow-sm">
              <Award className="w-6 h-6 shrink-0 text-emerald-600 animate-bounce" />
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-black">MashaAllah! Aapne ye guide mukammal kar li.</p>
                <p className="text-xs text-emerald-700 font-extrabold">Allah aapke ilm aur ibadat me barkat farmaye!</p>
              </div>
            </div>
          )}
        </div>

        {/* FAQs section for active guide */}
        {selectedGuide.faqs && selectedGuide.faqs.length > 0 && (
          <div className="bg-white rounded-[24px] p-6 border-2 border-slate-100 space-y-4 shadow-sm">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-600" />
              Frequently Asked Questions (FAQs)
            </h3>
            <div className="space-y-3.5">
              {selectedGuide.faqs.map((faq, idx) => (
                <div key={idx} className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                  <h4 className="text-xs sm:text-sm font-black text-slate-850 flex items-start gap-1.5">
                    <span className="text-amber-600 select-none">Q.</span>
                    <span>{faq.q}</span>
                  </h4>
                  <p className="text-xs text-slate-650 leading-relaxed pl-5 font-bold">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5" id="guides-tab-layout">
      {/* Search & Intro */}
      <div className="bg-gradient-to-tr from-emerald-900 to-indigo-900 rounded-[28px] p-6 text-white space-y-1.5 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-radial from-white/10 to-transparent pointer-events-none" />
        <div className="flex items-center gap-2">
          <Compass className="w-6 h-6 text-amber-400" />
          <h2 className="text-base font-black uppercase tracking-wider text-white">Islamic Authentic Guides</h2>
        </div>
        <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed font-bold">
          Sunni Fiqh ke mutabiq wudu, kamil namaz, aur roza rakhne ke tariko ko asaan karke seekhein.
        </p>
      </div>

      {/* Grid List */}
      <div className="space-y-4">
        {guidesTab.guides.map((guide) => (
          <div 
            key={guide.id}
            onClick={() => handleSelectGuide(guide)}
            className="bg-white hover:bg-slate-50/50 border-2 border-slate-100 rounded-2xl p-6 cursor-pointer hover:border-slate-350 hover:shadow-md transition-all duration-305 flex items-center justify-between group active:scale-[0.99] shadow-sm"
          >
            <div className="space-y-2 max-w-[85%]">
              <span className={`text-[10px] font-black uppercase ${t.text} ${t.lightBg} px-3 py-1 rounded-xl border border-slate-100`}>
                {guide.category}
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-800 mt-2.5 group-hover:text-amber-700 transition-colors leading-tight">
                {guide.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-2 font-bold">
                {guide.description}
              </p>
              <div className="flex items-center gap-2 pt-1.5 font-bold">
                <span className="text-[10px] text-slate-400 font-mono">
                  {guide.steps.length} Step Instructions
                </span>
                {guide.faqs && guide.faqs.length > 0 && (
                  <>
                    <span className="text-slate-300 select-none">•</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {guide.faqs.length} FAQs
                    </span>
                  </>
                )}
              </div>
            </div>
            <button className={`w-9 h-9 rounded-full ${t.lightBg} ${t.text} flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-1.5 duration-300 shadow-xs border border-slate-105`}>
              <ChevronRight className="w-5 h-5 stroke-[2.5px]" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
