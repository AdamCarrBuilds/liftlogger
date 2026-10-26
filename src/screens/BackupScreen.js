import { useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, s } from '../theme';
import { confirm } from '../store';

export function buildBackup(state) {
  return {
    app: 'liftlogger',
    version: 1,
    exportedAt: new Date().toISOString(),
    templates: state.templates,
    workouts: state.workouts,
  };
}

// Returns { templates, workouts } or throws with a message the user can act on.
export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That isn’t valid JSON. Use a file made with Export.');
  }
  const templates = Array.isArray(data?.templates) ? data.templates : null;
  const workouts = Array.isArray(data?.workouts) ? data.workouts : null;
  if (!templates || !workouts) throw new Error('No templates or workouts found. Use a file made with Export.');
  const okTemplate = (t) => t && t.id && typeof t.name === 'string' && Array.isArray(t.exercises);
  const okWorkout = (w) => w && w.id && Number.isFinite(w.startedAt) && Array.isArray(w.exercises);
  if (!templates.every(okTemplate) || !workouts.every(okWorkout)) {
    throw new Error('Some entries are damaged, so nothing was imported.');
  }
  return { templates, workouts };
}

// Imported entries win over existing ones with the same id; nothing else is removed.
export function mergeBackup(prev, { templates, workouts }) {
  const byId = (list, incoming) => {
    const map = new Map(list.map((x) => [x.id, x]));
    incoming.forEach((x) => map.set(x.id, x));
    return [...map.values()];
  };
  return {
    templates: byId(prev.templates, templates),
    workouts: byId(prev.workouts, workouts).sort((a, b) => b.startedAt - a.startedAt),
  };
}

const count = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const summary = (d) => `${count(d.templates.length, 'template')} and ${count(d.workouts.length, 'workout')}`;

const fileName = () => `liftlogger-backup-${new Date().toISOString().slice(0, 10)}.json`;

function downloadFile(text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName();
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function pickFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      file.text().then(resolve, () => resolve(null));
    };
    input.click();
  });
}

export default function BackupScreen({ state, update, close }) {
  const [paste, setPaste] = useState('');
  const [status, setStatus] = useState(null);
  const web = Platform.OS === 'web';

  const exportData = () => {
    const text = JSON.stringify(buildBackup(state), null, 2);
    if (web) downloadFile(text);
    else Share.share({ title: fileName(), message: text });
    setStatus({ ok: true, text: `Exported ${summary(state)}.` });
  };

  const importText = (text) => {
    if (!text) return;
    let data;
    try {
      data = parseBackup(text);
    } catch (e) {
      setStatus({ ok: false, text: e.message });
      return;
    }
    confirm(
      'Import backup',
      `Add ${summary(data)}? Entries already here with the same ID are replaced; nothing else is deleted.`,
      () => {
        update((prev) => mergeBackup(prev, data));
        setPaste('');
        setStatus({ ok: true, text: `Imported ${summary(data)}.` });
      },
      'Import'
    );
  };

  return (
    <View style={s.screen}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={close}>
          <Text style={[s.link, { color: colors.muted }]}>DONE</Text>
        </Pressable>
        <Text style={[s.text, { fontWeight: '700' }]}>Backup</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.muted}>
          Your data lives only on this device. Export a JSON file of all templates and workout history to keep a copy or move
          it to another phone.
        </Text>

        <Pressable style={[s.btn, { marginTop: 20 }]} onPress={exportData}>
          <Text style={s.btnText}>EXPORT JSON</Text>
        </Pressable>

        {web ? (
          <Pressable style={[styles.outline, { marginTop: 12 }]} onPress={() => pickFile().then(importText)}>
            <Text style={s.link}>IMPORT JSON FILE</Text>
          </Pressable>
        ) : (
          <View style={{ marginTop: 20 }}>
            <TextInput
              value={paste}
              onChangeText={setPaste}
              placeholder="Paste exported JSON here"
              placeholderTextColor={colors.muted}
              multiline
              style={[s.input, { minHeight: 120, textAlignVertical: 'top', fontSize: 13 }]}
            />
            <Pressable style={[styles.outline, { marginTop: 12 }]} onPress={() => importText(paste)}>
              <Text style={s.link}>IMPORT</Text>
            </Pressable>
          </View>
        )}

        {status && (
          <Text style={[s.muted, { marginTop: 16, color: status.ok ? colors.green : colors.danger }]}>{status.text}</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  outline: { borderWidth: 1, borderColor: colors.accent, borderRadius: 6, paddingVertical: 12, alignItems: 'center' },
});
