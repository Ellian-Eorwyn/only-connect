import { useEffect, useRef, useState } from 'react';

interface TimerProps {
  durationSec: number;
  running: boolean;
  /** Change this value to reset the countdown to full. */
  resetSignal: number;
  onExpire?: () => void;
}

/**
 * Countdown bar. The remaining time is always computed from an absolute
 * end-timestamp, and it's driven by setInterval (not requestAnimationFrame) so
 * it keeps ticking even when the browser tab isn't focused/visible — and it
 * re-syncs instantly when the tab comes back. Pause/resume is exact.
 */
export function Timer({ durationSec, running, resetSignal, onExpire }: TimerProps) {
  const total = durationSec * 1000;
  const [remaining, setRemaining] = useState(total);
  const endAtRef = useRef<number | null>(null); // absolute time (ms) it hits zero
  const remainingRef = useRef(total); // frozen remaining while paused
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // Reset to full whenever the signal or duration changes.
  useEffect(() => {
    remainingRef.current = total;
    endAtRef.current = null;
    setRemaining(total);
    expiredRef.current = false;
  }, [resetSignal, total]);

  useEffect(() => {
    if (!running) return;

    // Resume from whatever time was left.
    endAtRef.current = performance.now() + remainingRef.current;
    expiredRef.current = false;

    const update = () => {
      if (endAtRef.current == null) return;
      const r = Math.max(0, endAtRef.current - performance.now());
      remainingRef.current = r;
      setRemaining(r);
      if (r <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current?.();
      }
    };

    update();
    const id = setInterval(update, 200);
    // Snap to the correct value the moment the tab becomes visible again.
    const onVisible = () => !document.hidden && update();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      // Freeze the remaining time on pause / unmount.
      if (endAtRef.current != null) {
        remainingRef.current = Math.max(0, endAtRef.current - performance.now());
        endAtRef.current = null;
      }
    };
  }, [running, resetSignal, total]);

  const pct = total > 0 ? (remaining / total) * 100 : 0;
  const secs = Math.ceil(remaining / 1000);
  const low = pct <= 25;

  return (
    <div className="oc-timer">
      <div className="oc-timer-bar">
        <div
          className={'oc-timer-fill' + (low ? ' oc-timer-fill--low' : '')}
          style={{ width: pct + '%' }}
        />
      </div>
      <div className="oc-timer-num">
        {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}
      </div>
    </div>
  );
}
