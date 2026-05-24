import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  Modal, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Plus, Clock, Trash2, Send } from 'lucide-react-native';
import { useAIStore, Conversation, getTitle } from '../../src/store/aiStore';
import { useTaskStore } from '../../src/store/taskStore';
import { ChatMessage } from '../../src/services/ai';

// ── Design tokens ─────────────────────────────────────────────────────────────
const P     = '#7C5CFC';
const CARD  = '#13131F';
const BDR   = 'rgba(255,255,255,0.07)';
const TEXT  = '#FFFFFF';
const TEXT2 = '#8B8BAA';
const TEXT3 = '#3D3D5C';

// ── Markdown / inline text ────────────────────────────────────────────────────
function InlineText({ text, style }: { text: string; style?: any }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <Text key={i} style={[style, { fontWeight: '700', color: TEXT }]}>{part.slice(2, -2)}</Text>
          : <Text key={i}>{part}</Text>
      )}
    </Text>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const blocks = content.trim().replace(/\n{3,}/g, '\n\n').split(/\n\n/);
  return (
    <View style={{ gap: 10 }}>
      {blocks.map((block, bi) => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
        const hasBullet = lines.some((l) => /^[\*\-]\s/.test(l) || /^\d+\.\s/.test(l));
        if (hasBullet) {
          return (
            <View key={bi} style={{ gap: 5 }}>
              {lines.map((line, li) => {
                const bullet = line.match(/^[\*\-]\s+(.+)/);
                const num    = line.match(/^(\d+)\.\s+(.+)/);
                if (bullet) return (
                  <View key={li} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <InlineText text={bullet[1]} style={styles.aiText} />
                  </View>
                );
                if (num) return (
                  <View key={li} style={styles.bulletRow}>
                    <Text style={styles.bulletNum}>{num[1]}.</Text>
                    <InlineText text={num[2]} style={styles.aiText} />
                  </View>
                );
                return <InlineText key={li} text={line} style={styles.aiText} />;
              })}
            </View>
          );
        }
        return <InlineText key={bi} text={lines.join(' ')} style={styles.aiText} />;
      })}
    </View>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
      {!isUser && (
        <View style={styles.aiLabel}>
          <Text style={styles.aiLabelIcon}>✦</Text>
          <Text style={styles.aiLabelText}>PARAPO AI</Text>
        </View>
      )}
      {isUser
        ? <Text style={styles.userText}>{msg.content}</Text>
        : <MarkdownContent content={msg.content} />}
    </View>
  );
}

