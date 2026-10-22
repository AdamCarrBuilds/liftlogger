import { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, s } from '../theme';

const WEEKS = 52;
const CELL = 14;
const GAP = 3;
const DAY = 86400000;

const startOfWeek = (t) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  return d;
};
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export default function OverviewScreen({ state }) {
  const scrollRef = useRef(null);
  const perDay = new Map();
  for (const w of state.workouts) {
    const k = dayKey(new Date(w.startedAt));
    perDay.set(k, (perDay.get(k) || 0) + 1);
  }

  const thisWeek = startOfWeek(Date.now());
  const weeks = Array.from({ length: WEEKS }, (_, i) => {
    const start = new Date(thisWeek);
    start.setDate(start.getDate() - (WEEKS - 1 - i) * 7);
    const days = Array.from({ length: 7 }, (_, d) => {
      const day = new Date(start);
      day.setDate(day.getDate() + d);
      return { date: day, count: perDay.get(dayKey(day)) || 0, future: day.getTime() > Date.now() };
    });
    return { start, days, total: days.reduce((a, d) => a + d.count, 0) };
  });

  let streak = 0;
  for (let i = WEEKS - 1; i >= 0; i--) {
    if (weeks[i].total) streak++;
    else if (i !== WEEKS - 1) break; // an empty current week doesn't break the streak yet
  }
  const last8 = weeks.slice(-9, -1); // the 8 full weeks before this one
  const avg = last8.reduce((a, w) => a + w.total, 0) / last8.length;
  const recent = weeks.slice(-12);
  const maxRecent = Math.max(3, ...recent.map((w) => w.total));

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Text style={s.title}>Overview</Text>

      <View style={[s.row, { gap: 10, marginBottom: 20 }]}>
        <Stat label="This week" value={weeks[WEEKS - 1].total} />
        <Stat label="Streak" value={streak} />
        <Stat label="Avg / week" value={avg.toFixed(1)} />
        <Stat label="Total" value={state.workouts.length} />
      </View>

      <Text style={[s.h2, { marginBottom: 10 }]}>Last 12 months</Text>
      <View style={[s.card, { flexDirection: 'row', paddingHorizontal: 10 }]}>
        <View style={{ marginTop: 16, marginRight: 4 }}>
          {['M', '', 'W', '', 'F', '', 'S'].map((l, i) => (
            <Text key={i} style={styles.dayLabel}>{l}</Text>
          ))}
        </View>
        <ScrollView
          horizontal
          ref={scrollRef}
          showsHorizontalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          <View>
            <View style={{ height: 16 }}>
              {weeks.map((w, i) => {
                const first = i === 0 || w.start.getMonth() !== weeks[i - 1].start.getMonth();
                return (
                  first && (
                    <Text key={i} style={[styles.monthLabel, { left: i * (CELL + GAP) }]}>
                      {w.start.toLocaleDateString(undefined, { month: 'short' })}
                    </Text>
                  )
                );
              })}
            </View>
            <View style={{ flexDirection: 'row' }}>
              {weeks.map((w, i) => (
                <View key={i} style={{ marginRight: GAP }}>
                  {w.days.map((d, j) => (
                    <View
                      key={j}
                      style={[
                        styles.cell,
                        { backgroundColor: colors.heat[Math.min(d.count ? d.count + 2 : 0, 4)] },
                        d.future && { opacity: 0 },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      <Text style={[s.h2, { marginTop: 16, marginBottom: 10 }]}>Week by week</Text>
      <View style={s.card}>
        {[...recent].reverse().map((w, i) => (
          <View key={i} style={[s.row, { marginVertical: 4 }]}>
            <Text style={[s.muted, { width: 92, fontSize: 13 }]}>
              {i === 0 ? 'This week' : w.start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            </Text>
            <View style={{ flex: 1, flexDirection: 'row', gap: 3 }}>
              {Array.from({ length: maxRecent }, (_, k) => (
                <View
                  key={k}
                  style={[styles.weekBlock, { backgroundColor: k < w.total ? colors.heat[4] : colors.heat[0] }]}
                />
              ))}
            </View>
            <Text style={[s.text, { width: 24, textAlign: 'right' }]}>{w.total}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const Stat = ({ label, value }) => (
  <View style={[s.card, { flex: 1, padding: 10, marginBottom: 0, alignItems: 'center' }]}>
    <Text style={[s.text, { fontSize: 22, fontWeight: '700' }]}>{value}</Text>
    <Text style={[s.muted, { fontSize: 11, textAlign: 'center' }]} numberOfLines={1}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  cell: { width: CELL, height: CELL, borderRadius: 3, marginBottom: GAP },
  dayLabel: { color: colors.muted, fontSize: 10, height: CELL, lineHeight: CELL, marginBottom: GAP },
  monthLabel: { color: colors.muted, fontSize: 10, position: 'absolute', top: 0 },
  weekBlock: { flex: 1, height: 14, borderRadius: 3, maxWidth: 28 },
});
