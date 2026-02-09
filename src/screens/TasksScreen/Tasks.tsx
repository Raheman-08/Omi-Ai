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
import { getTasks, createTask, type Task } from '../../api/tasks';
import { hasValidToken } from '../../api/authStore';

const TASK_TITLE_MAX_LENGTH = 200;

function formatDueDisplay(dueAt: string | null | undefined): string {
  if (!dueAt) return '';
  try {
    const d = new Date(dueAt);
    if (Number.isNaN(d.getTime())) return '';
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const dateStr = isToday ? 'Today' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    return `${dateStr} - ${timeStr}`;
  } catch {
    return '';
  }
}

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [addTaskTitle, setAddTaskTitle] = useState('');
  const [addTaskMarkComplete, setAddTaskMarkComplete] = useState(false);
  const [addTaskDue, setAddTaskDue] = useState<string | null>(null);
  const [addTaskCreating, setAddTaskCreating] = useState(false);

  const addSheetRef = useRef<BottomSheetModal>(null);
  const addSheetSnapPoints = useMemo(() => ['50%'], []);

  const loadTasks = useCallback(async () => {
    if (!hasValidToken()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await getTasks();
      setTasks(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const defaultDueToday = useCallback(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 0);
    return d.toISOString();
  }, []);

  const openAddSheet = useCallback(() => {
    setAddTaskTitle('');
    setAddTaskMarkComplete(false);
    setAddTaskDue(defaultDueToday());
    addSheetRef.current?.present();
  }, [defaultDueToday]);

  const closeAddSheet = useCallback(() => {
    addSheetRef.current?.dismiss();
  }, []);

  const handleCreateTask = useCallback(async () => {
    const title = addTaskTitle.trim();
    if (!title) return;
    setAddTaskCreating(true);
    try {
      const task = await createTask({
        title,
        completed: addTaskMarkComplete,
        due_at: addTaskDue,
      });
      if (task) {
        setTasks((prev) => [task, ...prev]);
        closeAddSheet();
      }
    } finally {
      setAddTaskCreating(false);
    }
  }, [addTaskTitle, addTaskMarkComplete, addTaskDue, closeAddSheet]);

  const dueDisplay = useMemo(() => {
    if (addTaskDue) return formatDueDisplay(addTaskDue);
    return 'Today - 11:59 PM';
  }, [addTaskDue]);

  const setDueToday = useCallback(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 0);
    setAddTaskDue(d.toISOString());
  }, []);

  const clearDue = useCallback(() => {
    setAddTaskDue(null);
  }, []);

  const isEmpty = tasks.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {loading && (
            <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" style={styles.headerSpinner} />
          )}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Feather name="upload" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Feather name="check-circle" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Feather name="settings" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="rgba(255,255,255,0.7)" />
        </View>
      ) : isEmpty ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconCard}>
            <View style={styles.emptyIconCircle}>
              <Feather name="check" size={48} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.emptyTitle}>No Tasks Yet</Text>
          <Text style={styles.emptyLine}>Tasks from your conversations will appear here.</Text>
          <Text style={styles.emptyLine}>Tap + to create one manually.</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {tasks.map((t) => (
            <View key={t.id} style={styles.taskRow}>
              <Feather name={t.completed ? 'check-circle' : 'circle'} size={22} color="rgba(255,255,255,0.7)" />
              <Text style={[styles.taskTitle, t.completed && styles.taskTitleCompleted]}>{t.title}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.fab} onPress={openAddSheet} activeOpacity={0.8}>
        <Feather name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <BottomSheetModal
        ref={addSheetRef}
        snapPoints={addSheetSnapPoints}
        enablePanDownToClose
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetKeyboard}
        >
          <BottomSheetView style={styles.sheetContent}>
            <TouchableOpacity
              style={styles.markCompleteRow}
              onPress={() => setAddTaskMarkComplete(!addTaskMarkComplete)}
              activeOpacity={0.7}
            >
              <Feather
                name={addTaskMarkComplete ? 'check-square' : 'square'}
                size={22}
                color="rgba(255,255,255,0.8)"
              />
              <Text style={styles.markCompleteText}>Mark Complete</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.taskInput}
              placeholder="What needs to be done?"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={addTaskTitle}
              onChangeText={(t) => setAddTaskTitle(t.slice(0, TASK_TITLE_MAX_LENGTH))}
              maxLength={TASK_TITLE_MAX_LENGTH}
              multiline
              onSubmitEditing={handleCreateTask}
            />
            <View style={styles.dueRow}>
              <TouchableOpacity style={styles.dueBtn} onPress={setDueToday} activeOpacity={0.7}>
                <Feather name="clock" size={18} color="rgba(255,255,255,0.8)" />
                <Text style={styles.dueText}>{dueDisplay}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearDue} style={styles.clearDueBtn}>
                <Feather name="x" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>
            <View style={styles.sheetFooter}>
              <Text style={styles.charCount}>
                {addTaskTitle.length}/{TASK_TITLE_MAX_LENGTH}
              </Text>
              <TouchableOpacity
                style={styles.doneCreateBtn}
                onPress={handleCreateTask}
                disabled={!addTaskTitle.trim() || addTaskCreating}
              >
                <Feather name="arrow-left" size={18} color="rgba(255,255,255,0.8)" />
                <Text style={styles.doneCreateText}>Press done to create</Text>
              </TouchableOpacity>
            </View>
          </BottomSheetView>
        </KeyboardAvoidingView>
      </BottomSheetModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSpinner: {
    marginRight: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCard: {
    width: 120,
    height: 120,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyLine: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 6,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: 'rgba(255,255,255,0.5)',
  },
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
  sheetBg: {
    backgroundColor: 'rgba(36,36,36,1)',
  },
  sheetHandle: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  sheetKeyboard: {
    flex: 1,
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  markCompleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  markCompleteText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  taskInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dueText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
  },
  clearDueBtn: {
    padding: 4,
  },
  sheetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  charCount: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
  },
  doneCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  doneCreateText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
  },
});

export default Tasks;
