// ---------------------------------------------------------------------------
// Core data model for a loaded Only Connect question set.
// ---------------------------------------------------------------------------

export const HIEROGLYPHS = [
  'two-reeds',
  'lion',
  'twisted-flax',
  'horned-viper',
  'water',
  'eye-of-horus',
] as const;
export type Hieroglyph = (typeof HIEROGLYPHS)[number];

export const HIEROGLYPH_LABEL: Record<Hieroglyph, string> = {
  'two-reeds': 'Two Reeds',
  lion: 'Lion',
  'twisted-flax': 'Twisted Flax',
  'horned-viper': 'Horned Viper',
  water: 'Water',
  'eye-of-horus': 'Eye of Horus',
};

/** How a clue's `value` should be interpreted. */
export type ClueMedia = 'text' | 'picture' | 'music';

export interface Clue {
  media: ClueMedia;
  /** Text to display, OR a media filename to resolve against the media folder. */
  value: string;
}

/** Round 1 — Connections. Up to four clues; name the connection. */
export interface ConnQuestion {
  hieroglyph: Hieroglyph;
  media: ClueMedia;
  clues: Clue[]; // 1..4
  connection: string;
  details?: string; // the specific four answers / explanation
}

/** Round 2 — Sequences. Three clues shown; name the fourth. */
export interface SeqQuestion {
  hieroglyph: Hieroglyph;
  media: ClueMedia;
  clues: Clue[]; // first three shown
  fourth: Clue; // the hidden answer
  connection: string;
  details?: string;
}

export interface WallGroup {
  connection: string;
  items: string[]; // exactly 4
}

export type WallName = 'lion' | 'water';

export interface Wall {
  name: WallName;
  groups: WallGroup[]; // exactly 4 → 16 tiles
}

export interface MVPuzzle {
  answer: string; // the real phrase
  display: string; // vowel-stripped, space-shifted version shown on screen
}

export interface MVCategory {
  title: string;
  puzzles: MVPuzzle[];
}

export interface GameSet {
  title: string;
  series?: string;
  episode?: string;
  author?: string;
  notes?: string;
  round1: ConnQuestion[];
  round2: SeqQuestion[];
  round3: Wall[]; // [lion, water]
  round4: MVCategory[];
}

/** Non-fatal issues surfaced to the author when loading a workbook. */
export interface LoadWarning {
  sheet: string;
  message: string;
}

export interface LoadResult {
  game: GameSet;
  warnings: LoadWarning[];
}
