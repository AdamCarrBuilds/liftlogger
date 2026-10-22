// Push/Pull/Legs (Option 2 of the Gym Program Revamp) loaded as starter templates.
const t = (name, exercises) => ({
  id: 'seed-' + name.toLowerCase().replace(/[^a-z]+/g, '-'),
  name,
  exercises: exercises.map(([exName, sets, reps]) => ({ name: exName, sets, reps })),
});

export const seedTemplates = [
  t('Day 1 — Push', [
    ['Incline DB Press', 4, '6-8'],
    ['Weighted Dips', 3, '8-10'],
    ['Low-to-high Cable Fly', 3, '12-15'],
    ['Leaning Cable Lateral Raise', 4, '12-15'],
    ['Overhead Rope Extension', 3, '10-12'],
    ['Rope Pressdown', 2, '12-15'],
  ]),
  t('Day 2 — Pull', [
    ['Weighted Pull-ups', 4, '6-8'],
    ['Chest-Supported Row', 3, '8-10'],
    ['Single-arm Lat Pulldown', 3, '10-12'],
    ['Straight-Arm Pulldown', 2, '12-15'],
    ['Incline DB Curl', 3, '10-12'],
    ['Hammer Curl', 2, '10-12'],
  ]),
  t('Day 3 — Legs + Top-up', [
    ['Leg Press', 4, '8-10'],
    ['Leg Curl', 3, '10-12'],
    ['Leg Extension', 2, '12-15'],
    ['Calf Raise', 3, '12-15'],
    ['Cable Lateral Raise', 3, '15-20'],
  ]),
];
