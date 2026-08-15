import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  GameSet,
  Hieroglyph,
  HIEROGLYPHS,
  WallName,
} from '../types';
import { MediaMap } from './media';

// ---------------------------------------------------------------------------
// Phases
// ---------------------------------------------------------------------------
export type Phase = 'setup' | 'round1' | 'round2' | 'round3' | 'round4' | 'end';

export interface Team {
  name: string;
  score: number;
}

// Shared runtime for the two "pick a hieroglyph" rounds (Connections/Sequences).
export interface ConnRuntime {
  used: Record<Hieroglyph, boolean>;
  current: Hieroglyph | null; // open question, or null while at the picker
  revealed: number; // number of clues currently shown
  answerRevealed: boolean;
}

const freshConn = (): ConnRuntime => ({
  used: {
    'two-reeds': false,
    lion: false,
    'twisted-flax': false,
    'horned-viper': false,
    water: false,
    'eye-of-horus': false,
  },
  current: null,
  revealed: 1,
  answerRevealed: false,
});

// Connecting Wall runtime, one entry per wall.
export interface WallPlay {
  order: number[]; // 16 tile ids in display order (before solving)
  selected: number[]; // currently selected tile ids (max 4)
  solvedGroups: number[]; // original group indices, in the order solved
  lives: number; // -1 = unlimited (before two groups solved); else 0..3
  wrong: number[]; // tiles briefly flashing as an incorrect guess
  frozen: boolean; // lives exhausted or time up
  finished: boolean; // resolved or frozen — ready to score
  connectionsFound: boolean[]; // length 4, host marks which connections were named
  connectionsRevealed: boolean[]; // length 4, whether the connection has been shown/adjudicated
  scored: boolean; // wall score already added to the team
}

export interface WallRuntime {
  stage: 'assign' | 'play' | 'score';
  assignment: [WallName | null, WallName | null]; // team 0 / team 1 wall choice
  activeTeam: 0 | 1 | null; // team currently at the wall
  plays: Record<WallName, WallPlay | null>;
}

const freshWall = (): WallRuntime => ({
  stage: 'assign',
  assignment: [null, null],
  activeTeam: null,
  plays: { lion: null, water: null },
});

export interface MVRuntime {
  catIndex: number; // -1 before the first category is shown
  puzzleIndex: number; // -1 before the first puzzle in a category
  answerRevealed: boolean;
  buzzed: 0 | 1 | null; // which team buzzed first (lockout)
  durationSec: number;
}

const freshMV = (): MVRuntime => ({
  catIndex: -1,
  puzzleIndex: -1,
  answerRevealed: false,
  buzzed: null,
  durationSec: 120,
});

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------
interface CoreState {
  teams: [Team, Team];
  phase: Phase;
  activeTeam: 0 | 1; // whose turn to pick in R1/R2
  r1: ConnRuntime;
  r2: ConnRuntime;
  wall: WallRuntime;
  r4: MVRuntime;
  // wall penalty rule can be relaxed for casual play
  wallLivesRule: boolean;
}

interface StoreState extends CoreState {
  gameSet: GameSet | null;
  media: MediaMap;
  // timer: purely presentational; Timer component reads these
  timerRunning: boolean;
  timerReset: number; // bump to restart
  // audio
  audioMuted: boolean;
  toggleMute: () => void;
  // undo history (not persisted)
  history: string[];

  // ---- setup ----
  loadGame: (game: GameSet) => void;
  setMedia: (media: MediaMap) => void;
  setTeamName: (i: 0 | 1, name: string) => void;
  startGame: () => void;
  resetAll: () => void;

  // ---- navigation ----
  setPhase: (p: Phase) => void;
  setActiveTeam: (i: 0 | 1) => void;
  adjustScore: (i: 0 | 1, delta: number) => void;

  // ---- timer ----
  timerStart: () => void;
  timerPause: () => void;
  timerRestart: () => void;

  // ---- rounds 1 & 2 ----
  pickHieroglyph: (round: 1 | 2, h: Hieroglyph) => void;
  revealNextClue: (round: 1 | 2) => void;
  revealAnswer: (round: 1 | 2) => void;
  closeQuestion: (round: 1 | 2, teamIndex: 0 | 1 | null, points: number) => void;
  backToPicker: (round: 1 | 2) => void;

  // ---- round 3 (wall) ----
  assignWall: (teamIndex: 0 | 1, wall: WallName) => void;
  startWallPlay: (teamIndex: 0 | 1) => void;
  toggleTile: (wall: WallName, tileId: number) => void;
  clearWallWrong: (wall: WallName) => void;
  freezeWall: (wall: WallName) => void;
  revealConnection: (wall: WallName, groupIndex: number, correct: boolean) => void;
  applyWallScore: (teamIndex: 0 | 1, wall: WallName) => void;
  setWallLivesRule: (on: boolean) => void;

