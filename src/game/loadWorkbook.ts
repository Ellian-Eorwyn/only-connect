import * as XLSX from 'xlsx';
import {
  Clue,
  ClueMedia,
  ConnQuestion,
  GameSet,
  Hieroglyph,
  HIEROGLYPHS,
  LoadResult,
  LoadWarning,
  MVCategory,
  SeqQuestion,
  Wall,
  WallGroup,
  WallName,
} from '../types';
import { makeMissingVowels } from './missingVowels';

const IMG_RE = /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i;
const AUD_RE = /\.(mp3|wav|ogg|m4a|aac|flac)$/i;

const norm = (s: unknown) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/** Detect a clue's media type from its cell value (filename extension wins). */
function clueFrom(value: unknown): Clue | null {
  const v = String(value ?? '').trim();
  if (!v) return null;
  let media: ClueMedia = 'text';
  if (IMG_RE.test(v)) media = 'picture';
  else if (AUD_RE.test(v)) media = 'music';
  return { media, value: v };
}

function toHieroglyph(value: unknown): Hieroglyph | null {
  const n = norm(value);
  const map: Record<string, Hieroglyph> = {
    tworeeds: 'two-reeds',
    reeds: 'two-reeds',
    lion: 'lion',
    twistedflax: 'twisted-flax',
    flax: 'twisted-flax',
    hornedviper: 'horned-viper',
    viper: 'horned-viper',
    water: 'water',
    eyeofhorus: 'eye-of-horus',
    horus: 'eye-of-horus',
    eye: 'eye-of-horus',
  };
  return map[n] ?? null;
}

type Row = Record<string, unknown>;

