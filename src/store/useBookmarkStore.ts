import {create} from 'zustand';
import {KEYS, storageGet, storageSet} from '../storage/storage';
import type {Bookmark, StudyNote, BookmarkColor} from '../types';
import {generateId} from '../utils/idUtils';

interface BookmarkState {
  bookmarks: Bookmark[];
  notes: StudyNote[];
  loaded: boolean;
  loadBookmarks: () => Promise<void>;
  addBookmark: (surahNumber: number, ayahNumber: number, learnerId?: string, note?: string, color?: BookmarkColor) => Promise<Bookmark>;
  removeBookmark: (id: string) => Promise<void>;
  isBookmarked: (surahNumber: number, ayahNumber: number, learnerId?: string) => boolean;
  getBookmarksByLearner: (learnerId?: string) => Bookmark[];
  searchBookmarks: (query: string) => Bookmark[];
  saveNote: (data: Omit<StudyNote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<StudyNote>;
  deleteNote: (id: string) => Promise<void>;
  getNotesByAyah: (surahNumber: number, ayahNumber: number) => StudyNote[];
  searchNotes: (query: string) => StudyNote[];
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: [],
  notes: [],
  loaded: false,

  loadBookmarks: async () => {
    const [bm, nt] = await Promise.all([
      storageGet<Bookmark[]>(KEYS.BOOKMARKS, []),
      storageGet<StudyNote[]>(KEYS.NOTES, []),
    ]);
    set({bookmarks: bm ?? [], notes: nt ?? [], loaded: true});
  },

  addBookmark: async (surahNumber, ayahNumber, learnerId, note, color) => {
    const bm: Bookmark = {
      id: generateId(),
      surahNumber,
      ayahNumber,
      learnerId,
      note,
      color,
      createdAt: new Date().toISOString(),
    };
    const updated = [...get().bookmarks, bm];
    set({bookmarks: updated});
    await storageSet(KEYS.BOOKMARKS, updated);
    return bm;
  },

  removeBookmark: async (id) => {
    const updated = get().bookmarks.filter(b => b.id !== id);
    set({bookmarks: updated});
    await storageSet(KEYS.BOOKMARKS, updated);
  },

  isBookmarked: (surahNumber, ayahNumber, learnerId) => {
    return get().bookmarks.some(
      b => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber && (!learnerId || b.learnerId === learnerId),
    );
  },

  getBookmarksByLearner: (learnerId) => {
    const {bookmarks} = get();
    if (!learnerId) return bookmarks;
    return bookmarks.filter(b => !b.learnerId || b.learnerId === learnerId);
  },

  searchBookmarks: (query) => {
    const q = query.toLowerCase().trim();
    if (!q) return get().bookmarks;
    return get().bookmarks.filter(b => b.note?.toLowerCase().includes(q));
  },

  saveNote: async (data) => {
    const {notes} = get();
    const existing = notes.find(n => n.surahNumber === data.surahNumber && n.ayahNumber === data.ayahNumber && n.learnerId === data.learnerId && n.wordIndex === data.wordIndex);
    const now = new Date().toISOString();
    let updated: StudyNote[];
    let note: StudyNote;
    if (existing) {
      note = {...existing, noteText: data.noteText.slice(0, 1000), updatedAt: now};
      updated = notes.map(n => n.id === existing.id ? note : n);
    } else {
      note = {id: generateId(), ...data, noteText: data.noteText.slice(0, 1000), createdAt: now, updatedAt: now};
      updated = [...notes, note];
    }
    set({notes: updated});
    await storageSet(KEYS.NOTES, updated);
    return note;
  },

  deleteNote: async (id) => {
    const updated = get().notes.filter(n => n.id !== id);
    set({notes: updated});
    await storageSet(KEYS.NOTES, updated);
  },

  getNotesByAyah: (surahNumber, ayahNumber) => {
    return get().notes.filter(n => n.surahNumber === surahNumber && n.ayahNumber === ayahNumber);
  },

  searchNotes: (query) => {
    const q = query.toLowerCase().trim();
    if (!q) return get().notes;
    return get().notes.filter(n => n.noteText.toLowerCase().includes(q));
  },
}));
