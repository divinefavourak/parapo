import { create } from 'zustand';
import { notesService, Note, CreateNotePayload } from '../services/notes';
import { notificationService } from '../services/notifications';

interface NotesState {
  notes: Note[];
  activeNote: Note | null;
  isLoading: boolean;
  isSaving: boolean;
  searchQuery: string;
  // Actions
  fetchNotes: (search?: string) => Promise<void>;
  createNote: (payload: CreateNotePayload) => Promise<Note>;
  updateNote: (id: string, content: string, title?: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  pinNote: (id: string) => Promise<void>;
  setActiveNote: (note: Note | null) => void;
  setSearchQuery: (q: string) => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  activeNote: null,
  isLoading: false,
  isSaving: false,
  searchQuery: '',

  fetchNotes: async (search) => {
    set({ isLoading: true });
    try {
      const notes = await notesService.list(search ?? get().searchQuery);
      set({ notes, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createNote: async (payload) => {
    const note = await notesService.create(payload);
    set((s) => ({ notes: [note, ...s.notes], activeNote: note }));
    notificationService.notify('Note Created', payload.title || 'New note ready').catch(() => {});
    return note;
  },

  updateNote: async (id, content, title) => {
    set({ isSaving: true });
    try {
      const updated = await notesService.update(id, { content, ...(title ? { title } : {}) });
      set((s) => ({
        notes: s.notes.map((n) => (n.id === id ? updated : n)),
        activeNote: s.activeNote?.id === id ? updated : s.activeNote,
        isSaving: false,
      }));
    } catch {
      set({ isSaving: false });
    }
  },

  deleteNote: async (id) => {
    set((s) => ({
      notes: s.notes.filter((n) => n.id !== id),
      activeNote: s.activeNote?.id === id ? null : s.activeNote,
    }));
    await notesService.delete(id).catch(() => {});
  },

  pinNote: async (id) => {
    const updated = await notesService.pin(id);
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? updated : n)),
    }));
  },

  setActiveNote: (note) => set({ activeNote: note }),
  setSearchQuery: (q) => set({ searchQuery: q }),
}));
