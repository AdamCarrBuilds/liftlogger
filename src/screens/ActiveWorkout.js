import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, numberKeyboard, s } from '../theme';
import { confirm, fmtSet, num, previousSets, uid } from '../store';
import Elapsed from '../Elapsed';

export default function ActiveWorkout({ state, update, close, onFinished }) {
  const w = state.active;
  const [newName, setNewName] = useState('');

  const setActive = (fn) => update((prev) => ({ active: prev.active && { ...prev.active, ...fn(prev.active) } }));
  const setExercise = (exId, fn) =>
    setActive((a) => ({ exercises: a.exercises.map((e) => (e.id === exId ? { ...e, ...fn(e) } : e)) }));
  const setSet = (exId, i, patch) =>
    setExercise(exId, (e) => ({ sets: e.sets.map((st, j) => (j === i ? { ...st, ...patch } : st)) }));

  const knownNames = useMemo(() => {
    const names = new Map();
    state.templates.forEach((t) => t.exercises.forEach((e) => names.set(e.name.toLowerCase(), e.name)));
    state.workouts.forEach((wk) => wk.exercises.forEach((e) => names.set(e.name.toLowerCase(), e.name)));
    return [...names.values()].sort();
  }, [state.templates, state.workouts]);

  const q = newName.trim().toLowerCase();
  const suggestions = q ? knownNames.filter((n) => n.toLowerCase().includes(q) && n.toLowerCase() !== q).slice(0, 5) : [];

  const addExercise = (name) => {
    if (!name.trim()) return;
    const prev = previousSets(state.workouts, name);
    const count = Math.max(prev.length, 3);
    setActive((a) => ({
      exercises: [
        ...a.exercises,
        { id: uid(), name: name.trim(), target: '', sets: Array.from({ length: count }, () => ({ weight: '', reps: '', done: false })) },
      ],
    }));
    setNewName('');
  };

  const finish = () => {
    const exercises = w.exercises
      .map(({ id, name, sets }) => ({ id, name, sets: sets.filter((st) => st.done).map(({ weight, reps }) => ({ weight, reps })) }))
      .filter((e) => e.sets.length);
    if (!exercises.length) {
      confirm('No completed sets', 'Tick off at least one set, or discard this workout?', discardNow, 'Discard');
      return;
    }
    const done = { id: w.id, name: w.name.trim() || 'Workout', templateId: w.templateId, startedAt: w.startedAt, endedAt: Date.now(), exercises };
    update((prev) => ({ active: null, workouts: [done, ...prev.workouts].sort((a, b) => b.startedAt - a.startedAt) }));
    onFinished();
  };

  const discardNow = () => {
    update(() => ({ active: null }));
    close();
  };

  const saveAsTemplate = () => {
    const t = {
      id: uid(),
      name: w.name.trim() || 'New template',
      exercises: w.exercises.map((e) => ({ name: e.name, sets: e.sets.length, reps: e.target || '' })),
    };
    update((prev) => ({ templates: [...prev.templates, t] }));
    confirm('Template saved', `"${t.name}" added to My Templates.`, () => {});
  };

  return (
    <View style={s.screen}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={close} style={styles.headerBtn}>
          <Text style={{ color: colors.text, fontSize: 22 }}>⌄</Text>
        </Pressable>
        <Elapsed since={w.startedAt} style={{ color: colors.muted, fontSize: 16 }} />
        <Pressable hitSlop={12} onPress={finish} style={styles.headerBtn}>
          <Text style={[s.link, { fontSize: 16 }]}>FINISH</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <TextInput
          value={w.name}
          onChangeText={(name) => setActive(() => ({ name }))}
          style={styles.workoutName}
          placeholder="Workout name"
          placeholderTextColor={colors.muted}
        />

        {w.exercises.map((ex) => (
          <ExerciseBlock
            key={ex.id}
            ex={ex}
            prev={previousSets(state.workouts, ex.name)}
            onRename={(name) => setExercise(ex.id, () => ({ name }))}
            onRemove={() =>
              confirm('Remove exercise', `Remove ${ex.name}?`, () =>
                setActive((a) => ({ exercises: a.exercises.filter((e) => e.id !== ex.id) })), 'Remove')
            }
            onSet={(i, patch) => setSet(ex.id, i, patch)}
            onAddSet={() => setExercise(ex.id, (e) => ({ sets: [...e.sets, { weight: '', reps: '', done: false }] }))}
            onRemoveSet={(i) => setExercise(ex.id, (e) => ({ sets: e.sets.filter((_, j) => j !== i) }))}
          />
        ))}

        <View style={{ marginTop: 20 }}>
          <View style={s.row}>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              onSubmitEditing={() => addExercise(newName)}
              placeholder="Add exercise (any name)"
              placeholderTextColor={colors.muted}
              style={[s.input, { flex: 1, minWidth: 0 }]}
              returnKeyType="done"
            />
            <Pressable style={[s.btn, { marginLeft: 8, paddingHorizontal: 16 }]} onPress={() => addExercise(newName)}>
              <Text style={s.btnText}>ADD</Text>
            </Pressable>
          </View>
          {suggestions.map((n) => (
            <Pressable key={n} onPress={() => addExercise(n)} style={styles.suggestion}>
              <Text style={s.text}>{n}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={{ marginTop: 32, alignItems: 'center' }} onPress={saveAsTemplate}>
          <Text style={s.link}>SAVE AS TEMPLATE</Text>
        </Pressable>
        <Pressable
          style={{ marginTop: 24, alignItems: 'center' }}
          onPress={() => confirm('Discard workout', 'All entered sets will be lost.', discardNow, 'Discard')}
        >
          <Text style={[s.link, { color: colors.danger }]}>CANCEL WORKOUT</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function ExerciseBlock({ ex, prev, onRename, onRemove, onSet, onAddSet, onRemoveSet }) {
  return (
    <View style={{ marginTop: 20 }}>
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <TextInput value={ex.name} onChangeText={onRename} style={styles.exName} />
        <Pressable hitSlop={12} onPress={onRemove}>
          <Text style={{ color: colors.muted, fontSize: 18, paddingHorizontal: 6 }}>✕</Text>
        </Pressable>
      </View>
      {!!ex.target && <Text style={[s.muted, { fontSize: 12, marginBottom: 4 }]}>Target {ex.target} reps</Text>}

      <View style={[s.row, styles.tableHead]}>
        <Text style={[styles.th, styles.colSet]}>SET</Text>
        <Text style={[styles.th, styles.colPrev]}>PREVIOUS</Text>
        <Text style={[styles.th, styles.colNum]}>KG</Text>
        <Text style={[styles.th, styles.colNum]}>REPS</Text>
        <Text style={[styles.th, styles.colCheck]}>✓</Text>
      </View>

      {ex.sets.map((st, i) => {
        const p = prev[i];
        const wPh = p ? String(p.weight ?? '') : '';
        const rPh = p ? String(p.reps ?? '') : (ex.target || '').split('-')[0] || '';
        const toggle = () => {
          // Ticking an empty set accepts the greyed-out suggestion (previous session / target).
          const patch = { done: !st.done };
          if (!st.done) {
            if (st.weight === '' && wPh !== '') patch.weight = wPh;
            if (st.reps === '' && rPh !== '') patch.reps = rPh;
          }
          onSet(i, patch);
        };
        return (
          <View key={i} style={[s.row, styles.setRow, st.done && { backgroundColor: colors.doneRow }]}>
            <Pressable
              style={styles.colSet}
              onLongPress={() => onRemoveSet(i)}
              onPress={() => confirm('Delete set', `Delete set ${i + 1}?`, () => onRemoveSet(i), 'Delete')}
            >
              <Text style={[s.text, { textAlign: 'center', fontWeight: '700' }]}>{i + 1}</Text>
            </Pressable>
            <Text style={[s.muted, styles.colPrev, { textAlign: 'center' }]} numberOfLines={1}>
              {p ? fmtSet(p) : '—'}
            </Text>
            <NumInput value={st.weight} placeholder={wPh} onChange={(weight) => onSet(i, { weight })} done={st.done} />
            <NumInput value={st.reps} placeholder={rPh} onChange={(reps) => onSet(i, { reps })} done={st.done} />
            <Pressable style={[styles.colCheck, styles.check, st.done && styles.checkDone]} onPress={toggle}>
              <Text style={{ color: st.done ? '#fff' : colors.muted, fontSize: 18, fontWeight: '700' }}>✓</Text>
            </Pressable>
          </View>
        );
      })}

      <Pressable style={{ alignItems: 'center', paddingVertical: 12 }} onPress={onAddSet}>
        <Text style={s.link}>ADD SET</Text>
      </Pressable>
    </View>
  );
}

function NumInput({ value, placeholder, onChange, done }) {
  // Accept anything number-like while typing, including a leading minus (assisted / counterweight lifts).
  const clean = (t) => t.replace(',', '.').replace(/[^0-9.\-]/g, '').replace(/(?!^)-/g, '');
  const invalid = value !== '' && value !== '-' && num(value) === null;
  return (
    <TextInput
      value={String(value)}
      onChangeText={(t) => onChange(clean(t))}
      placeholder={placeholder}
      placeholderTextColor="#6f7880"
      keyboardType={numberKeyboard}
      selectTextOnFocus
      style={[
        s.input,
        styles.colNum,
        { textAlign: 'center', marginHorizontal: 4, paddingHorizontal: 4 },
        done && { backgroundColor: 'transparent' },
        invalid && { color: colors.danger },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerBtn: { padding: 6, minWidth: 60 },
  workoutName: { color: colors.text, fontSize: 24, fontWeight: '700', paddingVertical: 4 },
  exName: { color: colors.accent, fontSize: 18, fontWeight: '600', flex: 1, minWidth: 0, paddingVertical: 4 },
  tableHead: { paddingVertical: 6 },
  th: { color: colors.text, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textAlign: 'center' },
  setRow: { paddingVertical: 5, marginHorizontal: -16, paddingHorizontal: 16 },
  colSet: { width: 34 },
  colPrev: { flex: 1.3, minWidth: 0 },
  colNum: { flex: 1, minWidth: 0, width: 0 },
  colCheck: { width: 40, marginLeft: 4 },
  check: { height: 36, borderRadius: 6, backgroundColor: colors.input, alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: colors.green },
  suggestion: { paddingVertical: 10, paddingHorizontal: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
});
