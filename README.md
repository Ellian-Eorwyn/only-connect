# Only Connect — Home Game

A browser version of the *Only Connect* quiz show for playing at home with friends.
Author a question set in a spreadsheet, load it in the browser, and run a full four‑round
game on one shared screen. The **host** drives everything (revealing clues, scoring,
timers) **except the Connecting Wall**, which players tap through themselves.

It's built to feel like the show — deep‑navy "eye" backdrop, the six hieroglyph selectors,
the wall that resolves into coloured rows — without copying its branding.

---

## Quick start

On Linux/macOS, the two scripts do everything (they need **Node 18+**):

```bash
./install.sh   # installs Node automatically (via nvm, no sudo) if you don't have it, then deps
./run.sh       # starts the app and opens your browser
```

`./install.sh` prompts before installing Node; pass `-y` to skip the prompt and do everything
automatically.

Or the plain npm way (any platform):

```bash
npm install
npm run dev
```

Open the printed URL (usually `http://localhost:5173`). On the setup screen click
**Load example game** to play immediately, or **Load question set** to load your own.

### No‑install version for game night

```bash
npm run build
```

This produces a single self‑contained `dist/index.html` (everything inlined) that you can
**double‑click to open** in Chrome/Edge — no server, fully offline.

### Updating

To pull the latest version later, either:

- run `./update.sh` in the project folder (does `git pull` + `npm install`), or
- click **⟳ Update from GitHub** on the setup screen while the app is running via `./run.sh`
  (it updates in place and reloads).

---

## How a game runs

| Round | What happens | Points |
|---|---|---|
| **1 · Connections** | Pick a hieroglyph, reveal up to 4 clues, name the connection. | 5 / 3 / 2 / 1 by clues used; failed → other team +1 |
| **2 · Sequences** | Pick a hieroglyph, see 3 clues, name the **4th**. | 5 / 3 / 2; failed → other team +1 |
| **3 · The Wall** | Each team takes a wall: find four groups of four in 2:30. | 1 per group + 1 per connection + 2 for a perfect wall (max 10) |
| **4 · Missing Vowels** | Vowels removed, spaces shifted; buzz in. | +1 correct, −1 wrong |

**The host** reveals clues and awards points (the suggested value is highlighted, but the
host has the final say on every button). **Players** only touch the screen during the Wall:
tap tiles to select four — the moment the fourth is chosen it resolves. A correct group locks
to the top in its own colour; after two groups you get just three lives. When two groups
remain, solving one auto‑resolves the last.

### Host keyboard shortcuts

- **Space** — reveal the next clue (R1/R2) · advance puzzle (R4)
- **Enter** — reveal the answer (R1/R2)
- **A / L** — Team 1 / Team 2 buzzer (R4)
- **U** — undo the last action

The bottom bar also has round navigation, timer start/pause/reset, manual score ±, undo, a
**mute** toggle, and **New game**. Progress auto‑saves, so a refresh mid‑game resumes where you
left off.

### Sound

Three music cues play automatically:

- **Theme tune** on the setup/title screen (some browsers won't autoplay until your first
  click — it starts then).
- **40‑second round music** while a Connections/Sequences timer runs; it stops the moment you
  pause or award a score.
- **Wall music** while the wall timer runs; it pauses with the timer and stops once the wall is
  complete (before connections are scored).

Use the 🔊 button (host bar, or top‑right on the setup screen) to mute everything.

---

## Writing your own question set

Click **Download blank template** on the setup screen (or find `templates/Only-Connect-Template.xlsx`).
It's an Excel workbook with one tab per round:

- **Info** — `Title`, `Series`, `Episode`, `Author`, `Notes`.
- **R1_Connections** — one row per hieroglyph (Two Reeds, Lion, Twisted Flax, Horned Viper,
  Water, Eye of Horus): `Type`, `Clue1…4`, `Connection`, `Details`.
- **R2_Sequences** — one row per hieroglyph: `Type`, `Clue1…3`, `Fourth` (the hidden answer),
  `Connection`, `Details`.
- **R3_Wall** — two walls named **Lion** and **Water**, four groups of four each (8 rows):
  `GroupConnection`, `Item1…4`.
- **R4_MissingVowels** — one row per category; just type the real answers in `Answer1…6`.
  The app strips the vowels and shifts the spacing for you (optional `DisplayN` columns let
  you override the generated puzzle).

Load your finished file with **Load question set**; any problems are listed as warnings.

### Pictures and music

Set a clue's `Type` to `picture` or `music` and put the **filename** in the clue cell
(e.g. `round1_lion_1.png`, `song2.mp3`). Keep those files together in a folder and choose it
with **Load media folder**. Media type is auto‑detected from the file extension, so a text
answer inside a picture round still works — just type the words. (Media stays in your browser
for the session; after a refresh, re‑select the folder — game progress is unaffected.)

`templates/Example-Sinistrals.xlsx` is a fully worked example (the built‑in sample game).

---

## Project layout

```
src/
  App.tsx                 phase routing + keyboard shortcuts
  theme.css               all styling / theme tokens
  types.ts                data model
  game/
    store.ts              game state, scoring, undo, persistence (zustand)
    loadWorkbook.ts       .xlsx  -> GameSet (+ validation warnings)
    exportWorkbook.ts     GameSet -> .xlsx (template + downloads)
    missingVowels.ts      vowel-strip + space-shift generator
    media.ts              filename -> object URL
    exampleGame*.{ts,json}  the built-in sample game
    audio.ts              theme / round / wall music tracks
  components/             Setup, Scoreboard, HostBar, AudioController, the four rounds, wall, etc.
  assets/hieroglyphs/     the six hieroglyph SVGs (navy background removed)
  assets/audio/           theme, 40s round, and wall music
  assets/example/         bundled pictures + music for the sample game
templates/
  build-template.mjs      regenerates the two .xlsx files (npm run make-template)
```

## Notes

- Two teams, one shared screen, fully offline.
- Not affiliated with the BBC or the *Only Connect* production; the sample game's questions
  come from the community OCDB archive and are included only as a local demonstration.

## License

**Personal, non‑commercial home use only** — see [LICENSE](LICENSE). *Only Connect*, its format,
and its music are the property of their respective rights holders (RDF/Parasol/Banijay, and the
BBC); this is an unofficial fan‑made tool. The bundled sample questions, images, and music are
copyright their owners and are **not** licensed for redistribution — if you share this project,
replace that sample content with your own first.
