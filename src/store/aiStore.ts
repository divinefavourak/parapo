import { create } from 'zustand';
import { aiService, ChatMessage, AIBriefingResponse } from '../services/ai';
import { useTaskStore } from './taskStore';

interface AIState {
  messages: ChatMessage[];
  isTyping: boolean;
  briefing: AIBriefingResponse | null;
  isBriefingLoading: boolean;
  error: string | null;
  // Actions
  sendMessage: (content: string) => Promise<void>;
  clearConversation: () => void;
  fetchBriefing: () => Promise<void>;
  clearError: () => void;
}

const BASE_SYSTEM_PROMPT = `You are PARAPO AI — an intelligent productivity assistant for student leaders in Nigerian universities.
You help with task management, academic planning, leadership decisions, focus strategies, and productivity coaching.
Be concise, actionable, and encouraging. Reference the user's actual tasks and deadlines when relevant.
Format responses clearly: use bullet points for lists, bold for key terms. Keep answers focused and practical.`;

function buildSystemPrompt(): string {
  const tasks = useTaskStore.getState().tasks;
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const pending = tasks.filter((t) => !t.isCompleted && t.column !== 'done').slice(0, 8);

  if (pending.length === 0) {
    return `${BASE_SYSTEM_PROMPT}\n\nToday is ${todayStr}. The user currently has no pending tasks.`;
  }

  const taskLines = pending.map((t) => {
    const parts = [`• ${t.title}`];
    if (t.category) parts.push(`[${t.category}]`);
    if (t.dueLabel) parts.push(`— ${t.dueUrgent ? '⚠ ' : ''}${t.dueLabel}`);
    parts.push(`(${t.column.replace('_', ' ')})`);
    return parts.join(' ');
  }).join('\n');

  return `${BASE_SYSTEM_PROMPT}

Today is ${todayStr}.

The user's current pending tasks:
${taskLines}

When asked about focus or priorities, reference these specific tasks by name. Flag overdue items and today's deadlines proactively.`;
}

export const useAIStore = create<AIState>((set, get) => ({
  messages: [],
  isTyping: false,
  briefing: null,
  isBriefingLoading: false,
  error: null,

  sendMessage: async (content) => {
    const userMsg: ChatMessage = { role: 'user', content };
    set((s) => ({ messages: [...s.messages, userMsg], isTyping: true, error: null }));

    try {
      const history = get().messages;
      const systemPrompt = buildSystemPrompt();
      const { reply } = await aiService.chat(
        [{ role: 'system', content: systemPrompt }, ...history, userMsg],
      );
      const assistantMsg: ChatMessage = { role: 'assistant', content: reply };
      set((s) => ({ messages: [...s.messages, assistantMsg], isTyping: false }));
    } catch (err: any) {
      const status = err?.response?.status ?? err?.status;
      const msg = status === 429
        ? 'Rate limit reached — wait a moment and try again.'
        : 'Failed to get a response. Check your connection.';
      set({ isTyping: false, error: msg });
    }
  },

  clearConversation: () => set({ messages: [], error: null }),

  fetchBriefing: async () => {
    set({ isBriefingLoading: true });
    try {
      const briefing = await aiService.getDailyBriefing();
      set({ briefing, isBriefingLoading: false });
    } catch {
      set({ isBriefingLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
