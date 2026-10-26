import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SEED_VERSION, seedTemplates, v1SeedTemplates } from './seed';

const KEY = 'liftlogger:v1';

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const initial = { templates: seedTemplates, workouts: [], active: null, seedVersion: SEED_VERSION };

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
