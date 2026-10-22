import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { colors, s } from '../theme';
import { bestSet, confirm, fmtSet, formatDuration, num } from '../store';

export default function HistoryScreen({ state, update }) {
  const [open, setOpen] = useState(null);

  const groups = [];
  for (const w of state.workouts) {
    const d = new Date(w.startedAt);
    const label = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    if (!groups.length || groups[groups.length - 1].label !== label) groups.push({ label, items: [] });
    groups[groups.length - 1].items.push(w);
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Text style={s.title}>History</Text>
      {!groups.length && <Text style={s.muted}>No workouts yet. Finish one and it will show up here.</Text>}

      {groups.map((g) => (
        <View key={g.label} style={{ marginBottom: 12 }}>
          <View style={[s.row, { justifyContent: 'space-between', marginBottom: 10 }]}>
            <Text style={s.h2}>{g.label}</Text>
            <Text style={s.muted}>{g.items.length} workout{g.items.length === 1 ? '' : 's'}</Text>
          </View>
          {g.items.map((w) => (
            <WorkoutCard
              key={w.id}
              w={w}
              expanded={open === w.id}
              toggle={() => setOpen(open === w.id ? null : w.id)}
              onDelete={() =>
                confirm('Delete workout', `Delete "${w.name}"?`, () =>
                  update((prev) => ({ workouts: prev.workouts.filter((x) => x.id !== w.id) })), 'Delete')
              }
            />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function WorkoutCard({ w, expanded, toggle, onDelete }) {
  const date = new Date(w.startedAt);
  const volume = w.exercises.reduce(
    (sum, e) => sum + e.sets.reduce((a, st) => a + Math.max(0, num(st.weight) ?? 0) * (num(st.reps) ?? 0), 0),
    0
  );

  return (
    <Pressable style={s.card} onPress={toggle}>
      <Text style={[s.text, { fontSize: 17, fontWeight: '700' }]}>{w.name}</Text>
      <Text style={[s.muted, { marginTop: 2 }]}>
        {date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })} at{' '}
        {date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
      </Text>

      <View style={[s.row, { marginTop: 12, marginBottom: 4 }]}>
        <Text style={[s.text, { flex: 1, fontWeight: '600' }]}>Sets</Text>
        <Text style={[s.text, { width: 110, fontWeight: '600' }]}>Best set</Text>
      </View>
      {w.exercises.map((e) => (
        <View key={e.id || e.name}>
          <View style={s.row}>
            <Text style={[s.muted, { flex: 1 }]} numberOfLines={1}>
              {e.sets.length} × {e.name}
            </Text>
            <Text style={[s.muted, { width: 110 }]}>{fmtSet(bestSet(e.sets))}</Text>
          </View>
          {expanded && (
            <Text style={[s.muted, { fontSize: 12, marginLeft: 12, marginBottom: 4, color: '#7d868e' }]}>
              {e.sets.map(fmtSet).join('  ·  ')}
            </Text>
          )}
        </View>
      ))}

      <View style={[s.row, { marginTop: 12, gap: 20 }]}>
        <Text style={s.muted}>◷ {formatDuration((w.endedAt || w.startedAt) - w.startedAt)}</Text>
        <Text style={s.muted}>⚖ {Math.round(volume)} kg</Text>
      </View>

      {expanded && (
        <Pressable style={{ marginTop: 12, alignSelf: 'flex-end' }} onPress={onDelete} hitSlop={8}>
          <Text style={[s.link, { color: colors.danger, fontSize: 12 }]}>DELETE</Text>
        </Pressable>
      )}
    </Pressable>
  );
}
