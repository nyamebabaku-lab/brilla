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
