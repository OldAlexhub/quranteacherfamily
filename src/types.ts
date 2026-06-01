// ─── Quran Content ──────────────────────────────────────────────────────────

export interface Surah {
  id: number;
  number: number;
  arabicName: string;
  transliteration: string;
  englishName: string;
  meaning: string;
  ayahCount: number;
  revelationType: 'Meccan' | 'Medinan';
  juzStart: number;
}

export interface Ayah {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  globalAyahNumber: number;
  arabicText: string;
  transliteration?: string;
  englishMeaning?: string;
  words?: WordToken[];
  juz?: number;
  page?: number;
}

export interface WordToken {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  wordIndex: number;
  arabicWord: string;
  transliteration?: string;
  englishMeaning?: string;
  audioFileMuallim?: string;
  audioFileMujawwad?: string;
  durationMs?: number;
}

export interface AudioManifestItem {
  id: string;
  recitationStyle: RecitationStyle;
  surahNumber: number;
  ayahNumber: number;
  wordIndex?: number;
  filePath: string;
  durationMs?: number;
  assetPackName?: string;
  checksum?: string;
}

// ─── Learner ─────────────────────────────────────────────────────────────────

export type AvatarColor =
  | '#1B4332'
  | '#2980B9'
  | '#8E44AD'
  | '#D35400'
  | '#16A085'
  | '#2C3E50';

export interface LearnerProfile {
  id: string;
  displayName: string;
  avatarColor: AvatarColor;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  defaultDailyGoalType?: DailyGoalType;
  notes?: string;
}

export type DailyGoalType = 'ayahs' | 'minutes' | 'words';

// ─── Progress ────────────────────────────────────────────────────────────────

export interface ReadingProgress {
  id: string;
  learnerId: string;
  lastSurahNumber: number;
  lastAyahNumber: number;
  ayahsRead: number;
  surahsOpened: number;
  readingSessions: number;
  updatedAt: string;
}

export interface ListeningProgress {
  id: string;
  learnerId: string;
  listeningSeconds: number;
  lastSurahNumber?: number;
  lastAyahNumber?: number;
  lastWordIndex?: number;
  recitationStyle?: RecitationStyle;
  updatedAt: string;
}

export type PracticeStatusType =
  | 'not_started'
  | 'learning'
  | 'practicing'
  | 'needs_review'
  | 'memorized';

export interface PracticeStatus {
  id: string;
  learnerId: string;
  surahNumber: number;
  ayahNumber: number;
  status: PracticeStatusType;
  updatedAt: string;
  reviewDueAt?: string;
}

export type PracticeMode =
  | 'listen_only'
  | 'repeat_after'
  | 'word_by_word'
  | 'memorization_review';

export interface PracticeSession {
  id: string;
  learnerId: string;
  mode: PracticeMode;
  surahNumber: number;
  startAyah: number;
  endAyah: number;
  repeatCount: number;
  durationSeconds?: number;
  completedAt: string;
  notes?: string;
}

// ─── Assignments ─────────────────────────────────────────────────────────────

export type AssignmentType =
  | 'read_arabic'
  | 'listen'
  | 'word_by_word'
  | 'memorization_review'
  | 'bookmark_review'
  | 'free_reading';

export type AssignmentStatus = 'pending' | 'in_progress' | 'completed' | 'needs_review';

export interface Assignment {
  id: string;
  learnerId: string;
  title: string;
  type: AssignmentType;
  surahNumber: number;
  startAyah: number;
  endAyah: number;
  targetMinutes?: number;
  repeatCount?: number;
  dueDate: string;
  status: AssignmentStatus;
  completedAt?: string;
  parentNote?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Bookmarks & Notes ───────────────────────────────────────────────────────

export type BookmarkColor = 'blue' | 'green' | 'yellow' | 'red';

export interface Bookmark {
  id: string;
  learnerId?: string;
  surahNumber: number;
  ayahNumber: number;
  note?: string;
  color?: BookmarkColor;
  createdAt: string;
}

export interface StudyNote {
  id: string;
  learnerId?: string;
  surahNumber: number;
  ayahNumber: number;
  wordIndex?: number;
  noteText: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export type RecitationStyle = 'muallim' | 'mujawwad';

export interface UserPreference {
  id: string;
  theme: 'light' | 'warm' | 'dark';
  arabicFontSize: number;
  englishMeaningFontSize: number;
  englishMeaningDefaultHidden: boolean;
  selectedRecitationStyle: RecitationStyle;
  defaultRepeatCount: number;
  defaultDelaySeconds: number;
  defaultPracticeMode: PracticeMode;
  reminderEnabled: boolean;
  reminderTime?: string;
  onboardingCompleted: boolean;
  activeLearnerIdx?: number;
}

// ─── Daily Completion ────────────────────────────────────────────────────────

export interface DailyCompletion {
  id: string;
  learnerId: string;
  assignmentId?: string;
  date: string;
  completedValue: number;
  completedAt: string;
}

// ─── Audio ───────────────────────────────────────────────────────────────────

export interface AudioPlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentSurahNumber: number;
  currentAyahNumber: number;
  currentWordIndex?: number;
  recitationStyle: RecitationStyle;
  playbackSpeed: number;
  repeatCount: number;
  repeatRemaining: number;
  repeatRange?: {startAyah: number; endAyah: number};
  position: number;
  duration: number;
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  QuranTab: undefined;
  PracticeTab: undefined;
  ProgressTab: undefined;
  SettingsTab: undefined;
};

export type QuranStackParamList = {
  SurahList: undefined;
  QuranReader: {surahNumber: number; startAyah?: number};
  AyahDetail: {surahNumber: number; ayahNumber: number};
  WordTeacherMode: {surahNumber: number; ayahNumber: number; wordIndex?: number};
};

export type PracticeStackParamList = {
  PracticeHome: undefined;
  RepeatPractice: {surahNumber?: number; startAyah?: number; endAyah?: number};
  MemorizationTracker: {learnerId?: string};
};

export type HomeStackParamList = {
  Home: undefined;
  ParentDashboard: undefined;
  LearnerProfiles: undefined;
  CreateLearner: undefined;
  EditLearner: {learnerId: string};
  Assignments: undefined;
  CreateAssignment: {learnerId?: string};
  EditAssignment: {assignmentId: string};
  Bookmarks: undefined;
  Notes: undefined;
  Search: undefined;
};

export type ProgressStackParamList = {
  ProgressReports: undefined;
  LearnerReport: {learnerId: string};
  SurahReport: {surahNumber: number};
};

export type SettingsStackParamList = {
  Settings: undefined;
  AudioSettings: undefined;
  About: undefined;
  Attribution: undefined;
  PrivacyPolicy: undefined;
};

// ─── Validation ──────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  surahCount: number;
  ayahCount: number;
  arabicTextCoverage: number;
  englishMeaningCoverage: number;
  audioManifestCoverage: {muallim: number; mujawwad: number};
  errors: string[];
  warnings: string[];
}
