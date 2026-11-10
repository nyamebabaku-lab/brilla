# Brilla — Learn & Play

A colourful learning app for children aged 2–12 (Creche → Primary 6): tracing, colouring, drawing, scribbling, phonics, English, writing, maths and science. Lessons follow the Ghana GES curriculum or an International track, are read aloud, and work offline once installed.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Demo accounts (password `demo123`, parent PIN `1234`)

| Account | Login |
|---|---|
| Family parent (3 kids, Family plan) | parent@brilla.app |
| New parent (free lessons only) | single@brilla.app |
| Teacher (School plan, 2 classes) | teacher@brilla.app |
| Admin | admin@brilla.app |
| Pupil | Class code `GOLD42` → Abena → 🍎 |

Demo payments: MoMo numbers ending `000` and cards ending `0002` are declined.

## How it's built

React + Vite + Tailwind + Zustand (saved in the browser) + PWA (offline). No backend yet.

- `src/curriculum/`: levels, subjects, GES/International tracks and lesson generators (about 820 lessons)
- `src/activities/`: tracing, drawing, colouring, quiz, sorting, spelling, phonics and writing activities
- `src/lib/payments.js`: simulated MoMo and card checkout (the place to connect Paystack/Hubtel)
- `src/data/store.js`: all data (the place to connect a Supabase backend)

## Teacher voices (voice bank)

Every line the app speaks is in `src/voice/catalogue.json` with a permanent key (e.g. `M-0247 "What is"`).
The app joins recorded clips to say any lesson; anything not recorded yet uses the device voice.

1. **Script:** `npm run voice:script` rebuilds the catalogue from the lesson generators (keys never change),
   then `npm run voice:pdf` writes `release/Brilla-Voice-Script.html` (print it to PDF).
2. **Record:** read each 50-line take in order, ~1.5 s pause between lines, 4 s pause to redo the last line.
   Name files `Akos_M03.m4a`, `Kwame_M03.m4a`, `Twi_T01.m4a`, `Ga_G01.m4a`. Or record in **Admin → Voice studio**
   and use *Export* to make a voice pack.
3. **Sync:** put the files (and/or voice packs) in a folder and run
   `FFMPEG=/path/to/ffmpeg npm run voice:sync -- <folder>`. Clips go to `public/voice/<teacher>/<key>.mp3`,
   the manifest is updated, and `release/voice-sync-report.md` lists any take that needs checking
   (takes whose line count doesn't match are not saved).
4. Build and deploy as usual; the Android build includes the clips.

### Publishing from Brilla Admin (automatic)

Recordings made in the **Brilla Admin** app are published to families automatically through the server
(Supabase project `poultrypro`, Brilla-only tables `brilla_staff` / `brilla_voice_clips` and the public
`brilla-voice` storage bucket; setup in `supabase/migrations/20261110000000_brilla_voice.sql`).

- Recorders create an account in Brilla Admin; the admin approves them and picks their voices
  (Backup & safety → Recorders). The owner email in `brilla_owner_email()` becomes the admin.
- Clean recordings go live at once; recordings with a quality warning wait for a re-record or *Publish anyway*.
  Offline recordings queue and upload when the phone is back online. Deleting unpublishes (files are kept so
  restores work).
- Family apps fetch the published list (`src/lib/server.js`) and download each clip once for offline use.
  Every build runs `scripts/voice-pull.mjs`, which packs published clips (as MP3) into the app.
