export interface Announcement {
  id: string;
  text: string;
  active: boolean;
}

export interface PrayerTiming {
  name: string;
  time: string;
  active: boolean;
}

export interface DailyAyah {
  visible: boolean;
  title: string;
  arabic: string;
  translation: string;
  verseId: string;
}

export interface DailyHadith {
  visible: boolean;
  title: string;
  text: string;
  reference: string;
}

export interface DailyDua {
  visible: boolean;
  title: string;
  arabic: string;
  translation: string;
  reference: string;
}

export interface DailyReminder {
  visible: boolean;
  title: string;
  text: string;
}

export interface HomeTabConfig {
  prayerSection: {
    visible: boolean;
    title: string;
    timings: PrayerTiming[];
  };
  dailyAyah: DailyAyah;
  dailyHadith: DailyHadith;
  dailyDua: DailyDua;
  reminder: DailyReminder;
  sectionsOrder: string[];
}

export interface AnswerTemplate {
  id: string;
  title: string;
  format: string;
}

export interface AskTabConfig {
  aiInstructions: string;
  suggestedQuestions: string[];
  referenceSources: string;
  answerTemplates: AnswerTemplate[];
  scholarVerification: {
    info: string;
  };
}

export interface FAQItem {
  q: string;
  a: string;
}

export interface Guide {
  id: string;
  title: string;
  category: string;
  description: string;
  steps: string[];
  faqs?: FAQItem[];
}

export interface GuidesTabConfig {
  guides: Guide[];
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: string;
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  quiz?: QuizQuestion[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  courseImage?: string;
  whatsappEnroll?: boolean;
}

export interface LearnTabConfig {
  courses: Course[];
}

export interface PdfItem {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  pdfUrl: string;
  password?: string;
}

export interface PdfsTabConfig {
  pdfs: PdfItem[];
}

export interface Article {
  id: string;
  title: string;
  category: string;
  content: string;
}

export interface VaultTabConfig {
  categories: string[];
  articles: Article[];
}

export interface HomeVideo {
  id: string;
  title: string;
  url: string;
  description?: string;
}

export interface DatabaseState {
  appName: string;
  logoText: string;
  logoImage?: string;
  headerBanner: string;
  primaryColor: string;
  adminPassword: string;
  announcements: Announcement[];
  homeTab: HomeTabConfig;
  askTab: AskTabConfig;
  guidesTab: GuidesTabConfig;
  learnTab: LearnTabConfig;
  pdfsTab: PdfsTabConfig;
  vaultTab: VaultTabConfig;
  videos?: HomeVideo[];
}
