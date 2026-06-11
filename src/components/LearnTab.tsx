import React, { useState } from "react";
import { DatabaseState, Course, Lesson, QuizQuestion } from "../types";
import { ArrowLeft, BookOpen, Check, X, AlertOctagon, HelpCircle, GraduationCap, ChevronRight, PlayCircle, MessageCircle } from "lucide-react";

interface LearnTabProps {
  db: DatabaseState;
}

export default function LearnTab({ db }: LearnTabProps) {
  const { learnTab, primaryColor } = db;
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizIsCorrect, setQuizIsCorrect] = useState<boolean | null>(null);

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

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    setSelectedLesson(null);
  };

  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setQuizIsCorrect(null);
  };

  const handleOptionSelect = (option: string) => {
    if (quizSubmitted) return;
    setSelectedAnswer(option);
  };

  const handleQuizSubmit = (correctAnswer: string) => {
    if (!selectedAnswer) return;
    setQuizSubmitted(true);
    const isCorrect = selectedAnswer === correctAnswer;
    setQuizIsCorrect(isCorrect);
  };

  // Back flow controls
  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setSelectedLesson(null);
  };

  const handleBackToLessons = () => {
    setSelectedLesson(null);
  };

  if (selectedLesson && selectedCourse) {
    const quiz: QuizQuestion | undefined = selectedLesson.quiz && selectedLesson.quiz[0];
    return (
      <div className="space-y-5" id="lesson-interactive-workspace">
        {/* Back control */}
        <button 
          onClick={handleBackToLessons}
          className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 hover:text-slate-950 bg-white border-2 border-slate-150 px-4 py-2.5 rounded-xl active:scale-95 transition-all shadow-sm font-black"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
          <span>Course Lessons me Wapas Jayein</span>
        </button>

        {/* Lesson heading paper */}
        <div className="bg-white rounded-[24px] p-6 border-2 border-slate-100 space-y-1.5 shadow-sm">
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{selectedCourse.title}</span>
          <h2 className="text-lg font-black text-slate-900 leading-tight">{selectedLesson.title}</h2>
        </div>

        {/* Lesson Text Content */}
        <div className="bg-white rounded-[24px] p-6 border-2 border-slate-100 space-y-4 shadow-sm">
          <h3 className="text-xs uppercase font-black tracking-widest text-slate-400 font-mono">Dars ki Tafseel (Lesson Details)</h3>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-800 whitespace-pre-wrap font-extrabold">
            {selectedLesson.content}
          </p>
        </div>

        {/* Simple mock Video frame if video links exist */}
        {selectedLesson.videoUrl && selectedLesson.videoUrl.trim() !== "" && (
          <div className="bg-gradient-to-tr from-slate-900 to-slate-800 rounded-[24px] p-5 text-white flex items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3.5">
              <PlayCircle className="w-10 h-10 text-amber-400 shrink-0 animate-pulse" />
              <div>
                <h4 className="text-xs sm:text-sm font-black text-white">Video Lesson Available</h4>
                <p className="text-[10px] text-zinc-300 font-bold max-w-[180px] truncate">{selectedLesson.videoUrl}</p>
              </div>
            </div>
            <a 
              href={selectedLesson.videoUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs uppercase font-black px-4.5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all font-mono shadow-md inline-block"
            >
              Watch Video
            </a>
          </div>
        )}

        {/* Quiz segment */}
        {quiz && (
          <div className="bg-white rounded-[24px] p-6 border-2 border-slate-100 space-y-5 shadow-sm">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-600" />
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-600">Lesson Interactive Quiz</span>
            </div>

            <p className="text-sm sm:text-base font-black text-slate-900 pl-1">{quiz.q}</p>

            <div className="space-y-3">
              {quiz.options.map((opt, idx) => {
                const isSelected = selectedAnswer === opt;
                let optStyle = "bg-slate-50 border-slate-205 text-slate-800 hover:border-slate-400 hover:bg-slate-100/60";
                
                if (isSelected) {
                  optStyle = `${t.lightBg} border-${primaryColor}-500 text-${primaryColor}-800 font-black`;
                }

                if (quizSubmitted) {
                  if (opt === quiz.answer) {
                    optStyle = "bg-green-50 border-green-400 text-green-800 font-black";
                  } else if (isSelected) {
                    optStyle = "bg-rose-50 border-rose-400 text-rose-800 line-through font-black";
                  } else {
                    optStyle = "bg-slate-50 border-slate-100 text-slate-400 opacity-60";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(opt)}
                    disabled={quizSubmitted}
                    className={`w-full p-4.5 text-xs sm:text-sm text-left rounded-2xl border-2 flex items-center justify-between transition-all active:scale-[0.99] shadow-xs ${optStyle}`}
                  >
                    <span className="font-bold leading-normal">{opt}</span>
                    {quizSubmitted && opt === quiz.answer && <Check className="w-5 h-5 text-green-600 shrink-0 stroke-[3px]" />}
                    {quizSubmitted && isSelected && opt !== quiz.answer && <X className="w-5 h-5 text-rose-600 shrink-0 stroke-[3px]" />}
                  </button>
                );
              })}
            </div>

            {/* Quiz Action Control */}
            {!quizSubmitted && (
              <button
                onClick={() => handleQuizSubmit(quiz.answer)}
                disabled={!selectedAnswer}
                className={`w-full py-4.5 rounded-2xl text-xs sm:text-sm font-black tracking-wider uppercase transition-all duration-200 text-center ${
                  selectedAnswer 
                    ? `${t.bg} text-white hover:opacity-95 active:scale-95 shadow-md shadow-slate-150`
                    : "bg-slate-200 text-slate-450 cursor-not-allowed border-2 border-slate-300 opacity-60"
                }`}
              >
                Submit Answer (Jawab Submit Karein)
              </button>
            )}

            {/* Result summary banner */}
            {quizSubmitted && (
              <div className={`p-5 rounded-2xl border-2 flex items-start gap-3.5 ${
                quizIsCorrect 
                  ? "bg-green-50 border-green-300 text-green-900" 
                  : "bg-rose-50 border-rose-300 text-rose-900"
              }`}>
                {quizIsCorrect ? (
                  <>
                    <Check className="w-6 h-6 text-green-600 shrink-0 stroke-[3px]" />
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-black">MashaAllah! Durust Jawab (Correct Answer!)</p>
                      <p className="text-xs text-green-800 font-extrabold">Aapne dars ko bohot acche se samjha hai. Keep it up!</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0 stroke-[2.5px]" />
                    <div className="space-y-1.5">
                      <p className="text-xs sm:text-sm font-black">Galat Jawab (Incorrect Answer)</p>
                      <p className="text-xs text-rose-800 font-extrabold">Sahi jawab ko highlight kiya gaya hai. Dubara padhein aur seekhein!</p>
                      <button 
                        onClick={() => { setSelectedAnswer(null); setQuizSubmitted(false); setQuizIsCorrect(null); }} 
                        className="text-amber-850 font-black hover:underline py-1 mt-1 block text-xs"
                      >
                        Dubara Koshish Karein (Retry Quiz)
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (selectedCourse) {
    return (
      <div className="space-y-5" id="lessons-selector-view">
        {/* Back and title */}
        <button 
          onClick={handleBackToCourses}
          className="flex items-center gap-2 text-xs sm:text-sm text-slate-705 hover:text-slate-950 bg-white border-2 border-slate-150 px-4 py-2.5 rounded-xl active:scale-95 transition-all shadow-sm font-black"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
          <span>Courses List me Wapas Jayein</span>
        </button>

        <div className="bg-white rounded-[24px] p-6 border-2 border-slate-100 space-y-1.5 shadow-sm">
          <span className="text-[10px] text-amber-700 font-black uppercase tracking-wider">Active Course Curriculum</span>
          <h2 className="text-lg font-black text-slate-900 leading-tight">{selectedCourse.title}</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-bold">{selectedCourse.description}</p>
        </div>

        {/* Lessons checklist list */}
        <div className="space-y-3.5">
          <span className="text-xs uppercase font-black text-slate-500 tracking-wider block px-1">Curriculum Lessons ({selectedCourse.lessons.length}):</span>
          {selectedCourse.lessons.map((lesson) => (
            <div
              key={lesson.id}
              onClick={() => handleSelectLesson(lesson)}
              className="bg-white hover:bg-slate-50/55 border-2 border-slate-100 hover:border-slate-350 rounded-2xl p-5 cursor-pointer transition-all flex items-center justify-between group active:scale-[0.99] shadow-sm"
            >
              <div className="space-y-1.5 max-w-[80%]">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-black tracking-wider">Lesson Unit</span>
                <h3 className="text-sm sm:text-base font-black text-slate-805 group-hover:text-amber-700 transition-colors">
                  {lesson.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-1 font-bold">
                  {lesson.content}
                </p>
              </div>
              <button className={`w-9 h-9 rounded-xl ${t.lightBg} ${t.text} flex items-center justify-center shrink-0 border border-slate-100`}>
                <ChevronRight className="w-5 h-5 stroke-[2.5px]" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5" id="courses-root-tab">
      <div className="bg-gradient-to-tr from-indigo-900 to-indigo-855 rounded-[28px] p-6 text-white space-y-1.5 relative overflow-hidden shadow-lg shadow-indigo-950/20">
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-radial from-white/10 to-transparent pointer-events-none" />
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-amber-400" />
          <h2 className="text-base font-black uppercase tracking-wider text-white">JFZ digital madrassah</h2>
        </div>
        <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed font-bold">
          Apne Sunni Aqeedah aur rojana ke behtreen Sunnah manners (Akhlaq) ko unki deeni fazilat ke saath seekhein.
        </p>
      </div>

      <div className="space-y-4">
        {learnTab.courses.map((course) => (
          <div
            key={course.id}
            onClick={() => handleSelectCourse(course)}
            className="bg-white hover:bg-slate-50/50 border-2 border-slate-100 rounded-2xl p-5 cursor-pointer hover:border-slate-350 hover:shadow-md transition-all duration-305 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between group active:scale-[0.99] shadow-sm"
          >
            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center flex-1 min-w-0 w-full">
              {course.courseImage ? (
                <img 
                  src={course.courseImage} 
                  alt={course.title}
                  className="w-full sm:w-28 h-28 object-cover rounded-2xl shadow-sm border border-slate-200 shrink-0 select-none pointer-events-none"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={`w-full sm:w-28 h-28 ${t.lightBg} flex items-center justify-center text-4xl rounded-2xl border border-dashed border-slate-200 shrink-0`}>
                  🎓
                </div>
              )}
              
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[9.5px] font-black uppercase ${t.text} ${t.lightBg} px-2.5 py-1 rounded-lg border border-slate-100`}>
                    Free Course
                  </span>
                  {course.whatsappEnroll !== false && (
                    <span className="text-[9.5px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                      WhatsApp Enroll Live
                    </span>
                  )}
                </div>
                
                <h3 className="text-sm sm:text-base font-black text-slate-800 group-hover:text-amber-700 transition-colors leading-tight truncate">
                  {course.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 font-bold">
                  {course.description}
                </p>
                <div className="text-[10px] text-slate-400 font-mono font-black flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span>{course.lessons.length} Interactive Lessons</span>
                  <span>•</span>
                  <span>Verifiable Quizzes</span>
                </div>

                {/* Enroll via WhatsApp action button */}
                {course.whatsappEnroll !== false && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const messageText = `${course.title} mujhe ye join karna hai`;
                      const waUrl = `https://wa.me/9372186064?text=${encodeURIComponent(messageText)}`;
                      window.open(waUrl, "_blank");
                    }}
                    className="mt-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] px-4 py-2 rounded-xl inline-flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-emerald-600/10 uppercase tracking-wider cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 animate-pulse" />
                    <span>Enroll Now (WhatsApp)</span>
                  </button>
                )}
              </div>
            </div>

            <button className={`hidden sm:flex w-9 h-9 rounded-full ${t.lightBg} ${t.text} items-center justify-center shrink-0 transition-transform group-hover:translate-x-1.5 duration-300 shadow-xs border border-slate-100/80`}>
              <ChevronRight className="w-5 h-5 stroke-[2.5px]" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
