import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { colors } from './src/theme';
import { confirm, finishedWorkout, nextTemplateId, setConfirmHandler, useStore } from './src/store';
import { useGymPresence } from './src/gym';
import Elapsed from './src/Elapsed';
import OverviewScreen from './src/screens/OverviewScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import WorkoutScreen, { workoutFromTemplate } from './src/screens/WorkoutScreen';
import ActiveWorkout from './src/screens/ActiveWorkout';
import TemplateEditor from './src/screens/TemplateEditor';
import SettingsScreen from './src/screens/SettingsScreen';

const TABS = [
  { key: 'overview', label: 'Overview', icon: '▦' },
  { key: 'history', label: 'History', icon: '◷' },
  { key: 'workout', label: 'Workout', icon: '+' },
];

export default function App() {
  const [state, update] = useStore();
  const [tab, setTab] = useState('workout');
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dismissed, setDismissed] = useState({ arrive: false, leave: null });
  const presence = useGymPresence(state?.settings?.gym);

  useEffect(() => setConfirmHandler(setDialog), []);
  // Each new arrival at the gym may prompt again.
  useEffect(() => {
    if (presence.status === 'away') setDismissed((d) => ({ ...d, arrive: false }));
  }, [presence.status]);

  if (!state) {
    return (
      <View style={[styles.root, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const screenProps = {
    state,
    update,
    openWorkout: () => setWorkoutOpen(true),
    editTemplate: setEditingTemplate,
    openSettings: () => setSettingsOpen(true),
  };

  const next = state.templates.find((t) => t.id === nextTemplateId(state));
  const lastEnd = state.workouts[0]?.endedAt || 0;
  const showArrive =
    presence.status === 'at' && !state.active && !dismissed.arrive && Date.now() - lastEnd > 90 * 60 * 1000;
  const showLeave = presence.status === 'away' && state.active && dismissed.leave !== state.active.id;

  const startNext = () => {
    update(() => ({ active: workoutFromTemplate(next || null) }));
    setWorkoutOpen(true);
  };
  const finishFromBanner = () => {
    const done = finishedWorkout(state.active);
    if (!done) {
      confirm('No completed sets', 'Nothing was ticked off. Discard this workout?', () => update(() => ({ active: null })), 'Discard');
      return;
    }
    update((prev) => ({ active: null, workouts: [done, ...prev.workouts].sort((a, b) => b.startedAt - a.startedAt) }));
    setTab('history');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <View style={styles.body}>
        {tab === 'overview' && <OverviewScreen {...screenProps} />}
        {tab === 'history' && <HistoryScreen {...screenProps} />}
        {tab === 'workout' && <WorkoutScreen {...screenProps} />}
      </View>

      {showArrive && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>You're at the gym. Start {next ? next.name : 'a workout'}?</Text>
          <View style={styles.bannerBtns}>
            <Pressable hitSlop={8} onPress={() => setDismissed((d) => ({ ...d, arrive: true }))}>
              <Text style={[styles.bannerBtn, { color: colors.muted }]}>NOT NOW</Text>
            </Pressable>
            <Pressable hitSlop={8} onPress={startNext}>
              <Text style={styles.bannerBtn}>START</Text>
            </Pressable>
          </View>
        </View>
      )}

      {showLeave && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>You've left the gym, but {state.active.name} is still running.</Text>
          <View style={styles.bannerBtns}>
            <Pressable hitSlop={8} onPress={() => setDismissed((d) => ({ ...d, leave: state.active.id }))}>
              <Text style={[styles.bannerBtn, { color: colors.muted }]}>KEEP</Text>
            </Pressable>
            <Pressable
              hitSlop={8}
              onPress={() => confirm('Cancel workout', 'All entered sets will be lost.', () => update(() => ({ active: null })), 'Cancel workout')}
            >
              <Text style={[styles.bannerBtn, { color: colors.danger }]}>CANCEL</Text>
            </Pressable>
            <Pressable hitSlop={8} onPress={finishFromBanner}>
              <Text style={styles.bannerBtn}>FINISH</Text>
            </Pressable>
          </View>
        </View>
      )}

      {state.active && !workoutOpen && (
        <Pressable style={styles.miniBar} onPress={() => setWorkoutOpen(true)}>
          <Text style={styles.miniTitle} numberOfLines={1}>{state.active.name}</Text>
          <Elapsed since={state.active.startedAt} style={styles.miniTime} />
        </Pressable>
      )}

      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <Pressable key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
            <Text style={[styles.tabIcon, tab === t.key && styles.tabActive]}>{t.icon}</Text>
            <Text style={[styles.tabLabel, tab === t.key && styles.tabActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {state.active && workoutOpen && (
        <View style={StyleSheet.absoluteFill}>
          <ActiveWorkout
            {...screenProps}
            close={() => setWorkoutOpen(false)}
            onFinished={() => {
              setWorkoutOpen(false);
              setTab('history');
            }}
          />
        </View>
      )}

      {editingTemplate && (
        <View style={StyleSheet.absoluteFill}>
          <TemplateEditor {...screenProps} template={editingTemplate} close={() => setEditingTemplate(null)} />
        </View>
      )}

      {settingsOpen && (
        <View style={StyleSheet.absoluteFill}>
          <SettingsScreen {...screenProps} presence={presence} close={() => setSettingsOpen(false)} />
        </View>
      )}

      {dialog && (
        <View style={[StyleSheet.absoluteFill, styles.backdrop]}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{dialog.title}</Text>
            {!!dialog.message && <Text style={styles.dialogMsg}>{dialog.message}</Text>}
            <View style={styles.dialogBtns}>
              <Pressable hitSlop={8} onPress={() => setDialog(null)}>
                <Text style={[styles.dialogBtn, { color: colors.muted }]}>CANCEL</Text>
              </Pressable>
              <Pressable
                hitSlop={8}
                onPress={() => {
                  setDialog(null);
                  dialog.onYes();
                }}
              >
                <Text style={styles.dialogBtn}>{dialog.yesLabel.toUpperCase()}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const topInset = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : Platform.OS === 'ios' ? 50 : 0;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingTop: topInset },
  body: { flex: 1 },
  miniBar: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  miniTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  miniTime: { color: colors.muted, fontSize: 13, marginTop: 2 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center' },
  tabIcon: { color: colors.muted, fontSize: 20, lineHeight: 24 },
  tabLabel: { color: colors.muted, fontSize: 12, marginTop: 2 },
  tabActive: { color: colors.text, fontWeight: '700' },
  banner: { backgroundColor: colors.card, marginHorizontal: 12, marginBottom: 8, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border },
  bannerText: { color: colors.text, fontSize: 15 },
  bannerBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 24, marginTop: 12 },
  bannerBtn: { color: colors.accent, fontWeight: '700', letterSpacing: 1, fontSize: 13 },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 32 },
  dialog: { backgroundColor: colors.card, borderRadius: 12, padding: 20 },
  dialogTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  dialogMsg: { color: colors.muted, fontSize: 15, marginTop: 8 },
  dialogBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 28, marginTop: 22 },
  dialogBtn: { color: colors.accent, fontWeight: '700', letterSpacing: 1, fontSize: 14 },
});
