import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../game/store';
import { Wall, WallName } from '../types';
import { Timer } from './Timer';

const WALL_LABEL: Record<WallName, string> = { lion: 'Lion', water: 'Water' };
const WALL_SECS = 150; // 2:30

export function Round3Wall() {
  const game = useGame((s) => s.gameSet);
  const wall = useGame((s) => s.wall);

  if (!game || game.round3.length === 0) {
    return (
      <>
        <div className="oc-round-title">Round 3 · The Connecting Wall</div>
        <div className="oc-subtle">No walls found in this question set.</div>
      </>
    );
  }

  if (wall.stage === 'play' && wall.activeTeam !== null) {
    const wallName = wall.assignment[wall.activeTeam] ?? game.round3[wall.activeTeam]?.name;
    const def = game.round3.find((w) => w.name === wallName);
    if (def) return <WallPlayView team={wall.activeTeam} def={def} />;
  }

  // assign / between-walls view
  return <WallAssignView />;
}

function WallAssignView() {
  const game = useGame((s) => s.gameSet)!;
  const wall = useGame((s) => s.wall);
  const teams = useGame((s) => s.teams);
  const assignWall = useGame((s) => s.assignWall);
  const startWallPlay = useGame((s) => s.startWallPlay);

  const names = game.round3.map((w) => w.name);
  const effective = (i: 0 | 1): WallName => wall.assignment[i] ?? names[i] ?? names[0];

  return (
    <>
      <div className="oc-round-title">Round 3 · The Connecting Wall</div>
      <div className="oc-subtle" style={{ textAlign: 'center', maxWidth: 620 }}>
        Each team takes one wall: find four groups of four in 2:30. Unlimited guesses
        until two groups are solved, then just three lives.
      </div>

      <div className="oc-row" style={{ maxWidth: 720 }}>
        {[0, 1].map((idx) => {
          const i = idx as 0 | 1;
          const w = effective(i);
          const play = wall.plays[w];
          const scored = play?.scored;
          return (
            <div key={i} className="oc-panel" style={{ textAlign: 'center' }}>
              <div className="oc-team-name" style={{ marginBottom: 10 }}>
                {teams[i].name}
              </div>
              <div className="oc-hostbar-group" style={{ justifyContent: 'center', marginBottom: 12 }}>
                {names.map((n) => (
                  <button
                    key={n}
                    className={'oc-btn' + (w === n ? ' oc-btn--primary' : '')}
                    disabled={scored}
                    onClick={() => assignWall(i, n)}
                  >
                    {WALL_LABEL[n]}
                  </button>
                ))}
              </div>
              {scored ? (
                <div className="oc-loaded-ok">✓ Wall played &amp; scored</div>
              ) : (
                <button
                  className="oc-btn oc-btn--primary oc-btn--lg"
                  onClick={() => {
                    if (!wall.assignment[i]) assignWall(i, w);
                    startWallPlay(i);
                  }}
                >
                  {play && (play.solvedGroups.length || play.frozen) ? 'Resume' : 'Start'} {WALL_LABEL[w]} wall
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function WallPlayView({ team, def }: { team: 0 | 1; def: Wall }) {
  const play = useGame((s) => s.wall.plays[def.name])!;
  const teams = useGame((s) => s.teams);
  const timerRunning = useGame((s) => s.timerRunning);
  const timerReset = useGame((s) => s.timerReset);
  const toggleTile = useGame((s) => s.toggleTile);
  const clearWallWrong = useGame((s) => s.clearWallWrong);
  const freezeWall = useGame((s) => s.freezeWall);

  // Clear the red "wrong" flash after a beat.
  useEffect(() => {
    if (play.wrong.length) {
      const t = setTimeout(() => clearWallWrong(def.name), 650);
      return () => clearTimeout(t);
    }
  }, [play.wrong, def.name, clearWallWrong]);

  const tileText = (id: number) => def.groups[Math.floor(id / 4)].items[id % 4];
  const groupOf = (id: number) => Math.floor(id / 4);

  const solvedRows = play.solvedGroups;
  const solvedIds = solvedRows.flatMap((g) => [0, 1, 2, 3].map((i) => g * 4 + i));
  const unsolvedIds = play.order.filter((id) => !solvedRows.includes(groupOf(id)));
  const displayIds = [...solvedIds, ...unsolvedIds];

  if (play.finished) return <WallScoreView team={team} def={def} />;

  return (
    <div className="oc-wall-wrap">
      <div className="oc-round-title">
        {teams[team].name} · {WALL_LABEL[def.name]} Wall
      </div>

      <div className="oc-wall">
        {displayIds.map((id) => {
          const g = groupOf(id);
          const solvedIdx = solvedRows.indexOf(g);
          const solved = solvedIdx >= 0;
          const selected = play.selected.includes(id);
          const wrong = play.wrong.includes(id);
          const cls =
            'oc-tile' +
            (solved ? ` oc-tile--solved oc-tile--g${solvedIdx}` : '') +
            (selected ? ' oc-tile--selected' : '') +
            (wrong ? ' oc-tile--wrong' : '');
          return (
            <motion.button
              key={id}
              layout
              transition={{ type: 'spring', stiffness: 520, damping: 40 }}
              className={cls}
              onClick={() => toggleTile(def.name, id)}
              disabled={solved || play.frozen}
            >
              {tileText(id)}
            </motion.button>
          );
        })}
      </div>

      <div className="oc-wall-status">
        <Lives lives={play.lives} groupsFound={solvedRows.length} />
        <button className="oc-btn oc-btn--ghost" onClick={() => freezeWall(def.name)}>
          Give up / time&apos;s up
        </button>
      </div>

      <Timer
        durationSec={WALL_SECS}
        running={timerRunning}
        resetSignal={timerReset}
        onExpire={() => freezeWall(def.name)}
      />
    </div>
  );
}

function Lives({ lives, groupsFound }: { lives: number; groupsFound: number }) {
  if (lives < 0) {
    return (
      <div className="oc-lives oc-subtle">
        {groupsFound}/2 groups — unlimited guesses
      </div>
    );
  }
  return (
    <div className="oc-lives">
      <span className="oc-subtle" style={{ marginRight: 4 }}>
        Lives
      </span>
      {[0, 1, 2].map((i) => (
        <span key={i} className={'oc-life' + (i >= lives ? ' oc-life--lost' : '')} />
      ))}
    </div>
  );
}

function WallScoreView({ team, def }: { team: 0 | 1; def: Wall }) {
  const play = useGame((s) => s.wall.plays[def.name])!;
  const teams = useGame((s) => s.teams);
  const revealConnection = useGame((s) => s.revealConnection);
  const applyWallScore = useGame((s) => s.applyWallScore);

  const found = play.connectionsFound ?? [false, false, false, false];
  const revealed = play.connectionsRevealed ?? [false, false, false, false];
  const groupsFound = play.solvedGroups.length;
  const connections = found.filter(Boolean).length;
  const perfect = groupsFound === 4 && connections === 4;
  const total = groupsFound + connections + (perfect ? 2 : 0);
  const allAdjudicated = revealed.every(Boolean);

  return (
    <div className="oc-wall-wrap">
      <div className="oc-round-title">
        {teams[team].name} · {WALL_LABEL[def.name]} Wall — Scoring
      </div>
      <div className="oc-subtle" style={{ textAlign: 'center', maxWidth: 640 }}>
        {play.frozen ? 'Wall frozen.' : 'Wall resolved!'} Groups found: <b>{groupsFound}/4</b>. The
        team names each group&apos;s connection — press ✓ or ✗ to reveal it and award the point.
      </div>

      <div className="oc-wall-groups">
        {def.groups.map((grp, gi) => {
          const wasFound = play.solvedGroups.includes(gi);
          const rowColor = wasFound ? play.solvedGroups.indexOf(gi) : gi;
          const isRevealed = revealed[gi];
          const isCorrect = found[gi];
          return (
            <div key={gi} className={`oc-wall-grouprow oc-tile--g${rowColor}`}>
              <span className="items">{grp.items.join(' · ')}</span>
              <span className="conn">
                {isRevealed ? grp.connection : <span style={{ opacity: 0.65 }}>connection hidden</span>}
              </span>
              <span style={{ display: 'flex', gap: 6 }}>
                <button
                  className={'oc-btn oc-btn--score' + (isRevealed && isCorrect ? ' oc-btn--primary' : '')}
                  title="Named correctly — reveal & +1"
                  onClick={() => revealConnection(def.name, gi, true)}
                >
                  ✓
                </button>
                <button
                  className={'oc-btn oc-btn--score' + (isRevealed && !isCorrect ? ' oc-btn--danger' : '')}
                  title="Not named — reveal, no point"
                  onClick={() => revealConnection(def.name, gi, false)}
                >
                  ✗
                </button>
              </span>
            </div>
          );
        })}
      </div>

      <div className="oc-answer">
        <div className="oc-connection">
          {total} point{total === 1 ? '' : 's'}
        </div>
        <div className="oc-details">
          {groupsFound} group{groupsFound === 1 ? '' : 's'} + {connections} connection
          {connections === 1 ? '' : 's'}
          {perfect ? ' + 2 perfect-wall bonus' : ''}
        </div>
      </div>

      <button
        className="oc-btn oc-btn--primary oc-btn--lg"
        disabled={play.scored}
        onClick={() => applyWallScore(team, def.name)}
        title={allAdjudicated ? '' : 'Tip: reveal all four connections first'}
      >
        {play.scored ? 'Scored ✓' : `Add ${total} to ${teams[team].name}`}
      </button>
    </div>
  );
}
