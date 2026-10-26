# LiftLogger

Minimal workout tracker built with React Native (Expo). Runs on iOS/Android via Expo Go and in the browser (deployed to Vercel).

- **Workout** – start an empty workout or one from a template; log weight × reps per set (negative weights allowed for assisted lifts), tick sets off, see what you did last time. One overall workout timer.
- **Templates** – create/edit/delete, custom exercise names, set counts and rep targets. Starts with the current Push / Pull / Legs plan (PPL v2 from the Gym Program Revamp doc); exercise notes show under each lift.
- **History** – finished workouts by month with best set, duration and volume. Tap a card for all sets / delete.
- **Overview** – GitHub-style heatmap of the last 12 months plus a week-by-week count.

Data is stored on-device (AsyncStorage / localStorage on web).

```bash
npm install
npm start           # Expo dev server (scan QR with Expo Go)
npm run web         # browser
npm run build:web   # static export to dist/ (what Vercel serves)
```
