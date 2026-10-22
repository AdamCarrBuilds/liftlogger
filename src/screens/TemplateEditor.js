import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, s } from '../theme';
import { confirm, uid } from '../store';

export default function TemplateEditor({ update, template, close }) {
  const [name, setName] = useState(template.name);
  const [exercises, setExercises] = useState(template.exercises.map((e) => ({ ...e, key: uid() })));

  const patch = (key, p) => setExercises((xs) => xs.map((x) => (x.key === key ? { ...x, ...p } : x)));
  const move = (i, d) =>
    setExercises((xs) => {
      const j = i + d;
      if (j < 0 || j >= xs.length) return xs;
      const copy = [...xs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const save = () => {
    const t = {
      id: template.id || uid(),
      name: name.trim() || 'New template',
      exercises: exercises
        .filter((e) => e.name.trim())
        .map(({ name: n, sets, reps }) => ({ name: n.trim(), sets: Math.max(1, sets), reps: reps.trim() })),
    };
    update((prev) => ({
      templates: template.id ? prev.templates.map((x) => (x.id === t.id ? t : x)) : [...prev.templates, t],
    }));
    close();
  };

  const remove = () =>
    confirm('Delete template', `Delete "${template.name}"?`, () => {
      update((prev) => ({ templates: prev.templates.filter((x) => x.id !== template.id) }));
      close();
    }, 'Delete');

  return (
    <View style={s.screen}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={close}>
          <Text style={[s.link, { color: colors.muted }]}>CANCEL</Text>
        </Pressable>
        <Text style={[s.text, { fontWeight: '700' }]}>{template.id ? 'Edit template' : 'New template'}</Text>
        <Pressable hitSlop={12} onPress={save}>
          <Text style={s.link}>SAVE</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Template name"
          placeholderTextColor={colors.muted}
          style={styles.name}
          autoFocus={!template.id}
        />

        <View style={[s.row, { marginTop: 16, marginBottom: 4 }]}>
          <Text style={[styles.th, { flex: 1, textAlign: 'left' }]}>EXERCISE</Text>
          <Text style={[styles.th, { width: 96 }]}>SETS</Text>
          <Text style={[styles.th, { width: 64 }]}>REPS</Text>
          <View style={{ width: 52 }} />
        </View>

        {exercises.map((e, i) => (
          <View key={e.key} style={[s.row, { marginBottom: 8 }]}>
            <TextInput
              value={e.name}
              onChangeText={(n) => patch(e.key, { name: n })}
              placeholder="Exercise name"
              placeholderTextColor={colors.muted}
              style={[s.input, { flex: 1, minWidth: 0 }]}
            />
            <View style={[s.row, { width: 96, justifyContent: 'center' }]}>
              <Step label="−" onPress={() => patch(e.key, { sets: Math.max(1, e.sets - 1) })} />
              <Text style={[s.text, { width: 24, textAlign: 'center' }]}>{e.sets}</Text>
              <Step label="+" onPress={() => patch(e.key, { sets: e.sets + 1 })} />
            </View>
            <TextInput
              value={e.reps}
              onChangeText={(r) => patch(e.key, { reps: r })}
              placeholder="8-12"
              placeholderTextColor="#6f7880"
              style={[s.input, { width: 64, textAlign: 'center', paddingHorizontal: 4 }]}
            />
            <View style={{ width: 52, flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Pressable hitSlop={6} onPress={() => move(i, -1)}>
                <Text style={styles.icon}>↑</Text>
              </Pressable>
              <Pressable hitSlop={6} onPress={() => setExercises((xs) => xs.filter((x) => x.key !== e.key))}>
                <Text style={styles.icon}>✕</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <Pressable
          style={{ alignItems: 'center', paddingVertical: 14 }}
          onPress={() => setExercises((xs) => [...xs, { key: uid(), name: '', sets: 3, reps: '' }])}
        >
          <Text style={s.link}>ADD EXERCISE</Text>
        </Pressable>

        {template.id && (
          <Pressable style={{ alignItems: 'center', marginTop: 24 }} onPress={remove}>
            <Text style={[s.link, { color: colors.danger }]}>DELETE TEMPLATE</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const Step = ({ label, onPress }) => (
  <Pressable onPress={onPress} hitSlop={4} style={styles.step}>
    <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  name: { color: colors.text, fontSize: 24, fontWeight: '700', paddingVertical: 4 },
  th: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textAlign: 'center' },
  step: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.input, alignItems: 'center', justifyContent: 'center' },
  icon: { color: colors.muted, fontSize: 16, paddingHorizontal: 5 },
});
