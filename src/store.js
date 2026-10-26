import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SEED_VERSION, seedTemplates, v1SeedTemplates } from './seed';

const KEY = 'liftlogger:v1';

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const defaultSettings = {
  rotation: seedTemplates.map((t) => t.id),
  gym: { enabled: false, lat: null, lng: null, radius: 150 },
};

const initial = { templates: seedTemplates, workouts: [], active: null, seedVersion: SEED_VERSION, settings: defaultSettings };

const sameExercises = (a, b) =>
  a.length === b.length && a.every((e, i) => e.name === b[i][0] && e.sets === b[i][1] && e.reps === b[i][2]);

// Swap the old starter templates for the current plan, but keep any the user has edited.
function migrate(saved) {
  if ((saved.seedVersion || 1) >= SEED_VERSION) return saved;
  const kept = (saved.templates || []).filter((t) => {
    const v1 = v1SeedTemplates[t.id];
    return !(v1 && sameExercises(t.exercises, v1));
  });
  const ids = new Set(kept.map((t) => t.id));
  return { ...saved, templates: [...seedTemplates.filter((t) => !ids.has(t.id)), ...kept], seedVersion: SEED_VERSION };
}

// Whole app state lives in one JSON blob — small enough for a personal log.
export function useStore() {
  const [state, setState] = useState(null);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => setState(raw ? migrate({ ...initial, seedVersion: 1, ...JSON.parse(raw) }) : initial))
      .catch(() => setState(initial))
      .finally(() => (loaded.current = true));
  }, []);

  useEffect(() => {
    if (loaded.current && state) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const update = useCallback((fn) => setState((prev) => ({ ...prev, ...fn(prev) })), []);
  return [state, update];
}

// Native uses Alert; web (where Alert is a no-op and window.confirm may be blocked) uses the in-app dialog in App.js.
let confirmHandler = null;
export const setConfirmHandler = (fn) => (confirmHandler = fn);

export function confirm(title, message, onYes, yesLabel = 'OK') {
  if (Platform.OS === 'web') {
    confirmHandler?.({ title, message, onYes, yesLabel });
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: yesLabel, style: 'destructive', onPress: onYes },
  ]);
}

// Template ids in rotation order, skipping any that were deleted.
export function rotationIds(state) {
  const ids = new Set(state.templates.map((t) => t.id));
  return (state.settings?.rotation || []).filter((id) => ids.has(id));
}

// The template after the most recent workout done from the rotation; the first one if none yet.
export function nextTemplateId(state) {
  const order = rotationIds(state);
  if (!order.length) return null;
  const last = state.workouts.find((w) => order.includes(w.templateId));
  return last ? order[(order.indexOf(last.templateId) + 1) % order.length] : order[0];
}

// A finished workout keeps only ticked sets; null when nothing was ticked.
export function finishedWorkout(active) {
  const exercises = active.exercises
    .map(({ id, name, sets }) => ({ id, name, sets: sets.filter((st) => st.done).map(({ weight, reps }) => ({ weight, reps })) }))
    .filter((e) => e.sets.length);
  if (!exercises.length) return null;
  return { id: active.id, name: active.name.trim() || 'Workout', templateId: active.templateId, startedAt: active.startedAt, endedAt: Date.now(), exercises };
}

export const num = (v) => {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

export function formatDuration(ms, withSeconds = false) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  if (withSeconds) {
    const pad = (n) => String(n).padStart(2, '0');
    return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
  }
  return h ? `${h}h ${m}m` : `${m}m`;
}

export const completedSets = (ex) => ex.sets.filter((st) => st.done);

// Most recent finished set list for an exercise name (case-insensitive), for the "Previous" column.
export function previousSets(workouts, name) {
  const key = name.trim().toLowerCase();
  for (const w of workouts) {
    const ex = w.exercises.find((e) => e.name.trim().toLowerCase() === key);
    if (ex && ex.sets.length) return ex.sets;
  }
  return [];
}

// Heaviest set (most reps on a tie) from the last session that had this exercise: the working weight to suggest.
export function topSet(workouts, name) {
  let top = null;
  for (const st of previousSets(workouts, name)) {
    const w = num(st.weight);
    const r = num(st.reps);
    if (w === null && r === null) continue;
    if (!top || (w ?? 0) > (num(top.weight) ?? 0) || ((w ?? 0) === (num(top.weight) ?? 0) && (r ?? 0) > (num(top.reps) ?? 0))) top = st;
  }
  return top;
}

export function bestSet(sets) {
  let best = null;
  for (const st of sets) {
    const w = num(st.weight);
    const r = num(st.reps) ?? 0;
    if (w === null && !r) continue;
    const score = (w ?? 0) * (1 + r / 30); // Epley e1RM
    if (!best || score > best.score) best = { ...st, score };
  }
  return best;
}

export const fmtSet = (st) => {
  if (!st) return '—';
  const w = num(st.weight);
  const r = num(st.reps);
  if (w === null) return `${r ?? 0} reps`;
  return `${w} kg × ${r ?? 0}`;
};
