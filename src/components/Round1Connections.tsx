import { HIEROGLYPH_LABEL } from '../types';
import { useGame } from '../game/store';
import { HieroglyphPicker } from './HieroglyphPicker';
import { ClueCell } from './ClueCell';
import { Timer } from './Timer';

const POINTS = [5, 3, 2, 1];

export function Round1Connections() {
  const game = useGame((s) => s.gameSet);
  const rt = useGame((s) => s.r1);
  const activeTeam = useGame((s) => s.activeTeam);
  const teams = useGame((s) => s.teams);
  const timerRunning = useGame((s) => s.timerRunning);
  const timerReset = useGame((s) => s.timerReset);

  const revealNextClue = useGame((s) => s.revealNextClue);
  const revealAnswer = useGame((s) => s.revealAnswer);
  const closeQuestion = useGame((s) => s.closeQuestion);
  const backToPicker = useGame((s) => s.backToPicker);

  if (!game) return null;

  // --- picker view ---
  if (!rt.current) {
    return (
      <>
        <div className="oc-round-title">Round 1 · Connections</div>
        <div className="oc-turn">
          <b>{teams[activeTeam].name}</b> to pick a clue set
        </div>
        <HieroglyphPicker round={1} />
        <div className="oc-kbd">Reveal clues one at a time — 5, 3, 2 or 1 points.</div>
      </>
    );
  }

  const q = game.round1.find((x) => x.hieroglyph === rt.current)!;
  const suggested = POINTS[Math.min(rt.revealed - 1, 3)];
  const other = activeTeam === 0 ? 1 : 0;

  return (
    <>
      <div className="oc-round-title">{HIEROGLYPH_LABEL[q.hieroglyph]}</div>

      <div className="oc-clues oc-clues--4">
        {q.clues.map((clue, i) => (
          <ClueCell
            key={i}
            clue={clue}
            index={i}
            state={i < rt.revealed ? 'shown' : 'hidden'}
            active={!rt.answerRevealed && i === rt.revealed - 1}
          />
        ))}
      </div>

      <Timer durationSec={40} running={timerRunning} resetSignal={timerReset} />

      {rt.answerRevealed && (
        <div className="oc-answer">
          <div className="oc-connection">{q.connection}</div>
          {q.details && <div className="oc-details">{q.details}</div>}
        </div>
      )}

      {/* reveal controls */}
      <div className="oc-row" style={{ justifyContent: 'center', maxWidth: 700 }}>
        <button
          className="oc-btn oc-btn--lg"
          onClick={() => revealNextClue(1)}
          disabled={rt.revealed >= q.clues.length}
        >
          Reveal next clue ({rt.revealed}/{q.clues.length})
        </button>
        <button className="oc-btn oc-btn--lg" onClick={() => revealAnswer(1)} disabled={rt.answerRevealed}>
          Reveal answer
        </button>
      </div>

      {/* scoring */}
      <div className="oc-hostbar-group" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
        <span className="oc-hostbar-label">{teams[activeTeam].name}</span>
        {POINTS.map((p) => (
          <button
            key={p}
            className={'oc-btn oc-btn--score' + (p === suggested ? ' oc-btn--primary' : '')}
            onClick={() => closeQuestion(1, activeTeam, p)}
          >
            {p}
          </button>
        ))}
        <button className="oc-btn" onClick={() => closeQuestion(1, other, 1)}>
          Bonus +1 → {teams[other].name}
        </button>
        <button className="oc-btn" onClick={() => closeQuestion(1, null, 0)}>
          No score
        </button>
        <button className="oc-btn oc-btn--ghost" onClick={() => backToPicker(1)}>
          Back to board
        </button>
      </div>
    </>
  );
}
