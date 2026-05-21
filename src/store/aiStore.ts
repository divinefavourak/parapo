import { create } from 'zustand';
import { aiService, ChatMessage, AIBriefingResponse } from '../services/ai';

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

const SYSTEM_PROMPT = `You are PARAPO AI — an intelligent productivity assistant for student leaders.
You help with task management, academic planning, leadership decisions, focus strategies, and productivity coaching.
Be concise, actionable, and encouraging. When discussing tasks or academics, reference specifics when possible.
Always respond in a structured, helpful way. Use bullet points for lists.`;

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
      const { reply } = await aiService.chat(
        [{ role: 'system', content: SYSTEM_PROMPT }, ...history, userMsg],
      );
      const assistantMsg: ChatMessage = { role: 'assistant', content: reply };
      set((s) => ({ messages: [...s.messages, assistantMsg], isTyping: false }));
    } catch (err) {
      set({ isTyping: false, error: 'Failed to get AI response. Check your connection.' });
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
