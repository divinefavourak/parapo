import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../src/constants/Colors';
import { Typography } from '../../src/constants/Typography';
import { useAIStore } from '../../src/store/aiStore';
import { ChatMessage } from '../../src/services/ai';

const QUICK_PROMPTS = [
  'What should I focus on today?',
  'Help me plan my week',
  'Analyze my workload',
  'Give me a productivity tip',
];

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
      {!isUser && (
        <View style={styles.aiLabel}>
          <Text style={styles.aiLabelIcon}>✦</Text>
          <Text style={styles.aiLabelText}>PARAPO AI</Text>
        </View>
      )}
      <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI]}>
        {msg.content}
      </Text>
    </View>
  );
}

export default function AIScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { messages, isTyping, error, sendMessage, clearConversation, clearError } = useAIStore();
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

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

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    sendMessage(prompt);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerIcon}>✦</Text>
          <Text style={styles.headerTitle}>PARAPO AI</Text>
        </View>
        <TouchableOpacity onPress={clearConversation} style={styles.clearBtn}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✦</Text>
          <Text style={styles.emptyTitle}>AI Command Center</Text>
          <Text style={styles.emptySubtitle}>
            Ask me anything about your tasks, academics, leadership, or productivity.
          </Text>
          <View style={styles.quickPrompts}>
            {QUICK_PROMPTS.map((p) => (
              <TouchableOpacity
                key={p}
                style={styles.quickPrompt}
                onPress={() => handleQuickPrompt(p)}
                activeOpacity={0.75}
              >
                <Text style={styles.quickPromptText}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages.filter((m) => m.role !== 'system')}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <MessageBubble msg={item} />}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isTyping ? (
              <View style={styles.typingIndicator}>
                <Text style={styles.aiLabelIcon}>✦</Text>
                <ActivityIndicator size="small" color={Colors.accentPurple} style={{ marginLeft: 8 }} />
              </View>
            ) : null
          }
        />
      )}

      {/* Error */}
      {error && (
        <TouchableOpacity style={styles.errorBar} onPress={clearError}>
          <Text style={styles.errorText}>{error} (tap to dismiss)</Text>
        </TouchableOpacity>
      )}

      {/* Input */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask PARAPO AI..."
          placeholderTextColor={Colors.textDisabled}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || isTyping) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || isTyping}
          activeOpacity={0.8}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16,
    paddingBottom: 12, backgroundColor: Colors.bgElevated,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 8 },
  backText: { color: Colors.textPrimary, fontSize: 20 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: { color: Colors.accentPurpleLight, fontSize: 14 },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary, fontWeight: '700' },
  clearBtn: { padding: 8 },
  clearText: { ...Typography.labelMedium, color: Colors.textMuted },

  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 16,
  },
  emptyIcon: { fontSize: 48, color: Colors.accentPurple },
  emptyTitle: { ...Typography.h2, color: Colors.textPrimary, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { ...Typography.bodyMedium, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  quickPrompts: { alignSelf: 'stretch', gap: 10, marginTop: 8 },
  quickPrompt: {
    backgroundColor: Colors.bgElevated, borderWidth: 1,
    borderColor: 'rgba(160,120,255,0.25)', borderRadius: 10,
    padding: 14,
  },
  quickPromptText: { ...Typography.bodySmall, color: Colors.accentPurpleLight },

  messageList: { padding: 16, gap: 16, paddingBottom: 24 },
  bubble: {
    maxWidth: '85%', borderRadius: 12, padding: 14, gap: 6,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.accentBlueDark,
  },
  bubbleAI: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.bgElevated,
    borderWidth: 1, borderColor: 'rgba(160,120,255,0.2)',
  },
  aiLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  aiLabelIcon: { color: Colors.accentPurpleLight, fontSize: 10 },
  aiLabelText: { ...Typography.labelSmall, color: Colors.accentPurpleLight, letterSpacing: 0.8 },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  bubbleTextUser: { color: Colors.accentBlueDeeper, fontWeight: '500' },
  bubbleTextAI: { color: Colors.textPrimary },

  typingIndicator: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: Colors.bgElevated, borderWidth: 1,
    borderColor: 'rgba(160,120,255,0.2)', borderRadius: 12,
    alignSelf: 'flex-start', marginTop: 8,
  },

  errorBar: {
    backgroundColor: Colors.overlayRed, paddingHorizontal: 16, paddingVertical: 10,
  },
  errorText: { ...Typography.labelMedium, color: Colors.accentRed, textAlign: 'center' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingTop: 12, gap: 10,
    backgroundColor: Colors.bgElevated,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  textInput: {
    flex: 1, backgroundColor: Colors.bgSurface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    color: Colors.textPrimary, fontSize: 14,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.accentPurple,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.bgSubtle },
  sendIcon: { color: Colors.bg, fontSize: 18, fontWeight: '700' },
});
