import { useEffect } from 'react';
import { useGame } from '../game/store';
import { tracks, setAllMuted } from '../game/audio';

/**
 * Drives the three music tracks from game state:
 *  - Theme tune: on the setup screen (with a first-interaction fallback for
 *    browsers that block autoplay).
 *  - 40s round theme: while a Connections/Sequences timer is running; stops the
 *    moment it's paused or a score is given.
 *  - Wall music: while the wall timer OR the Missing Vowels timer is running;
 *    pauses when the timer pauses, and stops once the wall is complete (before
 *    connections are guessed) or the round is left.
 */
export function AudioController() {
  const phase = useGame((s) => s.phase);
  const timerRunning = useGame((s) => s.timerRunning);
  const wall = useGame((s) => s.wall);
  const muted = useGame((s) => s.audioMuted);

  // Mute all tracks together.
  useEffect(() => {
    setAllMuted(muted);
  }, [muted]);

  // Theme tune on setup.
  useEffect(() => {
    if (phase !== 'setup') {
      tracks.theme.stop();
      return;
    }
    tracks.theme.playFromStart(); // may be blocked by autoplay policy
    const kick = () => {
      if (!tracks.theme.playing) tracks.theme.play();
    };
    window.addEventListener('pointerdown', kick);
    window.addEventListener('keydown', kick);
    return () => {
      window.removeEventListener('pointerdown', kick);
      window.removeEventListener('keydown', kick);
      tracks.theme.stop();
    };
  }, [phase]);

  // 40s round theme (Connections / Sequences).
  useEffect(() => {
    const shouldPlay = (phase === 'round1' || phase === 'round2') && timerRunning;
    if (shouldPlay) {
      if (!tracks.round40.playing) tracks.round40.playFromStart();
    } else {
      tracks.round40.stop();
    }
  }, [phase, timerRunning]);

  // Wall music — used for both the Connecting Wall and the Missing Vowels round.
  useEffect(() => {
    const activeWall =
      wall.activeTeam != null ? wall.assignment[wall.activeTeam] ?? null : null;
    const play = activeWall ? wall.plays[activeWall] : null;
    const inWallPlay = phase === 'round3' && wall.stage === 'play' && !!play && !play.finished;
    const inVowels = phase === 'round4';
    const active = inWallPlay || inVowels;

    if (active && timerRunning) {
      if (!tracks.wall.playing) tracks.wall.play(); // start / resume
    } else if (active && !timerRunning) {
      tracks.wall.pause(); // paused → hold position
    } else {
      tracks.wall.stop(); // finished / left → reset
    }
  }, [phase, timerRunning, wall]);

  return null;
}

export function MuteButton({ className }: { className?: string }) {
  const muted = useGame((s) => s.audioMuted);
  const toggle = useGame((s) => s.toggleMute);
  return (
    <button
      className={'oc-btn oc-mute ' + (className ?? '')}
      onClick={toggle}
      title={muted ? 'Unmute' : 'Mute'}
      aria-label={muted ? 'Unmute' : 'Mute'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
