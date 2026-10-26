import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { colors, s } from '../theme';
import { defaultSettings, rotationIds } from '../store';
import { currentPosition } from '../gym';
import BackupSection from './BackupSection';

const RADII = [75, 150, 300];

export default function SettingsScreen({ state, update, presence, close }) {
  const settings = { ...defaultSettings, ...state.settings };
  const gym = { ...defaultSettings.gym, ...settings.gym };
  const setSettings = (patch) => update((prev) => ({ settings: { ...defaultSettings, ...prev.settings, ...patch } }));
  const setGym = (patch) => setSettings({ gym: { ...gym, ...patch } });

  const order = rotationIds(state);
  const outside = state.templates.filter((t) => !order.includes(t.id));
  const byId = Object.fromEntries(state.templates.map((t) => [t.id, t]));
  const move = (i, d) => {
    const next = [...order];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setSettings({ rotation: next });
  };

  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(null);
  const useHere = async () => {
    setLocating(true);
    setLocError(null);
    try {
      const pos = await currentPosition();
      setGym({ lat: pos.lat, lng: pos.lng, accuracy: Math.round(pos.accuracy), enabled: true });
    } catch (e) {
      setLocError(e.message);
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={s.screen}>
      <View style={styles.header}>
        <View style={{ width: 44 }} />
        <Text style={[s.text, { fontWeight: '700' }]}>Settings</Text>
        <Pressable hitSlop={12} onPress={close}>
          <Text style={s.link}>DONE</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Text style={styles.section}>TEMPLATE ROTATION</Text>
        <Text style={s.muted}>The next template in this order gets a highlighted border on the Workout tab.</Text>
        <View style={[s.card, { marginTop: 12, paddingVertical: 4 }]}>
          {order.map((id, i) => (
            <View key={id} style={styles.rotRow}>
              <Text style={[s.muted, { width: 22 }]}>{i + 1}</Text>
              <Text style={[s.text, { flex: 1 }]} numberOfLines={1}>{byId[id].name}</Text>
              <Arrow label="↑" disabled={i === 0} onPress={() => move(i, -1)} />
              <Arrow label="↓" disabled={i === order.length - 1} onPress={() => move(i, 1)} />
              <Arrow label="✕" onPress={() => setSettings({ rotation: order.filter((x) => x !== id) })} />
            </View>
          ))}
          {!order.length && <Text style={[s.muted, { paddingVertical: 10 }]}>No templates in the rotation.</Text>}
        </View>
        {outside.map((t) => (
          <Pressable key={t.id} style={styles.addRow} onPress={() => setSettings({ rotation: [...order, t.id] })}>
            <Text style={s.link}>+ </Text>
            <Text style={s.muted}>{t.name}</Text>
          </Pressable>
        ))}

        <Text style={[styles.section, { marginTop: 28 }]}>GYM LOCATION</Text>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <Text style={[s.text, { flex: 1 }]}>Detect when I'm at the gym</Text>
          <Switch
            value={gym.enabled && gym.lat != null}
            disabled={gym.lat == null}
            onValueChange={(enabled) => setGym({ enabled })}
            trackColor={{ true: colors.accent }}
          />
        </View>
        <Text style={[s.muted, { marginTop: 6 }]}>
          While the app is open, it offers to start your next workout when you arrive, and to finish or cancel one you leave
          running.
        </Text>

        <Pressable style={[styles.outline, { marginTop: 14 }]} onPress={useHere} disabled={locating}>
          <Text style={s.link}>{locating ? 'FINDING YOU…' : gym.lat == null ? 'SET GYM TO MY CURRENT LOCATION' : 'UPDATE TO MY CURRENT LOCATION'}</Text>
        </Pressable>
        {locError && <Text style={[s.muted, { color: colors.danger, marginTop: 8 }]}>{locError}</Text>}
        {gym.lat != null && (
          <Text style={[s.muted, { marginTop: 8, fontSize: 12 }]}>
            Saved {gym.lat.toFixed(5)}, {gym.lng.toFixed(5)}
            {gym.accuracy ? ` (±${gym.accuracy} m)` : ''}
            {presence?.distance != null ? ` · you're ${presence.distance} m away now` : ''}
          </Text>
        )}

        <Text style={[s.muted, { marginTop: 14, marginBottom: 6 }]}>Counts as "at the gym" within</Text>
        <View style={[s.row, { gap: 8 }]}>
          {RADII.map((r) => (
            <Pressable key={r} onPress={() => setGym({ radius: r })} style={[styles.chip, gym.radius === r && styles.chipOn]}>
              <Text style={{ color: gym.radius === r ? '#fff' : colors.muted, fontWeight: '600' }}>{r} m</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.section, { marginTop: 28 }]}>BACKUP</Text>
        <BackupSection state={state} update={update} />
      </ScrollView>
    </View>
  );
}

const Arrow = ({ label, onPress, disabled }) => (
  <Pressable hitSlop={6} onPress={onPress} disabled={disabled} style={{ paddingHorizontal: 8, opacity: disabled ? 0.25 : 1 }}>
    <Text style={{ color: colors.muted, fontSize: 16 }}>{label}</Text>
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
  section: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  rotRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  addRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  outline: { borderWidth: 1, borderColor: colors.accent, borderRadius: 6, paddingVertical: 12, alignItems: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.input },
  chipOn: { backgroundColor: colors.accent },
});