// ── History sheet ─────────────────────────────────────────────────────────────
function HistorySheet({
  visible, onClose, conversations, activeId, onOpen, onDelete, onNew,
}: {
  visible: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}) {
  const insets = useSafeAreaInsets();

  function formatDate(ts: number) {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.historyOverlay} onPress={onClose} />
      <View style={[styles.historySheet, { paddingBottom: insets.bottom + 16 }]}>
        {/* Handle */}
        <View style={styles.sheetHandle} />

        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Chat History</Text>
          <TouchableOpacity style={styles.newChatBtn} onPress={() => { onNew(); onClose(); }}>
            <Plus size={14} color="#fff" strokeWidth={2.5} />
            <Text style={styles.newChatText}>New Chat</Text>
          </TouchableOpacity>
        </View>

        {conversations.length === 0 ? (
          <View style={styles.historyEmpty}>
            <Clock size={28} color={TEXT3} strokeWidth={1.5} />
            <Text style={styles.historyEmptyText}>No past conversations</Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(c) => c.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 1 }}
            renderItem={({ item }) => {
              const isActive = item.id === activeId;
              const msgCount = item.messages.filter((m) => m.role === 'user').length;
              return (
                <TouchableOpacity
                  style={[styles.historyItem, isActive && styles.historyItemActive]}
                  onPress={() => { onOpen(item.id); onClose(); }}
                  activeOpacity={0.75}
                >
                  <View style={styles.historyItemLeft}>
                    <Text style={styles.historyItemTitle} numberOfLines={1}>
                      {getTitle(item)}
                    </Text>
                    <Text style={styles.historyItemMeta}>
                      {formatDate(item.updatedAt)} · {msgCount} message{msgCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => onDelete(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={14} color={TEXT3} strokeWidth={1.8} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}

// ── Quick prompts ─────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  'What should I focus on today?',
  'Help me plan my week',
  'Analyze my workload',
  'Give me a productivity tip',
];

// ── Main screen ───────────────────────────────────────────────────────────────
export default function AIScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    conversations, activeId, messages, isTyping, error,
    loadConversations, newChat, openChat, deleteChat,
    sendMessage, clearError,
  } = useAIStore();
  const fetchTasks = useTaskStore((s) => s.fetchTasks);

  const [input, setInput]         = useState('');
  const [showHistory, setHistory] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchTasks();
    loadConversations();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await sendMessage(text);
  };

  const visibleMessages = messages.filter((m) => m.role !== 'system');
  const title = activeId
    ? getTitle(conversations.find((c) => c.id === activeId) ?? { messages, createdAt: 0, updatedAt: 0, id: '' })
    : 'New Chat';

  return (
    <>
      <HistorySheet
        visible={showHistory}
        onClose={() => setHistory(false)}
        conversations={conversations}
        activeId={activeId}
        onOpen={openChat}
        onDelete={deleteChat}
        onNew={newChat}
      />

      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <ArrowLeft size={20} color={TEXT} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerDot}>✦</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => setHistory(true)}
            >
              <Clock size={18} color={TEXT2} strokeWidth={1.8} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerBtn, styles.newBtn]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); newChat(); }}
            >
              <Plus size={16} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Messages / Empty state ── */}
        {visibleMessages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✦</Text>
            <Text style={styles.emptyTitle}>PARAPO AI</Text>
            <Text style={styles.emptySub}>
              Ask me anything about tasks, academics, focus, or productivity.
            </Text>
            <View style={styles.quickList}>
              {QUICK_PROMPTS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={styles.quickPrompt}
                  onPress={() => { setInput(p); sendMessage(p); }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.quickText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={visibleMessages}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => <Bubble msg={item} />}
            contentContainerStyle={styles.msgList}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              isTyping ? (
                <View style={styles.typing}>
                  <Text style={styles.aiLabelIcon}>✦</Text>
                  <ActivityIndicator size="small" color={P} style={{ marginLeft: 8 }} />
                </View>
              ) : null
            }
          />
        )}

        {/* ── Error bar ── */}
        {error && (
          <TouchableOpacity style={styles.errorBar} onPress={clearError}>
            <Text style={styles.errorText}>{error} · tap to dismiss</Text>
          </TouchableOpacity>
        )}

        {/* ── Input bar ── */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.input}
            placeholder="Ask PARAPO AI..."
            placeholderTextColor={TEXT3}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isTyping) && styles.sendBtnOff]}
            onPress={handleSend}
            disabled={!input.trim() || isTyping}
            activeOpacity={0.8}
          >
            <Send size={16} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingBottom: 12,
    backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BDR,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  newBtn: { backgroundColor: P },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8 },
  headerDot: { color: P, fontSize: 12 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: TEXT, flex: 1 },
  headerRight: { flexDirection: 'row', gap: 4 },

  // Messages
  msgList: { padding: 16, gap: 14, paddingBottom: 24 },
  bubble: { maxWidth: '86%', borderRadius: 16, padding: 14, gap: 6 },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: P },
  bubbleAI: {
    alignSelf: 'flex-start', backgroundColor: CARD,
    borderWidth: 1, borderColor: 'rgba(124,92,252,0.25)',
  },
  aiLabel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  aiLabelIcon: { color: P, fontSize: 10 },
  aiLabelText: { fontSize: 10, fontWeight: '700', color: P, letterSpacing: 0.8 },
  userText: { fontSize: 14, lineHeight: 21, color: '#fff', fontWeight: '500' },
  aiText: { fontSize: 14, lineHeight: 21, color: TEXT },
  bulletRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  bulletDot: { color: P, fontSize: 14, lineHeight: 21, width: 12 },
  bulletNum: { color: P, fontSize: 13, lineHeight: 21, minWidth: 18 },
  typing: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD, borderWidth: 1, borderColor: 'rgba(124,92,252,0.25)',
    borderRadius: 16, padding: 14, alignSelf: 'flex-start', marginTop: 4,
  },

  // Empty state
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 14,
  },
  emptyIcon: { fontSize: 44, color: P },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: TEXT },
  emptySub: { fontSize: 14, color: TEXT2, textAlign: 'center', lineHeight: 21 },
  quickList: { alignSelf: 'stretch', gap: 8, marginTop: 8 },
  quickPrompt: {
    backgroundColor: CARD, borderWidth: 1,
    borderColor: 'rgba(124,92,252,0.2)', borderRadius: 12, padding: 14,
  },
  quickText: { fontSize: 14, color: TEXT2 },

  // Error
  errorBar: { backgroundColor: 'rgba(248,113,113,0.15)', paddingHorizontal: 16, paddingVertical: 10 },
  errorText: { fontSize: 12, color: '#F87171', textAlign: 'center' },

  // Input
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingTop: 10, gap: 8,
    backgroundColor: CARD, borderTopWidth: 1, borderTopColor: BDR,
  },
  input: {
    flex: 1, backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: BDR,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    color: TEXT, fontSize: 14, maxHeight: 120,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: P, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: TEXT3 },

  // History sheet
  historyOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  historySheet: {
    backgroundColor: CARD, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '70%', borderTopWidth: 1, borderColor: BDR,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: TEXT3,
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  historyHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: BDR,
  },
  historyTitle: { fontSize: 16, fontWeight: '700', color: TEXT },
  newChatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: P, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
  },
  newChatText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  historyEmpty: { padding: 40, alignItems: 'center', gap: 10 },
  historyEmptyText: { fontSize: 14, color: TEXT2 },
  historyItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: BDR,
  },
  historyItemActive: { backgroundColor: 'rgba(124,92,252,0.08)' },
  historyItemLeft: { flex: 1 },
  historyItemTitle: { fontSize: 14, fontWeight: '600', color: TEXT },
  historyItemMeta: { fontSize: 11, color: TEXT2, marginTop: 2 },
});
