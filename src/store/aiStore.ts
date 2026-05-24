import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { aiService, ChatMessage, AIBriefingResponse } from '../services/ai';
import { useTaskStore } from './taskStore';

const STORAGE_KEY = 'parapo_ai_conversations_v2';
const MAX_CONVERSATIONS = 50;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  messages: ChatMessage[];   // excludes system role
  createdAt: number;
  updatedAt: number;
}

interface AIState {
  conversations: Conversation[];
  activeId: string | null;
  messages: ChatMessage[];          // current active conversation messages
  isTyping: boolean;
  error: string | null;
  briefing: AIBriefingResponse | null;
  isBriefingLoading: boolean;

  // Actions
  loadConversations: () => Promise<void>;
  newChat: () => void;
  openChat: (id: string) => void;
  deleteChat: (id: string) => void;
  sendMessage: (content: string) => Promise<void>;
  clearConversation: () => void;   // clears current chat (legacy compat)
  clearError: () => void;
  fetchBriefing: () => Promise<void>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function getTitle(conv: Conversation): string {
  const first = conv.messages.find((m) => m.role === 'user');
  if (!first) return 'New Chat';
  return first.content.length > 46 ? first.content.slice(0, 43) + '…' : first.content;
}
export { getTitle };

async function persist(conversations: Conversation[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch {}
}

function buildSystemPrompt(): string {
  const tasks = useTaskStore.getState().tasks;
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const pending = tasks.filter((t) => !t.isCompleted && t.column !== 'done').slice(0, 8);

  const base = `You are PARAPO AI — an intelligent productivity assistant for student leaders in Nigerian universities.
You help with task management, academic planning, leadership decisions, focus strategies, and productivity coaching.
Be concise, actionable, and encouraging. Reference the user's actual tasks and deadlines when relevant.
Format responses clearly: use bullet points for lists, bold for key terms.`;

  if (pending.length === 0) {
    return `${base}\n\nToday is ${todayStr}. The user currently has no pending tasks.`;
  }

  const taskLines = pending.map((t) => {
    const parts = [`• ${t.title}`];
    if (t.category) parts.push(`[${t.category}]`);
    if (t.dueLabel) parts.push(`— ${t.dueUrgent ? '⚠ ' : ''}${t.dueLabel}`);
    parts.push(`(${t.column.replace('_', ' ')})`);
    return parts.join(' ');
  }).join('\n');

  return `${base}\n\nToday is ${todayStr}.\n\nUser's pending tasks:\n${taskLines}`;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAIStore = create<AIState>((set, get) => ({
  conversations: [],
  activeId: null,
  messages: [],
  isTyping: false,
  error: null,
  briefing: null,
  isBriefingLoading: false,

  loadConversations: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const convs: Conversation[] = JSON.parse(raw);
      const sorted = convs.sort((a, b) => b.updatedAt - a.updatedAt);
      // Restore the most recent conversation as active
      const latest = sorted[0];
      set({
        conversations: sorted,
        activeId: latest?.id ?? null,
        messages: latest?.messages ?? [],
      });
    } catch {}
  },

  newChat: () => {
    const id = makeId();
    const conv: Conversation = { id, messages: [], createdAt: Date.now(), updatedAt: Date.now() };
    const convs = [conv, ...get().conversations].slice(0, MAX_CONVERSATIONS);
    set({ conversations: convs, activeId: id, messages: [], error: null });
    persist(convs);
  },

  openChat: (id) => {
    const conv = get().conversations.find((c) => c.id === id);
    if (!conv) return;
    set({ activeId: id, messages: conv.messages, error: null });
  },

  deleteChat: (id) => {
    const convs = get().conversations.filter((c) => c.id !== id);
    const { activeId } = get();
    const newActive = activeId === id ? (convs[0]?.id ?? null) : activeId;
    const newMessages = activeId === id ? (convs[0]?.messages ?? []) : get().messages;
    set({ conversations: convs, activeId: newActive, messages: newMessages });
    persist(convs);
  },

  sendMessage: async (content) => {
    const { conversations, activeId } = get();

    // If no active conversation, create one
    let id = activeId;
    let convs = conversations;
    if (!id) {
      id = makeId();
      const newConv: Conversation = { id, messages: [], createdAt: Date.now(), updatedAt: Date.now() };
      convs = [newConv, ...convs].slice(0, MAX_CONVERSATIONS);
      set({ conversations: convs, activeId: id });
    }

    const userMsg: ChatMessage = { role: 'user', content };
    const updatedMessages = [...get().messages, userMsg];
    set({ messages: updatedMessages, isTyping: true, error: null });

    try {
      const systemPrompt = buildSystemPrompt();
      const { reply } = await aiService.chat([
        { role: 'system', content: systemPrompt },
        ...updatedMessages,
      ]);
      const assistantMsg: ChatMessage = { role: 'assistant', content: reply };
      const finalMessages = [...updatedMessages, assistantMsg];
      set({ messages: finalMessages, isTyping: false });

      // Save to conversation history
      const now = Date.now();
      const savedConvs = get().conversations.map((c) =>
        c.id === id ? { ...c, messages: finalMessages, updatedAt: now } : c
      );
      // Sort most recent first
      savedConvs.sort((a, b) => b.updatedAt - a.updatedAt);
      set({ conversations: savedConvs });
      persist(savedConvs);
    } catch (err: any) {
      const status = err?.response?.status ?? err?.status;
      const msg = status === 429
        ? 'Rate limit reached — wait a moment and try again.'
        : status === 422
        ? 'Message could not be processed. Try rephrasing.'
        : 'Failed to get a response. Check your connection.';
      set({ isTyping: false, error: msg });
    }
  },

  clearConversation: () => {
    get().newChat();
  },

  clearError: () => set({ error: null }),

  fetchBriefing: async () => {
    set({ isBriefingLoading: true });
    try {
      const briefing = await aiService.getDailyBriefing();
      set({ briefing, isBriefingLoading: false });
    } catch {
      set({ isBriefingLoading: false });
    }
  },
}));
