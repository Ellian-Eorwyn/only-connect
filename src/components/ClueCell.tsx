import { Clue } from '../types';
import { resolveMedia } from '../game/media';
import { useGame } from '../game/store';
import { MusicClue } from './MusicClue';

type CellState = 'shown' | 'hidden' | 'mystery';

export function ClueCell({
  clue,
  index,
  state,
  active,
  seq,
}: {
  clue?: Clue;
  index: number;
  state: CellState;
  active?: boolean;
  seq?: boolean;
}) {
  const media = useGame((s) => s.media);
  const base = 'oc-clue' + (seq ? ' oc-clue--seq' : '');

  if (state === 'hidden') {
    return <div className={base + ' oc-clue--hidden'}>Clue {index + 1}</div>;
  }
  if (state === 'mystery' || !clue) {
    return <div className={base + ' oc-clue--mystery'}>?</div>;
  }

  const activeCls = active ? ' oc-clue--active' : '';

  if (clue.media === 'picture') {
    const url = resolveMedia(media, clue.value);
    return (
      <div className={base + ' oc-clue--picture' + activeCls}>
        <span className="oc-clue-index">{index + 1}</span>
        {url ? (
          <img src={url} alt={`Clue ${index + 1}`} />
        ) : (
          <span className="oc-media-missing">image not loaded — reload media folder</span>
        )}
      </div>
    );
  }

  if (clue.media === 'music') {
    return (
      <div className={base + ' oc-clue--music' + activeCls}>
        <MusicClue file={clue.value} index={index} />
      </div>
    );
  }

  return (
    <div className={base + activeCls}>
      <span className="oc-clue-index">{index + 1}</span>
      {clue.value}
    </div>
  );
}
