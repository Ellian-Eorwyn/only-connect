import { resolveMedia } from '../game/media';
import { useGame } from '../game/store';

export function MusicClue({ file, index }: { file: string; index: number }) {
  const media = useGame((s) => s.media);
  const url = resolveMedia(media, file);
  return (
    <div className="oc-music">
      <div className="oc-music-icon" aria-hidden>
        ♪
      </div>
      <div>Clue {index + 1}</div>
      {url ? (
        <audio controls src={url} preload="none" />
      ) : (
        <div className="oc-media-missing">audio not loaded — reload media folder</div>
      )}
    </div>
  );
}
