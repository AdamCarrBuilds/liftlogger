import { Pressable, ScrollView, Text, View } from 'react-native';
import { colors, s } from '../theme';
import { confirm, uid } from '../store';

export function workoutFromTemplate(template) {
  return {
    id: uid(),
    name: template ? template.name : 'Workout',
    templateId: template ? template.id : null,
    startedAt: Date.now(),
    exercises: template
      ? template.exercises.map((ex) => ({
          id: uid(),
          name: ex.name,
          target: ex.reps || '',
          sets: Array.from({ length: Math.max(1, ex.sets) }, () => ({ weight: '', reps: '', done: false })),
        }))
      : [],
  };
}

export default function WorkoutScreen({ state, update, openWorkout, editTemplate }) {
  const start = (template) => {
    const go = () => {
      update(() => ({ active: workoutFromTemplate(template) }));
      openWorkout();
    };
    if (state.active) {
      confirm('Workout in progress', `Discard "${state.active.name}" and start a new one?`, go, 'Discard');
    } else go();
  };

  const lastDone = (t) => {
    const w = state.workouts.find((w) => w.templateId === t.id);
    return w ? new Date(w.startedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Text style={s.title}>Workout</Text>

      <Text style={[s.h2, { marginBottom: 12 }]}>Quick start</Text>
      <Pressable style={s.btn} onPress={() => (state.active ? openWorkout() : start(null))}>
        <Text style={s.btnText}>{state.active ? 'RESUME WORKOUT' : 'START AN EMPTY WORKOUT'}</Text>
      </Pressable>

      <View style={[s.row, { marginTop: 28, marginBottom: 12, justifyContent: 'space-between' }]}>
        <Text style={s.h2}>My Templates ({state.templates.length})</Text>
        <Pressable hitSlop={12} onPress={() => editTemplate({ id: null, name: '', exercises: [] })}>
          <Text style={{ color: colors.text, fontSize: 28, lineHeight: 30 }}>+</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {state.templates.map((t) => (
          <Pressable key={t.id} style={[s.card, { width: '48.5%' }]} onPress={() => start(t)}>
            <View style={[s.row, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
              <Text style={[s.text, { fontWeight: '700', fontSize: 16, flex: 1 }]}>{t.name}</Text>
              <Pressable hitSlop={12} onPress={() => editTemplate(t)}>
                <Text style={{ color: colors.accent, fontSize: 18, fontWeight: '900' }}>•••</Text>
              </Pressable>
            </View>
            <Text style={[s.muted, { marginTop: 8 }]} numberOfLines={3}>
              {t.exercises.map((e) => `${e.sets} × ${e.name}`).join(', ') || 'No exercises'}
            </Text>
            <Text style={[s.muted, { marginTop: 8, fontSize: 12 }]}>◷ {lastDone(t)}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[s.muted, { fontSize: 12, marginTop: 4 }]}>Tap a template to start it · ••• to edit</Text>
    </ScrollView>
  );
}
