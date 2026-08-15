import { useGame } from '../game/store';

const ROUND_LABEL: Record<string, string> = {
  setup: 'Setup',
  round1: 'Round 1 · Connections',
  round2: 'Round 2 · Sequences',
  round3: 'Round 3 · The Wall',
  round4: 'Round 4 · Missing Vowels',
  end: 'Final Scores',
};

export function Scoreboard() {
  const teams = useGame((s) => s.teams);
  const phase = useGame((s) => s.phase);
  const activeTeam = useGame((s) => s.activeTeam);
  const wallActive = useGame((s) => s.wall.activeTeam);

  // Which team is "on the buzzer" for the current round.
  let highlight: number | null = null;
  if (phase === 'round1' || phase === 'round2') highlight = activeTeam;
  else if (phase === 'round3') highlight = wallActive;

  return (
    <div className="oc-scoreboard">
      <Team name={teams[0].name} score={teams[0].score} active={highlight === 0} />
      <div className="oc-round-badge">{ROUND_LABEL[phase] ?? phase}</div>
      <Team name={teams[1].name} score={teams[1].score} active={highlight === 1} right />
    </div>
  );
}

function Team({
  name,
  score,
  active,
  right,
}: {
  name: string;
  score: number;
  active: boolean;
  right?: boolean;
}) {
  return (
    <div className={'oc-team' + (active ? ' oc-team--active' : '')}>
      {right ? (
        <>
          <span className="oc-team-score">{score}</span>
          <span className="oc-team-name">{name}</span>
        </>
      ) : (
        <>
          <span className="oc-team-name">{name}</span>
          <span className="oc-team-score">{score}</span>
        </>
      )}
    </div>
  );
}
