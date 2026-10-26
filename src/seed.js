// Starter templates from the Gym Program Revamp doc. Bump SEED_VERSION when the plan changes so
// existing installs swap in the new templates (see migrate in store.js).
export const SEED_VERSION = 2;

const t = (id, name, exercises) => ({
  id,
  name,
  exercises: exercises.map(([exName, sets, reps, note]) => ({ name: exName, sets, reps, ...(note && { note }) })),
});

// PPL v2 — Current Plan (dips lead push day, back extensions, arms on leg day).
export const seedTemplates = [
  t('seed-v2-push', 'Day 1 — Push', [
    ['Weighted Dips', 4, '6-8', 'Main lift: lean forward, full depth. Add 1-2.5 kg when you hit 8 on all sets'],
    ['Incline DB Press', 3, '8-10', 'Upper chest'],
    ['Low-to-high Cable Fly', 3, '12-15', 'Upper chest'],
    ['Leaning Cable Lateral Raise', 4, '12-15', 'Side delts'],
    ['Overhead Rope Extension', 3, '10-12'],
  ]),
  t('seed-v2-pull', 'Day 2 — Pull', [
    ['Pull-ups', 4, '6-8', 'Assisted (negative kg) until 8 at bodyweight, then add weight'],
    ['Chest-Supported Row', 3, '8-10'],
    ['Single-arm Lat Pulldown', 3, '10-12'],
    ['Straight-Arm Pulldown', 2, '12-15'],
    ['Incline DB Curl', 3, '10-12'],
    ['Hammer Curl', 2, '10-12'],
  ]),
  t('seed-v2-legs', 'Day 3 — Legs + Arms', [
    ['Leg Press', 4, '8-10'],
    ['Leg Curl', 3, '10-12'],
    ['Back Extension', 3, '10-15', 'Slow, stop at a straight line, no arching. Bodyweight until 3x15 is easy'],
    ['Calf Raise', 3, '12-15'],
    ['Cable or Preacher Curl', 3, '10-12', 'Superset with Rope Pressdown'],
    ['Rope Pressdown', 3, '10-12', 'Superset with the curl'],
    ['Cable Lateral Raise', 3, '15-20'],
  ]),
];

// Option 2 templates shipped in v1, keyed by id, so untouched copies can be swapped out.
export const v1SeedTemplates = {
  'seed-day-1-push': [
    ['Incline DB Press', 4, '6-8'],
    ['Weighted Dips', 3, '8-10'],
    ['Low-to-high Cable Fly', 3, '12-15'],
    ['Leaning Cable Lateral Raise', 4, '12-15'],
    ['Overhead Rope Extension', 3, '10-12'],
    ['Rope Pressdown', 2, '12-15'],
  ],
  'seed-day-2-pull': [
    ['Weighted Pull-ups', 4, '6-8'],
    ['Chest-Supported Row', 3, '8-10'],
    ['Single-arm Lat Pulldown', 3, '10-12'],
    ['Straight-Arm Pulldown', 2, '12-15'],
    ['Incline DB Curl', 3, '10-12'],
    ['Hammer Curl', 2, '10-12'],
  ],
  'seed-day-3-legs-top-up': [
    ['Leg Press', 4, '8-10'],
    ['Leg Curl', 3, '10-12'],
    ['Leg Extension', 2, '12-15'],
    ['Calf Raise', 3, '12-15'],
    ['Cable Lateral Raise', 3, '15-20'],
  ],
};
