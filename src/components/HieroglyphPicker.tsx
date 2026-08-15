import { HIEROGLYPHS, HIEROGLYPH_LABEL } from '../types';
import { useGame } from '../game/store';
import { HieroglyphIcon } from './Hieroglyphs';

// The six-question selector. Used questions are dimmed + ticked; the open one
// glows teal — mirroring how the show marks completed vs. current picks.
export function HieroglyphPicker({ round }: { round: 1 | 2 }) {
  const rt = useGame((s) => (round === 1 ? s.r1 : s.r2));
  const game = useGame((s) => s.gameSet);
  const pick = useGame((s) => s.pickHieroglyph);
  if (!game) return null;

  const questions = round === 1 ? game.round1 : game.round2;
  const has = (h: string) => questions.some((q) => q.hieroglyph === h);

  return (
    <div className="oc-hieroglyphs">
      {HIEROGLYPHS.map((h) => {
        const used = rt.used[h];
        const active = rt.current === h;
        const exists = has(h);
        return (
          <button
            key={h}
            className={
              'oc-hiero' +
              (active ? ' oc-hiero--active' : '') +
              (used ? ' oc-hiero--used' : '')
            }
            disabled={used || !exists}
            onClick={() => pick(round, h)}
            title={exists ? HIEROGLYPH_LABEL[h] : 'No question for this symbol'}
          >
            <HieroglyphIcon name={h} />
            <span className="oc-hiero-name">{HIEROGLYPH_LABEL[h]}</span>
          </button>
        );
      })}
    </div>
  );
}
