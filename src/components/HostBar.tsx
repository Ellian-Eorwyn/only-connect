import { Phase, useGame } from '../game/store';
import { MuteButton } from './AudioController';

const ROUNDS: { phase: Phase; label: string }[] = [
  { phase: 'round1', label: 'R1' },
  { phase: 'round2', label: 'R2' },
  { phase: 'round3', label: 'R3' },
  { phase: 'round4', label: 'R4' },
  { phase: 'end', label: 'End' },
];

export function HostBar() {
  const phase = useGame((s) => s.phase);
  const teams = useGame((s) => s.teams);
  const timerRunning = useGame((s) => s.timerRunning);
  const historyLen = useGame((s) => s.history.length);

  const setPhase = useGame((s) => s.setPhase);
  const timerStart = useGame((s) => s.timerStart);
  const timerPause = useGame((s) => s.timerPause);
  const timerRestart = useGame((s) => s.timerRestart);
  const adjustScore = useGame((s) => s.adjustScore);
  const undo = useGame((s) => s.undo);
  const resetAll = useGame((s) => s.resetAll);

  return (
    <div className="oc-hostbar">
      <div className="oc-hostbar-group">
        <span className="oc-hostbar-label">Round</span>
        {ROUNDS.map((r) => (
          <button
            key={r.phase}
            className={'oc-btn oc-btn--pill' + (phase === r.phase ? ' oc-btn--primary' : '')}
            onClick={() => setPhase(r.phase)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="oc-hostbar-group">
        <span className="oc-hostbar-label">Timer</span>
        {timerRunning ? (
          <button className="oc-btn" onClick={timerPause}>
            ⏸ Pause
          </button>
        ) : (
          <button className="oc-btn oc-btn--primary" onClick={timerStart}>
            ▶ Start
          </button>
        )}
        <button className="oc-btn" onClick={timerRestart}>
          ↺ Reset
        </button>
      </div>

      <div className="oc-hostbar-group">
        <span className="oc-hostbar-label">{teams[0].name}</span>
        <button className="oc-btn" onClick={() => adjustScore(0, -1)}>
          −
        </button>
        <button className="oc-btn" onClick={() => adjustScore(0, +1)}>
          +
        </button>
      </div>
      <div className="oc-hostbar-group">
        <span className="oc-hostbar-label">{teams[1].name}</span>
        <button className="oc-btn" onClick={() => adjustScore(1, -1)}>
          −
        </button>
        <button className="oc-btn" onClick={() => adjustScore(1, +1)}>
          +
        </button>
      </div>

      <div className="oc-hostbar-group">
        <MuteButton />
        <button className="oc-btn" onClick={undo} disabled={historyLen === 0} title="Undo (U)">
          ↶ Undo
        </button>
        <button className="oc-btn oc-btn--danger" onClick={() => { if (confirm('Start a new game? Scores and progress will be cleared.')) resetAll(); }}>
          New game
        </button>
      </div>
    </div>
  );
}
