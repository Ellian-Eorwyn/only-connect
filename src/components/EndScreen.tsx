import { useGame } from '../game/store';

export function EndScreen() {
  const teams = useGame((s) => s.teams);
  const startGame = useGame((s) => s.startGame);
  const resetAll = useGame((s) => s.resetAll);

  const [a, b] = teams;
  const winner = a.score === b.score ? null : a.score > b.score ? a : b;

  return (
    <div className="oc-end">
      <div className="oc-round-title">Final Scores</div>
      <div className="oc-scoreboard" style={{ width: 'min(680px, 92vw)' }}>
        <div className={'oc-team' + (winner === a ? ' oc-team--active' : '')}>
          <span className="oc-team-name">{a.name}</span>
          <span className="oc-team-score">{a.score}</span>
        </div>
        <div className={'oc-team' + (winner === b ? ' oc-team--active' : '')}>
          <span className="oc-team-name">{b.name}</span>
          <span className="oc-team-score">{b.score}</span>
        </div>
      </div>

      <div className="oc-winner">{winner ? `${winner.name} win!` : "It's a tie!"}</div>

      <div className="oc-row" style={{ justifyContent: 'center' }}>
        <button className="oc-btn oc-btn--lg" onClick={startGame}>
          Play again (same game)
        </button>
        <button className="oc-btn oc-btn--lg oc-btn--primary" onClick={resetAll}>
          New game / new questions
        </button>
      </div>
    </div>
  );
}
