// Generates the two authoring workbooks shipped in templates/:
//   • Only-Connect-Template.xlsx   — blank, pre-seeded, with an Instructions tab
//   • Example-Sinistrals.xlsx      — the full example game (from the shared JSON)
//
// Run with:  npm run make-template
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const here = dirname(fileURLToPath(import.meta.url));

const HIEROGLYPH_LABEL = {
  'two-reeds': 'Two Reeds',
  lion: 'Lion',
  'twisted-flax': 'Twisted Flax',
  'horned-viper': 'Horned Viper',
  water: 'Water',
  'eye-of-horus': 'Eye of Horus',
};
const HIEROGLYPHS = Object.keys(HIEROGLYPH_LABEL);

const R1_HEAD = ['Hieroglyph', 'Type', 'Clue1', 'Clue2', 'Clue3', 'Clue4', 'Connection', 'Details'];
const R2_HEAD = ['Hieroglyph', 'Type', 'Clue1', 'Clue2', 'Clue3', 'Fourth', 'Connection', 'Details'];
const R3_HEAD = ['Wall', 'GroupConnection', 'Item1', 'Item2', 'Item3', 'Item4'];

const INSTRUCTIONS = [
  ['Only Connect — question set'],
  [''],
  ['Fill in the tabs, then load this file in the app (Load question set).'],
  [''],
  ['Info tab: Title / Series / Episode / Author / Notes.'],
  [''],
  ['R1_Connections: one row per hieroglyph (6). Up to four clues; name the connection.'],
  ['R2_Sequences: one row per hieroglyph (6). Three clues + the hidden "Fourth".'],
  ['  Type = text, picture or music.'],
  ['  For picture/music clues, put the FILENAME (e.g. round1_lion_1.png or song1.mp3).'],
  ['  Keep those files in a folder and select it with "Load media folder" in the app.'],
  ['  (Media type is auto-detected from the file extension, so a text answer in a'],
  ['   picture round still works — just type the words.)'],
  [''],
  ['R3_Wall: two walls named Lion and Water, four groups of four each (8 rows).'],
  [''],
  ['R4_MissingVowels: one row per category; type the real answers in Answer1..6.'],
  ['  The app removes the vowels and shifts the spaces for you automatically.'],
  ['  (Optional DisplayN columns let you override the generated puzzle text.)'],
];

function widths(ws, cols) {
  ws['!cols'] = cols.map((w) => ({ wch: w }));
  return ws;
}
const sheet = (aoa) => XLSX.utils.aoa_to_sheet(aoa);

function gameToWorkbook(game) {
  const wb = XLSX.utils.book_new();

  const info = [
    ['Title', game.title],
    ['Series', game.series ?? ''],
    ['Episode', game.episode ?? ''],
    ['Author', game.author ?? ''],
    ['Notes', game.notes ?? ''],
  ];
  XLSX.utils.book_append_sheet(wb, widths(sheet(info), [12, 60]), 'Info');

  const r1 = [R1_HEAD];
  for (const q of game.round1) {
    const clues = [0, 1, 2, 3].map((i) => q.clues[i]?.value ?? '');
    r1.push([HIEROGLYPH_LABEL[q.hieroglyph], q.media, ...clues, q.connection, q.details ?? '']);
  }
  XLSX.utils.book_append_sheet(wb, widths(sheet(r1), [14, 8, 22, 22, 22, 22, 26, 40]), 'R1_Connections');

  const r2 = [R2_HEAD];
  for (const q of game.round2) {
    const clues = [0, 1, 2].map((i) => q.clues[i]?.value ?? '');
    r2.push([HIEROGLYPH_LABEL[q.hieroglyph], q.media, ...clues, q.fourth.value, q.connection, q.details ?? '']);
  }
  XLSX.utils.book_append_sheet(wb, widths(sheet(r2), [14, 8, 22, 22, 22, 22, 26, 40]), 'R2_Sequences');

  const r3 = [R3_HEAD];
  for (const wall of game.round3) {
    for (const grp of wall.groups) {
      r3.push([wall.name === 'lion' ? 'Lion' : 'Water', grp.connection, ...grp.items.slice(0, 4)]);
    }
  }
  XLSX.utils.book_append_sheet(wb, widths(sheet(r3), [8, 34, 14, 14, 14, 14]), 'R3_Wall');

  const maxP = Math.max(1, ...game.round4.map((c) => c.puzzles.length));
  const r4head = ['Category'];
  for (let i = 1; i <= maxP; i++) r4head.push(`Answer${i}`);
  for (let i = 1; i <= maxP; i++) r4head.push(`Display${i}`);
  const r4 = [r4head];
  for (const c of game.round4) {
    const answers = Array.from({ length: maxP }, (_, i) => c.puzzles[i]?.answer ?? '');
    const displays = Array.from({ length: maxP }, (_, i) => c.puzzles[i]?.display ?? '');
    r4.push([c.title, ...answers, ...displays]);
  }
  XLSX.utils.book_append_sheet(wb, sheet(r4), 'R4_MissingVowels');

  return wb;
}

function blankTemplateWorkbook() {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, widths(sheet(INSTRUCTIONS), [90]), 'Instructions');
  XLSX.utils.book_append_sheet(
    wb,
    widths(sheet([['Title', 'My Only Connect game'], ['Series', ''], ['Episode', ''], ['Author', ''], ['Notes', '']]), [12, 60]),
    'Info'
  );
  XLSX.utils.book_append_sheet(
    wb,
    widths(sheet([R1_HEAD, ...HIEROGLYPHS.map((h) => [HIEROGLYPH_LABEL[h], 'text', '', '', '', '', '', ''])]), [14, 8, 22, 22, 22, 22, 26, 40]),
    'R1_Connections'
  );
  XLSX.utils.book_append_sheet(
    wb,
    widths(sheet([R2_HEAD, ...HIEROGLYPHS.map((h) => [HIEROGLYPH_LABEL[h], 'text', '', '', '', '', '', ''])]), [14, 8, 22, 22, 22, 22, 26, 40]),
    'R2_Sequences'
  );
  XLSX.utils.book_append_sheet(
    wb,
    widths(sheet([R3_HEAD, ...['Lion', 'Lion', 'Lion', 'Lion', 'Water', 'Water', 'Water', 'Water'].map((w) => [w, '', '', '', '', ''])]), [8, 34, 14, 14, 14, 14]),
    'R3_Wall'
  );
  XLSX.utils.book_append_sheet(
    wb,
    widths(sheet([['Category', 'Answer1', 'Answer2', 'Answer3', 'Answer4', 'Answer5', 'Answer6'], ['', '', '', '', '', '', ''], ['', '', '', '', '', '', '']]), [30, 18, 18, 18, 18, 18, 18]),
    'R4_MissingVowels'
  );
  return wb;
}

const example = JSON.parse(readFileSync(join(here, '..', 'src', 'game', 'exampleGame.data.json'), 'utf8'));

XLSX.writeFile(blankTemplateWorkbook(), join(here, 'Only-Connect-Template.xlsx'));
XLSX.writeFile(gameToWorkbook(example), join(here, 'Example-Sinistrals.xlsx'));
console.log('Wrote templates/Only-Connect-Template.xlsx and templates/Example-Sinistrals.xlsx');
