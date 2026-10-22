import { Platform, StyleSheet } from 'react-native';

export const colors = {
  bg: '#22282e',
  card: '#2a3138',
  input: '#3a4249',
  border: '#4a535c',
  text: '#ffffff',
  muted: '#9aa3ab',
  accent: '#3aa0f0',
  green: '#2ecc71',
  doneRow: '#2d5a45',
  danger: '#e5534b',
  heat: ['#2f363d', '#0e4429', '#006d32', '#26a641', '#39d353'],
};

// iOS numeric pads have no minus key, so use a keyboard that does (negative weights = assisted lifts)
export const numberKeyboard = Platform.select({
  ios: 'numbers-and-punctuation',
  android: 'numeric',
  default: 'default',
});

export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 120 },
  title: { color: colors.text, fontSize: 34, fontWeight: '600', marginTop: 8, marginBottom: 16 },
  h2: { color: colors.text, fontSize: 20, fontWeight: '600' },
  text: { color: colors.text, fontSize: 15 },
  muted: { color: colors.muted, fontSize: 14 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    backgroundColor: colors.card,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', letterSpacing: 1.5, fontSize: 14 },
  link: { color: colors.accent, fontWeight: '700', letterSpacing: 1, fontSize: 14 },
  input: {
    backgroundColor: colors.input,
    color: colors.text,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
  },
});