/** Case/spacing-insensitive cell accessor for a row object. */
function cell(row: Row, ...keys: string[]): string {
  const wanted = keys.map(norm);
  for (const k of Object.keys(row)) {
    if (wanted.includes(norm(k))) {
      const v = row[k];
      if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
  }
  return '';
}

function questionMedia(clues: Clue[]): ClueMedia {
  const nonText = clues.find((c) => c.media !== 'text');
  return nonText ? nonText.media : 'text';
}

export function parseWorkbook(data: ArrayBuffer): LoadResult {
  const warnings: LoadWarning[] = [];
  const wb = XLSX.read(data, { type: 'array' });

  const findSheet = (...keywords: string[]): XLSX.WorkSheet | null => {
    for (const name of wb.SheetNames) {
      const nn = norm(name);
      if (keywords.some((k) => nn.includes(norm(k)))) return wb.Sheets[name];
    }
    return null;
  };
  const rowsOf = (sheet: XLSX.WorkSheet | null): Row[] =>
    sheet ? (XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Row[]) : [];

  // ---- Info ----
  const infoSheet = findSheet('info', 'about');
  const info: Record<string, string> = {};
  if (infoSheet) {
    const aoa = XLSX.utils.sheet_to_json<string[]>(infoSheet, { header: 1, defval: '' });
    for (const r of aoa) {
      const key = norm(r[0]);
      const val = String(r[1] ?? '').trim();
      if (key) info[key] = val;
    }
  }

  // ---- Round 1: Connections ----
  const round1: ConnQuestion[] = [];
  const r1rows = rowsOf(findSheet('connection', 'round1', 'r1'));
  for (const row of r1rows) {
    const h = toHieroglyph(cell(row, 'hieroglyph', 'symbol', 'pick'));
    const clues = [1, 2, 3, 4]
      .map((i) => clueFrom(cell(row, `clue${i}`, `clue ${i}`)))
      .filter((c): c is Clue => c !== null);
    const connection = cell(row, 'connection', 'answer', 'link');
    if (!h && !clues.length && !connection) continue; // blank row
    if (!h) {
      warnings.push({ sheet: 'Connections', message: `Row skipped: unknown hieroglyph "${cell(row, 'hieroglyph')}".` });
      continue;
    }
    if (!clues.length) warnings.push({ sheet: 'Connections', message: `${h}: no clues found.` });
    round1.push({
      hieroglyph: h,
      media: questionMedia(clues),
      clues,
      connection,
      details: cell(row, 'details', 'specifics', 'explanation'),
    });
  }

  // ---- Round 2: Sequences ----
  const round2: SeqQuestion[] = [];
  const r2rows = rowsOf(findSheet('sequence', 'round2', 'r2'));
  for (const row of r2rows) {
    const h = toHieroglyph(cell(row, 'hieroglyph', 'symbol', 'pick'));
    const clues = [1, 2, 3]
      .map((i) => clueFrom(cell(row, `clue${i}`, `clue ${i}`)))
      .filter((c): c is Clue => c !== null);
    const fourth = clueFrom(cell(row, 'fourth', 'clue4', 'answer4', 'missing'));
    const connection = cell(row, 'connection', 'sequence', 'link');
    if (!h && !clues.length && !connection) continue;
    if (!h) {
      warnings.push({ sheet: 'Sequences', message: `Row skipped: unknown hieroglyph "${cell(row, 'hieroglyph')}".` });
      continue;
    }
    if (!fourth) warnings.push({ sheet: 'Sequences', message: `${h}: no "Fourth" answer found.` });
    round2.push({
      hieroglyph: h,
      media: questionMedia([...clues, ...(fourth ? [fourth] : [])]),
      clues,
      fourth: fourth ?? { media: 'text', value: '?' },
      connection,
      details: cell(row, 'details', 'explanation'),
    });
  }

  // ---- Round 3: Connecting Walls ----
  const wallsByName: Record<WallName, WallGroup[]> = { lion: [], water: [] };
  const r3rows = rowsOf(findSheet('wall', 'round3', 'r3'));
  for (const row of r3rows) {
    const wallRaw = norm(cell(row, 'wall', 'wallname'));
    const wall: WallName | null = wallRaw.includes('lion')
      ? 'lion'
      : wallRaw.includes('water')
        ? 'water'
        : null;
    const items = [1, 2, 3, 4]
      .map((i) => cell(row, `item${i}`, `clue${i}`, `tile${i}`))
      .filter((x) => x !== '');
    const connection = cell(row, 'groupconnection', 'connection', 'group', 'answer');
    if (!wall && !items.length && !connection) continue;
    if (!wall) {
      warnings.push({ sheet: 'Wall', message: `Row skipped: wall must be "Lion" or "Water".` });
      continue;
    }
    if (items.length !== 4) {
      warnings.push({ sheet: 'Wall', message: `${wall} wall group "${connection}" has ${items.length} items (need 4).` });
    }
    wallsByName[wall].push({ connection, items });
  }
  const round3: Wall[] = (['lion', 'water'] as WallName[])
    .filter((n) => wallsByName[n].length > 0)
    .map((n) => {
      if (wallsByName[n].length !== 4) {
        warnings.push({ sheet: 'Wall', message: `${n} wall has ${wallsByName[n].length} groups (need 4).` });
      }
      return { name: n, groups: wallsByName[n].slice(0, 4) };
    });

  // ---- Round 4: Missing Vowels ----
  const round4: MVCategory[] = [];
  const r4rows = rowsOf(findSheet('vowel', 'missing', 'round4', 'r4'));
  for (const row of r4rows) {
    const title = cell(row, 'category', 'title', 'theme');
    const puzzles = [1, 2, 3, 4, 5, 6]
      .map((i) => {
        const answer = cell(row, `answer${i}`, `phrase${i}`, `clue${i}`);
        if (!answer) return null;
        const display = cell(row, `display${i}`) || makeMissingVowels(answer);
        return { answer, display };
      })
      .filter((p): p is { answer: string; display: string } => p !== null);
    if (!title && !puzzles.length) continue;
    round4.push({ title, puzzles });
  }

  // ---- Cross-round validation ----
  const seen = new Set<Hieroglyph>();
  for (const q of round1) {
    if (seen.has(q.hieroglyph)) warnings.push({ sheet: 'Connections', message: `Duplicate hieroglyph ${q.hieroglyph}.` });
    seen.add(q.hieroglyph);
  }
  for (const h of HIEROGLYPHS) {
    if (round1.length && !round1.find((q) => q.hieroglyph === h))
      warnings.push({ sheet: 'Connections', message: `Missing ${h} question.` });
  }
  if (round1.length && round1.length !== 6)
    warnings.push({ sheet: 'Connections', message: `Found ${round1.length} questions (expected 6).` });
  if (round2.length && round2.length !== 6)
    warnings.push({ sheet: 'Sequences', message: `Found ${round2.length} questions (expected 6).` });
  if (!round4.length) warnings.push({ sheet: 'Missing Vowels', message: `No categories found.` });

  const game: GameSet = {
    title: info.title || 'Untitled game',
    series: info.series || undefined,
    episode: info.episode || undefined,
    author: info.author || undefined,
    notes: info.notes || undefined,
    round1: sortByHieroglyph(round1),
    round2: sortByHieroglyph(round2),
    round3,
    round4,
  };
  return { game, warnings };
}

function sortByHieroglyph<T extends { hieroglyph: Hieroglyph }>(arr: T[]): T[] {
  return [...arr].sort(
    (a, b) => HIEROGLYPHS.indexOf(a.hieroglyph) - HIEROGLYPHS.indexOf(b.hieroglyph)
  );
}

/** Read a File (from an <input>) into a parsed game set. */
export async function loadWorkbookFile(file: File): Promise<LoadResult> {
  const buf = await file.arrayBuffer();
  return parseWorkbook(buf);
}
