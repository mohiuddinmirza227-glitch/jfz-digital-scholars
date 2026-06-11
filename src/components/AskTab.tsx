import React, { useState, useRef, useEffect } from "react";
import { DatabaseState } from "../types";
import { Send, Sparkles, AlertCircle, HelpCircle, User, MessageSquare, RotateCcw, ShieldCheck, Cpu } from "lucide-react";

interface AskTabProps {
  db: DatabaseState;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

export default function AskTab({ db }: AskTabProps) {
  const { askTab, primaryColor } = db;
  
  const getWelcomeMessage = () => {
    return "Assalamu Alaikum! main **JFZ Digital Scholar & AI Assistant** hoon.\n\nMujhse aap Sunni Fiqh ya Islamic Guidance pooch sakte hain **YAA** dunyaavi, scientific, ya koi bhi general AI sawaal (jaise general knowledge, coding, writing ya math) pooch sakte hain. Main deeni aur dunyaavi dono sawalon ke behtareen aur polite answers dene ke liye tayyar hoon!";
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Attempt to persist local chat in current window state so users don't lose it instantly on tab switch
    const cached = sessionStorage.getItem("jfz_chat_history");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        id: "welcome",
        sender: "ai",
        text: getWelcomeMessage(),
        timestamp: new Date()
      }
    ];
  });
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionStorage.setItem("jfz_chat_history", JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, []);

  const getThemeColors = () => {
    switch (primaryColor) {
      case "emerald":
        return {
          text: "text-emerald-600",
          bg: "bg-emerald-600",
          lightBg: "bg-emerald-50",
          border: "border-emerald-100/80",
          indigoColor: "text-emerald-500",
          focusBorder: "focus:border-emerald-500",
          gradient: "from-emerald-600 to-teal-500"
        };
      case "gold":
        return {
          text: "text-amber-600",
          bg: "bg-amber-600",
          lightBg: "bg-amber-50",
          border: "border-amber-100/85",
          indigoColor: "text-amber-500",
          focusBorder: "focus:border-amber-500",
          gradient: "from-amber-600 to-yellow-500"
        };
      case "sky":
        return {
          text: "text-sky-600",
          bg: "bg-sky-600",
          lightBg: "bg-sky-50",
          border: "border-sky-100/85",
          indigoColor: "text-sky-500",
          focusBorder: "focus:border-sky-500",
          gradient: "from-sky-600 to-blue-500"
        };
      case "indigo":
        return {
          text: "text-indigo-600",
          bg: "bg-indigo-600",
          lightBg: "bg-indigo-50",
          border: "border-indigo-100/85",
          indigoColor: "text-indigo-500",
          focusBorder: "focus:border-indigo-500",
          gradient: "from-indigo-600 to-purple-500"
        };
      case "slate":
      default:
        return {
          text: "text-slate-700",
          bg: "bg-slate-700",
          lightBg: "bg-slate-100",
          border: "border-slate-200",
          indigoColor: "text-slate-500",
          focusBorder: "focus:border-slate-500",
          gradient: "from-slate-700 to-slate-600"
        };
    }
  };

  const t = getThemeColors();

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: text.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText("");
    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          chatHistory: updatedMessages.map((m) => ({ sender: m.sender, text: m.text }))
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Something went wrong. Please check back later.");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: data.reply,
          timestamp: new Date()
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to communicate with the Scholar AI.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    if (window.confirm("Aap conversation reset karna chahte hain? Purani chat history remove ho jayegi.")) {
      const resetMsg: ChatMessage = {
        id: "welcome-" + Date.now(),
        sender: "ai",
        text: getWelcomeMessage(),
        timestamp: new Date()
      };
      setMessages([resetMsg]);
      sessionStorage.removeItem("jfz_chat_history");
    }
  };

  // Convert simple markdown elements safely to UI elements
  const formatText = (rawText: string) => {
    return rawText.split("\n").map((line, idx) => {
      let formattedLine = line;

      // Handle simple inline code tags like `code`
      formattedLine = formattedLine.replace(/`(.*?)`/g, "<code class='bg-amber-100 text-rose-700 px-1.5 py-0.5 rounded font-mono text-[10px] break-all'>$1</code>");

      // Handle bold formatting
      formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, "<strong class='font-black text-slate-900'>$1</strong>");
      formattedLine = formattedLine.replace(/\*(.*?)\*/g, "<strong class='font-bold text-slate-800'>$1</strong>");

      const trimmed = line.trim();

      if (trimmed.startsWith("### ")) {
        return (
          <h4 key={idx} className="text-xs font-extrabold text-slate-800 mt-2 mb-1">
            {trimmed.replace("### ", "")}
          </h4>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h3 key={idx} className="text-xs font-black text-slate-900 mt-3 mb-1.5 border-b border-slate-100 pb-1">
            {trimmed.replace("## ", "")}
          </h3>
        );
      }
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return (
          <li key={idx} className="list-disc list-inside ml-1 text-slate-700 text-xs leading-relaxed mt-0.5 pl-1">
            <span dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[-*]\s+/, "") }} />
          </li>
        );
      }
      if (trimmed.startsWith("> ")) {
        return (
          <div key={idx} className="border-l-3 border-amber-400 pl-2.5 my-2.5 italic text-slate-600 text-[11px] bg-amber-50/60 py-1.5 rounded-r">
            <span dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^>\s+/, "") }} />
          </div>
        );
      }
      if (!trimmed) {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="text-xs leading-relaxed text-slate-700 mb-1" dangerouslySetInnerHTML={{ __html: formattedLine }} />
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]" id="ask-scholars-chat-portal">
      
      {/* Dynamic top bar with Online node status and Clear trigger */}
      <div className="bg-white px-4 py-3 rounded-2xl border-2 border-slate-100 flex items-center justify-between gap-2 shadow-sm shrink-0 mb-3.5">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center shrink-0">
            <span className="absolute inline-flex h-4 w-4 animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          <div>
            <div className="text-xs font-black text-slate-800 flex items-center gap-1.5 leading-none uppercase tracking-wider">
              <Cpu className={`w-4 h-4 ${t.text}`} />
              <span>Digital Scholar Chatbot</span>
            </div>
            <span className="text-[10px] text-slate-400 font-extrabold block mt-1">Status: Online • Ask Any General or Religious Question</span>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="p-1.5 px-3.5 rounded-xl border-2 border-slate-200 text-xs text-slate-600 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 flex items-center gap-1.5 font-extrabold transition-all hover:shadow-xs active:scale-95"
          title="Naya Sawaal"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset</span>
        </button>
      </div>

      {/* Top verification banner */}
      <div className="bg-amber-50/70 border-2 border-amber-100 p-3.5 rounded-2xl flex items-start gap-3 text-slate-700 shadow-xs shrink-0 mb-3.5">
        <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed font-semibold">
          <span className="font-black text-slate-800 uppercase text-[10px] tracking-wide block mb-0.5">Verified Sunni References:</span>
          {askTab.scholarVerification.info} Reference sources: <span className="text-amber-800 italic font-black">{askTab.referenceSources}</span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto space-y-4.5 px-3 py-4 rounded-[24px] mb-3.5 bg-slate-50/40 border-2 border-slate-100 min-h-0 shadow-inner">
        {messages.map((m) => {
          const isAI = m.sender === "ai";
          return (
            <div key={m.id} className={`flex gap-3 max-w-[94%] ${isAI ? "mr-auto" : "ml-auto flex-row-reverse"}`}>
              {/* Avi */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm ${isAI ? "bg-amber-100 border-2 border-amber-200 text-amber-700 shadow-xs font-black" : `bg-gradient-to-tr ${t.gradient} text-white shadow-xs`}`}>
                {isAI ? "✨" : <User className="w-4 h-4" />}
              </div>
              
              {/* Message bubble */}
              <div className={`rounded-2xl p-4 text-xs sm:text-sm transition-all relative ${
                isAI 
                  ? "bg-white text-slate-805 border-2 border-slate-100 rounded-tl-none shadow-xs" 
                  : `bg-gradient-to-r ${t.gradient} text-white rounded-tr-none shadow-sm`
                }`}
              >
                <div className="space-y-1">
                  {formatText(m.text)}
                </div>
                <div className={`text-[9px] text-right mt-2.5 font-mono font-bold ${isAI ? "text-slate-400" : "text-emerald-150"}`}>
                  {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-100 border-2 border-amber-200 text-amber-700 text-sm animate-spin">
              🌀
            </div>
            <div className="bg-white rounded-2xl p-4 border-2 border-slate-100 rounded-tl-none flex items-center gap-2 shadow-xs">
              <span className="text-xs sm:text-sm text-slate-600 font-black">Islamic Companion is generating reply</span>
              <span className="flex gap-0.5">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-50 border-2 border-rose-200 text-rose-800 text-xs sm:text-sm rounded-2xl p-4 flex items-start gap-3 max-w-[94%] mx-auto shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-extrabold">{errorMsg}</p>
              <button 
                onClick={() => handleSendMessage(messages[messages.length - 1]?.text || "Ask again")} 
                className="text-amber-700 underline font-black mt-2 block hover:text-amber-800 text-xs"
              >
                Retry Request
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested Questions (only displayed if we have starting messages or general rest states) */}
      {messages.length <= 2 && !loading && (
        <div className="mb-3.5 shrink-0">
          <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-2 px-1 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            Quick Suggestion Prompts:
          </span>
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
            {askTab.suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-950 border-2 border-slate-100 hover:border-slate-350 text-xs px-3.5 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] text-left leading-snug max-w-full font-bold shadow-2xs hover:shadow-xs"
              >
                {q}
              </button>
            ))}
            <button
              onClick={() => handleSendMessage("Math solver helper: Solve the derivative of x^2 + 5x")}
              className="bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-amber-200 text-xs px-3.5 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] text-left leading-snug hover:shadow-xs font-black shrink-0"
            >
              📝 General AI: Ask math, coding, or facts
            </button>
          </div>
        </div>
      )}

      {/* Text input container : STRICTLY TEXT-BASED, NO AUDIO/TTS */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }}
        className="flex gap-2 shrink-0 bg-white border-2 border-slate-100 p-2 rounded-2xl shadow-sm"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask a deeni question OR high science, coding, math question..."
          className={`flex-1 bg-slate-50 text-slate-800 placeholder-slate-400 text-xs sm:text-sm px-4 py-3.5 rounded-xl border-2 border-slate-100 focus:outline-none focus:bg-white ${t.focusBorder} transition-all font-semibold`}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className={`px-5 rounded-xl flex items-center justify-center transition-all ${
            inputText.trim() && !loading
              ? `bg-gradient-to-r ${t.gradient} hover:opacity-95 text-white active:scale-95 shadow-md shadow-slate-100`
              : "bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-slate-205"
          }`}
        >
          <Send className="w-4 h-4 stroke-[2.5px]" />
        </button>
      </form>
    </div>
  );
}