  // ---- round 4 ----
  showCategory: (idx: number) => void;
  nextPuzzle: () => void;
  revealMVAnswer: () => void;
  buzz: (teamIndex: 0 | 1) => void;
  clearBuzz: () => void;
  setMVDuration: (sec: number) => void;

  // ---- undo ----
  undo: () => void;
  canUndo: () => boolean;
}

const CORE_KEYS: (keyof CoreState)[] = [
  'teams',
  'phase',
  'activeTeam',
  'r1',
  'r2',
  'wall',
  'r4',
  'wallLivesRule',
];

function serializeCore(s: StoreState): string {
  const core: Partial<CoreState> = {};
  for (const k of CORE_KEYS) (core as Record<string, unknown>)[k] = s[k];
  return JSON.stringify(core);
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const groupOfTile = (id: number) => Math.floor(id / 4);

export const useGame = create<StoreState>()(
  persist(
    (set, get) => {
      // Push a snapshot of the mutable "core" state for undo, before an action.
      const snapshot = () =>
        set((s) => ({ history: [...s.history, serializeCore(s)].slice(-50) }));

      return {
        // ---- initial ----
        teams: [
          { name: 'Team 1', score: 0 },
          { name: 'Team 2', score: 0 },
        ],
        phase: 'setup',
        activeTeam: 0,
        r1: freshConn(),
        r2: freshConn(),
        wall: freshWall(),
        r4: freshMV(),
        wallLivesRule: true,
        gameSet: null,
        media: {},
        timerRunning: false,
        timerReset: 0,
        audioMuted: false,
        history: [],
        toggleMute: () => set((s) => ({ audioMuted: !s.audioMuted })),

        // ---- setup ----
        loadGame: (game) => set({ gameSet: game }),
        setMedia: (media) => set({ media }),
        setTeamName: (i, name) =>
          set((s) => {
            const teams = [...s.teams] as [Team, Team];
            teams[i] = { ...teams[i], name };
            return { teams };
          }),
        startGame: () =>
          set((s) => ({
            phase: 'round1',
            activeTeam: 0,
            r1: freshConn(),
            r2: freshConn(),
            wall: freshWall(),
            r4: { ...freshMV(), durationSec: s.r4.durationSec },
            teams: [
              { ...s.teams[0], score: 0 },
              { ...s.teams[1], score: 0 },
            ],
            history: [],
            timerRunning: false,
          })),
        resetAll: () =>
          set((s) => ({
            phase: 'setup',
            activeTeam: 0,
            r1: freshConn(),
            r2: freshConn(),
            wall: freshWall(),
            r4: freshMV(),
            teams: [
              { name: s.teams[0].name, score: 0 },
              { name: s.teams[1].name, score: 0 },
            ],
            history: [],
            timerRunning: false,
          })),

        // ---- navigation ----
        setPhase: (p) => {
          snapshot();
          set({ phase: p, timerRunning: false, timerReset: get().timerReset + 1 });
        },
        setActiveTeam: (i) => {
          snapshot();
          set({ activeTeam: i });
        },
        adjustScore: (i, delta) => {
          snapshot();
          set((s) => {
            const teams = [...s.teams] as [Team, Team];
            teams[i] = { ...teams[i], score: teams[i].score + delta };
            return { teams };
          });
        },

        // ---- timer ----
        timerStart: () => set({ timerRunning: true }),
        timerPause: () => set({ timerRunning: false }),
        timerRestart: () =>
          set((s) => ({ timerRunning: false, timerReset: s.timerReset + 1 })),

        // ---- rounds 1 & 2 ----
        pickHieroglyph: (round, h) => {
          snapshot();
          const key = round === 1 ? 'r1' : 'r2';
          set((s) => ({
            [key]: { ...s[key], current: h, revealed: 1, answerRevealed: false },
            timerRunning: false,
            timerReset: s.timerReset + 1,
          }));
        },
        revealNextClue: (round) => {
          const key = round === 1 ? 'r1' : 'r2';
          const s = get();
          const rt = s[key];
          if (!rt.current) return;
          const game = s.gameSet;
          if (!game) return;
          const q =
            round === 1
              ? game.round1.find((x) => x.hieroglyph === rt.current)
              : game.round2.find((x) => x.hieroglyph === rt.current);
          if (!q) return;
          const max = q.clues.length;
          if (rt.revealed >= max) return;
          set({ [key]: { ...rt, revealed: rt.revealed + 1 } } as Partial<StoreState>);
        },
        revealAnswer: (round) => {
          const key = round === 1 ? 'r1' : 'r2';
          set((s) => ({ [key]: { ...s[key], answerRevealed: true } }));
        },
        closeQuestion: (round, teamIndex, points) => {
          snapshot();
          const key = round === 1 ? 'r1' : 'r2';
          set((s) => {
            const rt = s[key];
            const teams = [...s.teams] as [Team, Team];
            if (teamIndex !== null && points > 0) {
              teams[teamIndex] = {
                ...teams[teamIndex],
                score: teams[teamIndex].score + points,
              };
            }
            const used = rt.current
              ? { ...rt.used, [rt.current]: true }
              : rt.used;
            return {
              teams,
              [key]: {
                ...rt,
                used,
                current: null,
                revealed: 1,
                answerRevealed: false,
              },
              activeTeam: (s.activeTeam === 0 ? 1 : 0) as 0 | 1,
              timerRunning: false,
            };
          });
        },
        backToPicker: (round) => {
          snapshot();
          const key = round === 1 ? 'r1' : 'r2';
          set((s) => ({
            [key]: { ...s[key], current: null, revealed: 1, answerRevealed: false },
            timerRunning: false,
          }));
        },

        // ---- round 3: connecting wall ----
        assignWall: (teamIndex, wall) => {
          snapshot();
          set((s) => {
            const assignment = [...s.wall.assignment] as [
              WallName | null,
              WallName | null
            ];
            assignment[teamIndex] = wall;
            // keep the two teams on different walls
            const other = (teamIndex === 0 ? 1 : 0) as 0 | 1;
            if (assignment[other] === wall) {
              assignment[other] = wall === 'lion' ? 'water' : 'lion';
            }
            return { wall: { ...s.wall, assignment } };
          });
        },
        startWallPlay: (teamIndex) => {
          snapshot();
          set((s) => {
            const wallName = s.wall.assignment[teamIndex];
            if (!wallName) return {};
            const existing = s.wall.plays[wallName];
            const play: WallPlay =
              existing ?? {
                order: shuffle([...Array(16).keys()]),
                selected: [],
                solvedGroups: [],
                lives: -1,
                wrong: [],
                frozen: false,
                finished: false,
                connectionsFound: [false, false, false, false],
                connectionsRevealed: [false, false, false, false],
                scored: false,
              };
            return {
              wall: {
                ...s.wall,
                stage: 'play',
                activeTeam: teamIndex,
                plays: { ...s.wall.plays, [wallName]: play },
              },
              timerRunning: true,
              timerReset: s.timerReset + 1,
            };
          });
        },
        toggleTile: (wall, tileId) => {
          const s = get();
          const play = s.wall.plays[wall];
          if (!play || play.frozen || play.finished || play.wrong.length) return;
          if (play.solvedGroups.includes(groupOfTile(tileId))) return; // already locked

          let selected = play.selected.includes(tileId)
            ? play.selected.filter((t) => t !== tileId)
            : [...play.selected, tileId];

          if (selected.length < 4) {
            set((st) => ({
              wall: {
                ...st.wall,
                plays: { ...st.wall.plays, [wall]: { ...play, selected } },
              },
            }));
            return;
          }

          // 4th tile chosen — evaluate.
          snapshot();
          const groups = selected.map(groupOfTile);
          const correct =
            groups.every((g) => g === groups[0]) &&
            !play.solvedGroups.includes(groups[0]);

          if (correct) {
            let solvedGroups = [...play.solvedGroups, groups[0]];
            let lives = play.lives;
            // Once two groups are down, the remaining guesses are limited.
            if (solvedGroups.length === 2 && lives === -1 && s.wallLivesRule) {
              lives = 3;
            }
            // Three groups solved → the final four resolve automatically.
            let finished = false;
            if (solvedGroups.length === 3) {
              const last = [0, 1, 2, 3].find((g) => !solvedGroups.includes(g));
              if (last !== undefined) solvedGroups = [...solvedGroups, last];
              finished = true;
            }
            set((st) => ({
              wall: {
                ...st.wall,
                plays: {
                  ...st.wall.plays,
                  [wall]: {
                    ...play,
                    selected: [],
                    solvedGroups,
                    lives,
                    finished,
                  },
                },
              },
              timerRunning: finished ? false : st.timerRunning,
            }));
          } else {
            // wrong guess
            let lives = play.lives;
            let frozen = false;
            let finished = false;
            if (lives > 0) {
              lives -= 1;
              if (lives === 0) {
                frozen = true;
                finished = true;
              }
            }
            set((st) => ({
              wall: {
                ...st.wall,
                plays: {
                  ...st.wall.plays,
                  [wall]: { ...play, wrong: selected, lives, frozen, finished },
                },
              },
              timerRunning: finished ? false : st.timerRunning,
            }));
          }
        },
        clearWallWrong: (wall) =>
          set((s) => {
            const play = s.wall.plays[wall];
            if (!play) return {};
            return {
              wall: {
                ...s.wall,
                plays: {
                  ...s.wall.plays,
                  [wall]: { ...play, wrong: [], selected: [] },
                },
              },
            };
          }),
        freezeWall: (wall) => {
          const play = get().wall.plays[wall];
          if (!play || play.finished) return;
          snapshot();
          set((s) => ({
            wall: {
              ...s.wall,
              plays: {
                ...s.wall.plays,
                [wall]: { ...play, frozen: true, finished: true, selected: [] },
              },
            },
            timerRunning: false,
          }));
        },
        revealConnection: (wall, groupIndex, correct) => {
          snapshot();
          set((s) => {
            const play = s.wall.plays[wall];
            if (!play) return {};
            const connectionsFound = [...(play.connectionsFound ?? [false, false, false, false])];
            const connectionsRevealed = [...(play.connectionsRevealed ?? [false, false, false, false])];
            connectionsFound[groupIndex] = correct;
            connectionsRevealed[groupIndex] = true;
            return {
              wall: {
                ...s.wall,
                plays: {
                  ...s.wall.plays,
                  [wall]: { ...play, connectionsFound, connectionsRevealed },
                },
              },
            };
          });
        },
        applyWallScore: (teamIndex, wall) => {
          snapshot();
          set((s) => {
            const play = s.wall.plays[wall];
            if (!play || play.scored) return {};
            const groupsFound = play.solvedGroups.length;
            const connections = (play.connectionsFound ?? []).filter(Boolean).length;
            const perfect = groupsFound === 4 && connections === 4;
            const total = groupsFound + connections + (perfect ? 2 : 0);
            const teams = [...s.teams] as [Team, Team];
            teams[teamIndex] = {
              ...teams[teamIndex],
              score: teams[teamIndex].score + total,
            };
            return {
              teams,
              wall: {
                ...s.wall,
                stage: 'assign',
                activeTeam: null,
                plays: {
                  ...s.wall.plays,
                  [wall]: { ...play, scored: true },
                },
              },
            };
          });
        },
        setWallLivesRule: (on) => set({ wallLivesRule: on }),

        // ---- round 4: missing vowels ----
        showCategory: (idx) => {
          snapshot();
          set((s) => ({
            r4: {
              ...s.r4,
              catIndex: idx,
              puzzleIndex: 0,
              answerRevealed: false,
              buzzed: null,
            },
            timerRunning: false,
            timerReset: s.timerReset + 1,
          }));
        },
        nextPuzzle: () => {
          snapshot();
          const s = get();
          const game = s.gameSet;
          if (!game) return;
          const cat = game.round4[s.r4.catIndex];
          if (!cat) return;
          const next = s.r4.puzzleIndex + 1;
          if (next >= cat.puzzles.length) return;
          set({
            r4: { ...s.r4, puzzleIndex: next, answerRevealed: false, buzzed: null },
          });
        },
        revealMVAnswer: () => set((s) => ({ r4: { ...s.r4, answerRevealed: true } })),
        buzz: (teamIndex) =>
          set((s) => (s.r4.buzzed === null ? { r4: { ...s.r4, buzzed: teamIndex } } : {})),
        clearBuzz: () => set((s) => ({ r4: { ...s.r4, buzzed: null } })),
        setMVDuration: (sec) => set((s) => ({ r4: { ...s.r4, durationSec: sec } })),

        // ---- undo ----
        undo: () => {
          const s = get();
          if (!s.history.length) return;
          const history = [...s.history];
          const last = history.pop()!;
          const core = JSON.parse(last) as Partial<CoreState>;
          set({ ...core, history, timerRunning: false });
        },
        canUndo: () => get().history.length > 0,
      };
    },
    {
      name: 'only-connect-home',
      // Persist game progress + the loaded set, but not media URLs, timer, or history.
      partialize: (s) => ({
        teams: s.teams,
        phase: s.phase,
        activeTeam: s.activeTeam,
        r1: s.r1,
        r2: s.r2,
        wall: s.wall,
        r4: s.r4,
        wallLivesRule: s.wallLivesRule,
        audioMuted: s.audioMuted,
        gameSet: s.gameSet,
      }),
    }
  )
);

// Ordered hieroglyph list re-exported for convenience.
export const HIEROGLYPH_ORDER = HIEROGLYPHS;
