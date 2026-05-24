import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Modal, KeyboardAvoidingView,
  Platform, Linking, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Calendar, Video, Plus, Star, X, Search } from 'lucide-react-native';
import { Colors } from '../../src/constants/Colors';
import { Typography } from '../../src/constants/Typography';
import { Layout } from '../../src/constants/Spacing';
import { TopBar } from '../../src/components/navigation/TopBar';
import { useNotesStore } from '../../src/store/notesStore';
import { Note } from '../../src/services/notes';

const QUICK_LINKS = [
  {
    key: 'calendar',
    label: 'Google Calendar',
    icon: <Calendar size={18} color={Colors.accentBlue} strokeWidth={1.8} />,
    url: 'https://calendar.google.com',
    color: Colors.overlayBlue,
    border: 'rgba(77,142,255,0.25)',
  },
  {
    key: 'meet',
    label: 'Google Meet',
    icon: <Video size={18} color={Colors.accentGreen} strokeWidth={1.8} />,
    url: 'https://meet.google.com',
    color: 'rgba(78,222,163,0.1)',
    border: 'rgba(78,222,163,0.25)',
  },
];

function NoteEditor({ note, onClose }: { note: Note; onClose: () => void }) {
  const { updateNote } = useNotesStore();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const saveTimeout = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const triggerSave = (newContent: string, newTitle: string) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      updateNote(note.id, newContent, newTitle);
    }, 800);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.editorRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.editorHeader}>
          <TouchableOpacity onPress={onClose} style={styles.editorBackBtn}>
            <Text style={styles.editorBackText}>← Notes</Text>
          </TouchableOpacity>
          <Text style={styles.editorSaveLabel}>Auto-saving</Text>
        </View>
        <TextInput
          style={styles.editorTitle}
          value={title}
          onChangeText={(v) => { setTitle(v); triggerSave(content, v); }}
          placeholder="Note title..."
          placeholderTextColor={Colors.textDisabled}
        />
        <TextInput
          style={styles.editorContent}
          value={content}
          onChangeText={(v) => { setContent(v); triggerSave(v, title); }}
          placeholder="Start writing..."
          placeholderTextColor={Colors.textDisabled}
          multiline
          textAlignVertical="top"
          autoFocus={!content}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

function NoteCard({ note, onPress, onPin, onDelete }: {
  note: Note; onPress: () => void; onPin: () => void; onDelete: () => void;
}) {
  const preview = note.content.slice(0, 100).replace(/\n/g, ' ');
  const date = new Date(note.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return (
    <TouchableOpacity style={styles.noteCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.noteTop}>
        <Text style={styles.noteTitle} numberOfLines={1}>{note.title || 'Untitled'}</Text>
        <View style={styles.noteActions}>
          <TouchableOpacity onPress={onPin} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Star
              size={14}
              color={note.is_pinned ? Colors.accentBlue : Colors.textDisabled}
              fill={note.is_pinned ? Colors.accentBlue : 'transparent'}
              strokeWidth={1.8}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={13} color={Colors.textDisabled} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
      {preview ? <Text style={styles.notePreview} numberOfLines={2}>{preview}</Text> : null}
      <View style={styles.noteMeta}>
        {note.tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
        <Text style={styles.noteDate}>{date}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const {
    notes, isLoading, searchQuery,
    fetchNotes, createNote, deleteNote, pinNote,
    setSearchQuery, activeNote, setActiveNote,
  } = useNotesStore();

  useEffect(() => { fetchNotes(); }, []);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    fetchNotes(q);
  };

  const handleCreate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const note = await createNote({ title: '', content: '' });
    setActiveNote(note);
  };

  const pinned = notes.filter((n) => n.is_pinned);
  const unpinned = notes.filter((n) => !n.is_pinned);
  const allNotes = [...pinned, ...unpinned];

  return (
    <View style={styles.root}>
      <TopBar title="Notes & Hub" subtitle="Your workspace" />

      {activeNote && (
        <NoteEditor
          note={activeNote}
          onClose={() => { setActiveNote(null); fetchNotes(); }}
        />
      )}

      <FlatList
        data={allNotes}
        keyExtractor={(n) => n.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: Layout.headerHeight + insets.top + 16, paddingBottom: insets.bottom + 80 },
        ]}
        ListHeaderComponent={
          <>
            {/* Quick links */}
            <View style={styles.quickLinksRow}>
              {QUICK_LINKS.map((link) => (
                <TouchableOpacity
                  key={link.key}
                  style={[styles.quickLink, { backgroundColor: link.color, borderColor: link.border }]}
                  onPress={() => Linking.openURL(link.url)}
                  activeOpacity={0.75}
                >
                  {link.icon}
                  <Text style={styles.quickLinkLabel}>{link.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
              <Search size={14} color={Colors.textMuted} strokeWidth={1.8} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search notes..."
                placeholderTextColor={Colors.textDisabled}
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>

            {/* Section header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {pinned.length > 0 ? 'Pinned & Recent' : 'All Notes'}
              </Text>
              {isLoading && <ActivityIndicator size="small" color={Colors.accentBlue} />}
            </View>
          </>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>✎</Text>
              <Text style={styles.emptyTitle}>No notes yet</Text>
              <Text style={styles.emptySubtitle}>Tap + to create your first note</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            onPress={() => setActiveNote(item)}
            onPin={() => pinNote(item.id)}
            onDelete={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              deleteNote(item.id);
            }}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 72 }]}
        onPress={handleCreate}
        activeOpacity={0.85}
      >
        <Plus size={22} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  listContent: { paddingHorizontal: Layout.screenPaddingH, gap: 0 },

  quickLinksRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  quickLink: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 10, padding: 14,
  },
  quickLinkLabel: { ...Typography.labelMedium, color: Colors.textPrimary, fontWeight: '600', flex: 1 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 16,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: 14 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  sectionTitle: { ...Typography.labelUppercase, color: Colors.textMuted, letterSpacing: 1 },

  noteCard: {
    backgroundColor: Colors.bgElevated, borderWidth: 1,
    borderColor: Colors.border, borderRadius: 10, padding: 14, gap: 6,
  },
  noteTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  noteTitle: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '600', flex: 1 },
  noteActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notePreview: { ...Typography.bodySmall, color: Colors.textMuted, lineHeight: 18 },
  noteMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 },
  tag: { backgroundColor: Colors.overlayBlue, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { ...Typography.labelSmall, color: Colors.accentBlue },
  noteDate: { ...Typography.labelSmall, color: Colors.textDisabled, marginLeft: 'auto' },

  emptyState: { paddingTop: 60, alignItems: 'center', gap: 10 },
  emptyIcon: { fontSize: 40, color: Colors.textDisabled },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary },
  emptySubtitle: { ...Typography.bodySmall, color: Colors.textMuted },

  fab: {
    position: 'absolute', right: 20,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.accentBlue,
    alignItems: 'center', justifyContent: 'center',
    elevation: 4,
    shadowColor: Colors.accentBlue, shadowOpacity: 0.4,
    shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },

  editorRoot: { flex: 1, backgroundColor: Colors.bg },
  editorHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  editorBackBtn: { padding: 4 },
  editorBackText: { ...Typography.bodyMedium, color: Colors.accentBlue },
  editorSaveLabel: { ...Typography.labelSmall, color: Colors.textDisabled },
  editorTitle: {
    fontSize: 22, fontWeight: '700', color: Colors.textPrimary,
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle,
  },
  editorContent: {
    flex: 1, paddingHorizontal: 20, paddingTop: 16,
    fontSize: 15, color: Colors.textPrimary, lineHeight: 24,
  },
});
