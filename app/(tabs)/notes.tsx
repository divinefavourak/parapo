import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Modal, KeyboardAvoidingView,
  Platform, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Plus, Search, Star, X, Calendar, Video } from 'lucide-react-native';
import { useNotesStore } from '../../src/store/notesStore';
import { Note } from '../../src/services/notes';

// ── Design tokens ─────────────────────────────────────────────────────────────
const P      = '#7C5CFC';
const P_DIM  = 'rgba(124,92,252,0.15)';
const CARD   = '#13131F';
const BDR    = 'rgba(255,255,255,0.07)';
const TEXT   = '#FFFFFF';
const TEXT2  = '#8B8BAA';
const TEXT3  = '#3D3D5C';
const GREEN  = '#4ADE80';

const QUICK_LINKS = [
  { key: 'cal',  label: 'Google Calendar', icon: Calendar, color: '#60A5FA', url: 'https://calendar.google.com' },
  { key: 'meet', label: 'Google Meet',     icon: Video,    color: GREEN,     url: 'https://meet.google.com' },
];

// ── Note editor modal ─────────────────────────────────────────────────────────
function NoteEditor({ note, onClose }: { note: Note; onClose: () => void }) {
  const { updateNote } = useNotesStore();
  const [title, setTitle]     = useState(note.title);
  const [content, setContent] = useState(note.content);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const save = (c: string, t: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => updateNote(note.id, c, t), 800);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView style={styles.editorRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.editorHeader}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backText}>← Notes</Text>
          </TouchableOpacity>
          <Text style={styles.autoSave}>Auto-saving</Text>
        </View>
        <TextInput
          style={styles.editorTitle}
          value={title}
          onChangeText={(v) => { setTitle(v); save(content, v); }}
          placeholder="Note title..."
          placeholderTextColor={TEXT3}
        />
        <TextInput
          style={styles.editorContent}
          value={content}
          onChangeText={(v) => { setContent(v); save(v, title); }}
          placeholder="Start writing..."
          placeholderTextColor={TEXT3}
          multiline
          textAlignVertical="top"
          autoFocus={!content}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Note card ─────────────────────────────────────────────────────────────────
function NoteCard({ note, onPress, onPin, onDelete }: {
  note: Note; onPress: () => void; onPin: () => void; onDelete: () => void;
}) {
  const preview = note.content.slice(0, 90).replace(/\n/g, ' ');
  const date = new Date(note.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <TouchableOpacity style={styles.noteCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.noteTop}>
        <Text style={styles.noteTitle} numberOfLines={1}>{note.title || 'Untitled'}</Text>
        <View style={styles.noteActions}>
          <TouchableOpacity onPress={onPin} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Star
              size={14}
              color={note.is_pinned ? P : TEXT3}
              fill={note.is_pinned ? P : 'transparent'}
              strokeWidth={1.8}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={13} color={TEXT3} strokeWidth={2} />
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

// ── Main screen ───────────────────────────────────────────────────────────────
export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const {
    notes, isLoading, searchQuery,
    fetchNotes, createNote, deleteNote, pinNote,
    setSearchQuery, activeNote, setActiveNote,
  } = useNotesStore();

  useEffect(() => { fetchNotes(); }, []);

  const handleSearch = (q: string) => { setSearchQuery(q); fetchNotes(q); };

  const handleCreate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const note = await createNote({ title: '', content: '' });
      setActiveNote(note);
    } catch {}
  };

  const pinned   = notes.filter((n) => n.is_pinned);
  const unpinned = notes.filter((n) => !n.is_pinned);
  const allNotes = [...pinned, ...unpinned];

  return (
    <View style={styles.root}>
      {activeNote && (
        <NoteEditor note={activeNote} onClose={() => { setActiveNote(null); fetchNotes(); }} />
      )}

      <FlatList
        data={allNotes}
        keyExtractor={(n) => n.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 },
        ]}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Notes & Hub</Text>
              <Text style={styles.headerSub}>Your workspace</Text>
            </View>

            {/* Quick links */}
            <View style={styles.quickRow}>
              {QUICK_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <TouchableOpacity
                    key={link.key}
                    style={[styles.quickLink, { borderColor: link.color + '30' }]}
                    onPress={() => Linking.openURL(link.url)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.quickIconWrap, { backgroundColor: link.color + '20' }]}>
                      <Icon size={16} color={link.color} strokeWidth={1.8} />
                    </View>
                    <Text style={styles.quickLabel}>{link.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
              <Search size={14} color={TEXT2} strokeWidth={1.8} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search notes..."
                placeholderTextColor={TEXT3}
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>

            {/* Section header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {pinned.length > 0 ? 'Pinned & Recent' : 'All Notes'}
              </Text>
              {isLoading && <ActivityIndicator size="small" color={P} />}
            </View>
          </>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>✎</Text>
              <Text style={styles.emptyTitle}>No notes yet</Text>
              <Text style={styles.emptySub}>Tap + to create your first note</Text>
            </View>
          ) : null
        }
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
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 80 }]}
        onPress={handleCreate}
        activeOpacity={0.85}
      >
        <Plus size={22} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a' },
  list: { paddingHorizontal: 20, gap: 0 },

  header: { marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: TEXT, letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: TEXT2, marginTop: 2 },

  // Quick links
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  quickLink: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: CARD, borderWidth: 1, borderRadius: 14, padding: 12,
  },
  quickIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 12, fontWeight: '600', color: TEXT, flex: 1 },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: BDR,
    paddingHorizontal: 14, paddingVertical: 11, marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 14, color: TEXT },

  // Section
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: TEXT2, textTransform: 'uppercase', letterSpacing: 0.8 },

  // Note card
  noteCard: {
    backgroundColor: CARD, borderWidth: 1, borderColor: BDR,
    borderRadius: 16, padding: 14, gap: 6,
  },
  noteTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  noteTitle: { fontSize: 15, fontWeight: '700', color: TEXT, flex: 1 },
  noteActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notePreview: { fontSize: 13, color: TEXT2, lineHeight: 18 },
  noteMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 },
  tag: { backgroundColor: P_DIM, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, color: P, fontWeight: '600' },
  noteDate: { fontSize: 11, color: TEXT3, marginLeft: 'auto' },

  // Empty
  empty: { paddingTop: 60, alignItems: 'center', gap: 10 },
  emptyIcon: { fontSize: 36, color: TEXT3 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: TEXT },
  emptySub: { fontSize: 13, color: TEXT2 },

  // FAB
  fab: {
    position: 'absolute', right: 20,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: P, alignItems: 'center', justifyContent: 'center',
    elevation: 6,
    shadowColor: P, shadowOpacity: 0.5, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  // Editor
  editorRoot: { flex: 1, backgroundColor: '#0a0a0a' },
  editorHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: BDR,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 15, color: P, fontWeight: '600' },
  autoSave: { fontSize: 11, color: TEXT3 },
  editorTitle: {
    fontSize: 22, fontWeight: '700', color: TEXT,
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: BDR,
  },
  editorContent: {
    flex: 1, paddingHorizontal: 20, paddingTop: 16,
    fontSize: 15, color: TEXT, lineHeight: 24,
  },
});
