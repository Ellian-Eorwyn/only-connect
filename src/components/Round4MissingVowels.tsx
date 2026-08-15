import { useGame } from '../game/store';
import { Timer } from './Timer';

export function Round4MissingVowels() {
  const game = useGame((s) => s.gameSet);
  const r4 = useGame((s) => s.r4);
  const teams = useGame((s) => s.teams);
  const timerRunning = useGame((s) => s.timerRunning);
  const timerReset = useGame((s) => s.timerReset);

  const showCategory = useGame((s) => s.showCategory);
  const nextPuzzle = useGame((s) => s.nextPuzzle);
  const revealMVAnswer = useGame((s) => s.revealMVAnswer);
  const buzz = useGame((s) => s.buzz);
  const clearBuzz = useGame((s) => s.clearBuzz);
  const adjustScore = useGame((s) => s.adjustScore);
  const setMVDuration = useGame((s) => s.setMVDuration);

  if (!game || game.round4.length === 0) {
    return (
      <>
        <div className="oc-round-title">Round 4 · Missing Vowels</div>
        <div className="oc-subtle">No Missing Vowels categories in this question set.</div>
      </>
    );
  }

  // ---- category list ----
  if (r4.catIndex < 0 || r4.catIndex >= game.round4.length) {
    return (
      <>
        <div className="oc-round-title">Round 4 · Missing Vowels</div>
        <div className="oc-subtle">Pick a category to begin. Teams buzz in — keys{' '}
          <span className="oc-kbd"><b>A</b></span> and <span className="oc-kbd"><b>L</b></span>.
        </div>
        <div className="oc-hostbar-group">
          <span className="oc-hostbar-label">Round timer</span>
          {[90, 120, 150, 180].map((s) => (
            <button
              key={s}
              className={'oc-btn' + (r4.durationSec === s ? ' oc-btn--primary' : '')}
              onClick={() => setMVDuration(s)}
            >
              {s}s
            </button>
          ))}
        </div>
        <div className="oc-row" style={{ maxWidth: 760, flexDirection: 'column' }}>
          {game.round4.map((c, i) => (
            <button key={i} className="oc-btn oc-btn--lg" onClick={() => showCategory(i)}>
              {c.title} <span className="oc-subtle">({c.puzzles.length})</span>
            </button>
          ))}
        </div>
      </>
    );
  }

  const cat = game.round4[r4.catIndex];
  const puzzle = cat.puzzles[r4.puzzleIndex];
  const last = r4.puzzleIndex >= cat.puzzles.length - 1;
  const hasNextCat = r4.catIndex < game.round4.length - 1;

  return (
    <div className="oc-mv">
      <div className="oc-mv-category">{cat.title}</div>

      <div className="oc-mv-display">{puzzle?.display}</div>
      {r4.answerRevealed && <div className="oc-mv-answer">{puzzle?.answer}</div>}

      <Timer durationSec={r4.durationSec} running={timerRunning} resetSignal={timerReset} />

      {/* buzzers */}
      <div className="oc-buzzers">
        {[0, 1].map((idx) => {
          const i = idx as 0 | 1;
          return (
            <button
              key={i}
              className={'oc-buzzer' + (r4.buzzed === i ? ' oc-buzzer--armed' : '')}
              onClick={() => buzz(i)}
            >
              {teams[i].name}
              {r4.buzzed === i ? ' — BUZZ!' : ''}
            </button>
          );
        })}
      </div>

      {/* adjudication */}
      {r4.buzzed !== null && (
        <div className="oc-hostbar-group">
          <span className="oc-hostbar-label">{teams[r4.buzzed].name} buzzed</span>
          <button
            className="oc-btn oc-btn--primary"
            onClick={() => {
              adjustScore(r4.buzzed!, +1);
              revealMVAnswer();
              clearBuzz();
            }}
          >
            ✓ Correct +1
          </button>
          <button
            className="oc-btn oc-btn--danger"
            onClick={() => {
              adjustScore(r4.buzzed!, -1);
              clearBuzz();
            }}
          >
            ✗ Wrong −1
          </button>
          <button className="oc-btn oc-btn--ghost" onClick={clearBuzz}>
            Clear
          </button>
        </div>
      )}

      {/* navigation */}
      <div className="oc-hostbar-group">
        <button className="oc-btn" onClick={revealMVAnswer} disabled={r4.answerRevealed}>
          Reveal answer
        </button>
        <button className="oc-btn oc-btn--primary" onClick={nextPuzzle} disabled={last}>
          Next puzzle ({r4.puzzleIndex + 1}/{cat.puzzles.length})
        </button>
        {last && hasNextCat && (
          <button className="oc-btn oc-btn--primary" onClick={() => showCategory(r4.catIndex + 1)}>
            Next category →
          </button>
        )}
        <button className="oc-btn oc-btn--ghost" onClick={() => showCategory(-1)}>
          Back to categories
        </button>
      </div>
    </div>
  );
}
