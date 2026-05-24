import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../src/constants/Colors';
import { Typography } from '../../src/constants/Typography';
import { useNotesStore } from '../../src/store/notesStore';
import { Note } from '../../src/services/notes';

function NoteCard({ note, onPress, onPin, onDelete }: {
  note: Note;
  onPress: () => void;
  onPin: () => void;
  onDelete: () => void;
}) {
  const preview = note.content.slice(0, 120).replace(/\n/g, ' ');
  const date = new Date(note.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return (
    <TouchableOpacity style={styles.noteCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.noteTop}>
        <Text style={styles.noteTitle} numberOfLines={1}>{note.title || 'Untitled'}</Text>
        <View style={styles.noteActions}>
          <TouchableOpacity onPress={onPin} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.pinIcon, note.is_pinned && styles.pinIconActive]}>
              {note.is_pinned ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.deleteIcon}>✕</Text>
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

function NoteEditor({ note, onClose }: { note: Note; onClose: () => void }) {
  const { updateNote } = useNotesStore();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const saveTimeout = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const triggerSave = (newContent: string, newTitle: string) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      updateNote(note.id, newContent, newTitle);
    }, 1000);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView style={styles.editorRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
          multiline={false}
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

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { notes, isLoading, searchQuery, fetchNotes, createNote, deleteNote, pinNote, setSearchQuery, activeNote, setActiveNote } = useNotesStore();

  useEffect(() => { fetchNotes(); }, []);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    fetchNotes(q);
  };

  const handleCreate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const note = await createNote({ title: 'New Note', content: '' });
      setActiveNote(note);
    } catch {}
  };

  const pinned = notes.filter((n) => n.is_pinned);
  const unpinned = notes.filter((n) => !n.is_pinned);
  const allNotes = [...pinned, ...unpinned];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {activeNote && (
        <NoteEditor note={activeNote} onClose={() => { setActiveNote(null); fetchNotes(); }} />
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notes</Text>
        <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
          <Text style={styles.createBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search notes..."
          placeholderTextColor={Colors.textDisabled}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.accentBlue} />
        </View>
      ) : allNotes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✎</Text>
          <Text style={styles.emptyTitle}>No notes yet</Text>
          <Text style={styles.emptySubtitle}>Tap "New" to create your first note.</Text>
        </View>
      ) : (
        <FlatList
          data={allNotes}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={() => setActiveNote(item)}
              onPin={() => pinNote(item.id).catch(() => {})}
              onDelete={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                deleteNote(item.id);
              }}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  backText: { color: Colors.textPrimary, fontSize: 20 },
  headerTitle: { ...Typography.h2, color: Colors.textPrimary, fontWeight: '700' },
  createBtn: {
    backgroundColor: Colors.accentBlueDark, paddingHorizontal: 14,
    paddingVertical: 7, borderRadius: 6,
  },
  createBtnText: { ...Typography.labelLarge, color: Colors.accentBlueDeeper, fontWeight: '700' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, backgroundColor: Colors.bgElevated,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 12, gap: 8,
  },
  searchIcon: { color: Colors.textMuted, fontSize: 16 },
  searchInput: { flex: 1, paddingVertical: 11, color: Colors.textPrimary, fontSize: 14 },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { fontSize: 48, color: Colors.textDisabled },
  emptyTitle: { ...Typography.h2, color: Colors.textPrimary },
  emptySubtitle: { ...Typography.bodyMedium, color: Colors.textMuted },

  list: { padding: 16, gap: 12, paddingBottom: 32 },
  noteCard: {
    backgroundColor: Colors.bgElevated, borderWidth: 1,
    borderColor: Colors.border, borderRadius: 10, padding: 16, gap: 8,
  },
  noteTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  noteTitle: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '600', flex: 1 },
  noteActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pinIcon: { color: Colors.textDisabled, fontSize: 14 },
  pinIconActive: { color: Colors.accentBlue },
  deleteIcon: { color: Colors.textDisabled, fontSize: 12 },
  notePreview: { ...Typography.bodySmall, color: Colors.textMuted, lineHeight: 18 },
  noteMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  tag: {
    backgroundColor: Colors.overlayBlue, borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  tagText: { ...Typography.labelSmall, color: Colors.accentBlue },
  noteDate: { ...Typography.labelSmall, color: Colors.textDisabled, marginLeft: 'auto' },

  // Editor
  editorRoot: { flex: 1, backgroundColor: Colors.bg },
  editorHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 16,
    paddingTop: 56, borderBottomWidth: 1, borderBottomColor: Colors.border,
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
