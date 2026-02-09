import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import {
  getMemories,
  getMemoryStats,
  createMemory,
  makeAllMemoriesPrivate,
  makeAllMemoriesPublic,
  deleteAllMemories,
  buildKnowledgeGraph,
  type Memory,
  type MemoryCategory,
} from '../../api/memories';
import { hasValidToken } from '../../api/authStore';

const FILTER_OPTIONS: { key: 'all' | MemoryCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'about_you', label: 'About You' },
  { key: 'insights', label: 'Insights' },
  { key: 'manual', label: 'Manual' },
];

const Memories = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [stats, setStats] = useState({ total: 0, public: 0, private: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState<MemoryCategory[]>([]);
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [savingMemory, setSavingMemory] = useState(false);
  const [managementActionLoading, setManagementActionLoading] = useState(false);
  const [graphView, setGraphView] = useState(false);

  const newMemorySheetRef = useRef<BottomSheetModal>(null);
  const managementSheetRef = useRef<BottomSheetModal>(null);
  const newMemorySnap = useMemo(() => ['55%'], []);
  const managementSnap = useMemo(() => ['70%'], []);

  const loadData = useCallback(async () => {
    if (!hasValidToken()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [list, statsRes] = await Promise.all([
        getMemories({
          q: searchQuery.trim() || undefined,
          categories: selectedFilters.length ? selectedFilters : undefined,
          limit: 100,
        }),
        getMemoryStats(),
      ]);
      setMemories(list);
      setStats(statsRes);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedFilters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openNewMemory = useCallback(() => {
    setNewMemoryContent('');
    newMemorySheetRef.current?.present();
  }, []);

  const closeNewMemory = useCallback(() => {
    newMemorySheetRef.current?.dismiss();
  }, []);

  const openManagement = useCallback(() => {
    managementSheetRef.current?.present();
  }, []);

  const closeManagement = useCallback(() => {
    managementSheetRef.current?.dismiss();
  }, []);

  const handleSaveMemory = useCallback(async () => {
    const content = newMemoryContent.trim();
    if (!content) return;
    setSavingMemory(true);
    try {
      const memory = await createMemory({ content, category: 'manual' });
      if (memory) {
        setMemories((prev) => [memory, ...prev]);
        setStats((s) => ({ ...s, total: s.total + 1, private: s.private + 1 }));
        closeNewMemory();
      }
    } finally {
      setSavingMemory(false);
    }
  }, [newMemoryContent, closeNewMemory]);

  const toggleFilter = useCallback((key: 'all' | MemoryCategory) => {
    if (key === 'all') {
      setSelectedFilters([]);
      return;
    }
    setSelectedFilters((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  }, []);

  const handleMakeAllPrivate = useCallback(async () => {
    setManagementActionLoading(true);
    try {
      const ok = await makeAllMemoriesPrivate();
      if (ok) {
        setStats((s) => ({ ...s, public: 0, private: s.total }));
        loadData();
      }
    } finally {
      setManagementActionLoading(false);
    }
  }, [loadData]);

  const handleMakeAllPublic = useCallback(async () => {
    setManagementActionLoading(true);
    try {
      const ok = await makeAllMemoriesPublic();
      if (ok) {
        setStats((s) => ({ ...s, private: 0, public: s.total }));
        loadData();
      }
    } finally {
      setManagementActionLoading(false);
    }
  }, [loadData]);

  const handleDeleteAll = useCallback(async () => {
    setManagementActionLoading(true);
    try {
      const ok = await deleteAllMemories();
      if (ok) {
        setMemories([]);
        setStats({ total: 0, public: 0, private: 0 });
        closeManagement();
      }
    } finally {
      setManagementActionLoading(false);
    }
  }, [closeManagement]);

  const handleBuildGraph = useCallback(async () => {
    const ok = await buildKnowledgeGraph();
    if (ok) setGraphView(false);
  }, []);

  const isEmpty = memories.length === 0;
  const showFilterCheck = (key: 'all' | MemoryCategory) =>
    key === 'all' ? selectedFilters.length === 0 : selectedFilters.includes(key as MemoryCategory);

  if (graphView) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.graphHeader}>
          <TouchableOpacity onPress={() => setGraphView(false)} style={styles.graphHeaderBtn}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.graphTitle}>omi.me</Text>
          <TouchableOpacity style={styles.graphHeaderBtn}>
            <Feather name="share" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.graphEmpty}>
          <View style={styles.graphIconWrap}>
            <Feather name="git-branch" size={56} color="rgba(255,255,255,0.4)" />
          </View>
          <Text style={styles.graphEmptyTitle}>No knowledge graph yet</Text>
          <Text style={styles.graphEmptyDesc}>
            Your knowledge graph will be built automatically as you create new memories.
          </Text>
          <TouchableOpacity style={styles.buildGraphBtn} onPress={handleBuildGraph}>
            <Feather name="zap" size={20} color="#FFFFFF" />
            <Text style={styles.buildGraphText}>Build Graph</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {loading && (
            <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" style={styles.spinner} />
          )}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={openManagement}>
            <Feather name="settings" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Feather name="search" size={18} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search memories..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.brainBtn} onPress={() => setGraphView(true)}>
          <Feather name="cpu" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn} onPress={openManagement}>
          <Feather name="filter" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading && !memories.length ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="rgba(255,255,255,0.7)" />
        </View>
      ) : isEmpty ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconWrap}>
            <Feather name="file-text" size={48} color="rgba(255,255,255,0.5)" />
            <View style={styles.emptyIconBadge}>
              <Feather name="plus" size={20} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.emptyTitle}>No memories in these categories.</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {memories.map((m) => (
            <View key={m.id} style={styles.memoryRow}>
              <Text style={styles.memoryContent} numberOfLines={2}>
                {m.content}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.fab} onPress={openNewMemory} activeOpacity={0.8}>
        <Feather name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* New Memory sheet */}
      <BottomSheetModal
        ref={newMemorySheetRef}
        snapPoints={newMemorySnap}
        enablePanDownToClose
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetKb}
        >
          <BottomSheetView style={styles.sheetContent}>
            <View style={styles.newMemoryHeader}>
              <View style={styles.newMemoryPill}>
                <Feather name="plus" size={16} color="#FFFFFF" />
                <Feather name="zap" size={14} color="#FFFFFF" style={styles.sparkle} />
                <Text style={styles.newMemoryPillText}>New Memory</Text>
              </View>
              <TouchableOpacity onPress={closeNewMemory} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Feather name="x" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.memoryInput}
              placeholder="I like to eat ice cream..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={newMemoryContent}
              onChangeText={setNewMemoryContent}
              multiline
            />
            <TouchableOpacity
              style={[styles.saveMemoryBtn, (!newMemoryContent.trim() || savingMemory) && styles.saveMemoryBtnDisabled]}
              onPress={handleSaveMemory}
              disabled={!newMemoryContent.trim() || savingMemory}
            >
              <Text style={styles.saveMemoryText}>
                {savingMemory ? 'Saving…' : 'Save Memory'}
              </Text>
            </TouchableOpacity>
          </BottomSheetView>
        </KeyboardAvoidingView>
      </BottomSheetModal>

      {/* Memory Management sheet */}
      <BottomSheetModal
        ref={managementSheetRef}
        snapPoints={managementSnap}
        enablePanDownToClose
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <BottomSheetView style={styles.mgmtContent}>
          <View style={styles.mgmtTitleRow}>
            <Text style={styles.mgmtTitle}>Memory Management</Text>
            <TouchableOpacity onPress={closeManagement} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.mgmtSection}>Filter Memories</Text>
          {FILTER_OPTIONS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={styles.filterRow}
              onPress={() => toggleFilter(key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterLabel, (key !== 'all' && showFilterCheck(key)) && styles.filterLabelPurple]}>
                {label}
              </Text>
              {(key === 'all' && selectedFilters.length === 0) || (key !== 'all' && selectedFilters.includes(key as MemoryCategory)) ? (
                <Feather name="check" size={20} color="#A855F7" />
              ) : null}
            </TouchableOpacity>
          ))}
          <Text style={styles.mgmtSection}>You have {stats.total} total memories</Text>
          <View style={styles.statsRow}>
            <Feather name="globe" size={18} color="rgba(255,255,255,0.7)" />
            <Text style={styles.statsText}>Public memories</Text>
            <Text style={styles.statsNum}>{stats.public}</Text>
          </View>
          <View style={styles.statsRow}>
            <Feather name="lock" size={18} color="rgba(255,255,255,0.7)" />
            <Text style={styles.statsText}>Private memories</Text>
            <Text style={styles.statsNum}>{stats.private}</Text>
          </View>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleMakeAllPrivate}
            disabled={managementActionLoading}
          >
            <Feather name="lock" size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Make All Memories Private</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleMakeAllPublic}
            disabled={managementActionLoading}
          >
            <Feather name="globe" size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Make All Memories Public</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={handleDeleteAll}
            disabled={managementActionLoading}
          >
            <Feather name="trash-2" size={18} color="#EF4444" />
            <Text style={styles.deleteBtnText}>Delete All Memories</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  spinner: { marginRight: 8 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 0,
  },
  brainBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIconBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 18, color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 100 },
  memoryRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  memoryContent: { fontSize: 16, color: '#FFFFFF' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetBg: { backgroundColor: 'rgba(36,36,36,1)' },
  sheetHandle: { backgroundColor: 'rgba(255,255,255,0.35)' },
  sheetKb: { flex: 1 },
  sheetContent: { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 24 },
  newMemoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  newMemoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  sparkle: { marginLeft: 2 },
  newMemoryPillText: { fontSize: 15, color: '#FFFFFF', fontWeight: '600' },
  memoryInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  saveMemoryBtn: {
    backgroundColor: '#A855F7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveMemoryBtnDisabled: { opacity: 0.5 },
  saveMemoryText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  mgmtContent: { paddingHorizontal: 24, paddingBottom: 32 },
  mgmtTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  mgmtTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  mgmtSection: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 12 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  filterLabel: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  filterLabelPurple: { color: '#A855F7' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  statsText: { fontSize: 15, color: 'rgba(255,255,255,0.9)' },
  statsNum: { fontSize: 15, color: 'rgba(255,255,255,0.9)', marginLeft: 'auto' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  actionBtnText: { fontSize: 16, color: '#FFFFFF' },
  deleteBtn: {},
  deleteBtnText: { fontSize: 16, color: '#EF4444' },
  graphHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  graphHeaderBtn: { padding: 8 },
  graphTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  graphEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  graphIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  graphEmptyTitle: { fontSize: 20, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginBottom: 12 },
  graphEmptyDesc: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 24,
  },
  buildGraphBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#A855F7',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buildGraphText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});

export default Memories;
