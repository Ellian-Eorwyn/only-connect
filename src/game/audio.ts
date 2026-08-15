import themeSrc from '../assets/audio/theme.m4a';
import round40Src from '../assets/audio/round40.m4a';
import wallSrc from '../assets/audio/wall.m4a';

// Module-level singletons so a single set of <audio> elements is shared across
// re-renders / StrictMode remounts (never duplicated/overlapping).
class Track {
  private el: HTMLAudioElement;
  constructor(src: string, opts: { loop?: boolean; volume?: number } = {}) {
    this.el = new Audio(src);
    this.el.loop = opts.loop ?? false;
    this.el.volume = opts.volume ?? 1;
    this.el.preload = 'auto';
  }
  play() {
    const p = this.el.play();
    if (p && typeof p.catch === 'function') p.catch(() => {}); // ignore autoplay blocks
  }
  playFromStart() {
    try {
      this.el.currentTime = 0;
    } catch {
      /* not seekable yet */
    }
    this.play();
  }
  pause() {
    this.el.pause();
  }
  stop() {
    this.el.pause();
    try {
      this.el.currentTime = 0;
    } catch {
      /* ignore */
    }
  }
  get playing() {
    return !this.el.paused;
  }
  setMuted(m: boolean) {
    this.el.muted = m;
  }
}

export const tracks = {
  theme: new Track(themeSrc, { volume: 0.8 }),
  round40: new Track(round40Src, { volume: 0.7 }),
  wall: new Track(wallSrc, { volume: 0.7 }),
};

export function setAllMuted(muted: boolean) {
  Object.values(tracks).forEach((t) => t.setMuted(muted));
}
