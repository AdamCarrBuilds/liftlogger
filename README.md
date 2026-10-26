# LiftLogger

Minimal workout tracker built with React Native (Expo). Runs on iOS/Android via Expo Go and in the browser (deployed to Vercel).

- **Workout** – start an empty workout or one from a template; log weight × reps per set (negative weights allowed for assisted lifts), tick sets off, see what you did last time. One overall workout timer.
- **Templates** – create/edit/delete, custom exercise names, set counts and rep targets. Starts with the current Push / Pull / Legs plan (PPL v2 from the Gym Program Revamp doc); exercise notes show under each lift.
- **History** – finished workouts by month with best set, duration and volume. Tap a card for all sets / delete.
- **Overview** – GitHub-style heatmap of the last 12 months plus a week-by-week count.

- **Settings** (••• on Workout or Overview) – template rotation order (the next one gets a highlighted border), gym location detection, and JSON backup export/import (merged by id).
- **Gym detection** – save your gym's GPS position; while the app is open it offers to start the next workout when you arrive and to finish or cancel one you leave running. Wi-Fi network detection isn't possible from a web app.
- Set entry uses the number pad (± key for negative weights), suggests your working weight (last set this session, else last session's top set) and plays a soft ding when a set is ticked (web).

Data is stored on-device (AsyncStorage / localStorage on web).

```bash
npm install
npm start           # Expo dev server (scan QR with Expo Go)
npm run web         # browser
npm run build:web   # static export to dist/ (what Vercel serves)
```
