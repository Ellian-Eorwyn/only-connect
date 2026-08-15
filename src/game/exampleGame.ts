import { GameSet } from '../types';
import data from './exampleGame.data.json';

// The built-in example: Series 22, Episode 3 — "Sinistrals v Merseyside Eyes",
// transcribed from the OCDB archive. Picture/music clues reference the bundled
// files in assets/example (see EXAMPLE_MEDIA). Shared with the template
// generator via the JSON so both stay in sync.
export const EXAMPLE_GAME: GameSet = data as GameSet;
