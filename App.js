import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { colors } from './src/theme';
import { useStore } from './src/store';
import Elapsed from './src/Elapsed';
import OverviewScreen from './src/screens/OverviewScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import WorkoutScreen from './src/screens/WorkoutScreen';
import ActiveWorkout from './src/screens/ActiveWorkout';
import TemplateEditor from './src/screens/TemplateEditor';

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
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <View style={styles.body}>
        {tab === 'overview' && <OverviewScreen {...screenProps} />}
        {tab === 'history' && <HistoryScreen {...screenProps} />}
        {tab === 'workout' && <WorkoutScreen {...screenProps} />}
      </View>

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
});
