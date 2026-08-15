import { useEffect } from 'react';
import { useGame } from './game/store';
import { Background } from './components/Background';
import { Scoreboard } from './components/Scoreboard';
import { HostBar } from './components/HostBar';
import { SetupScreen } from './components/SetupScreen';
import { Round1Connections } from './components/Round1Connections';
import { Round2Sequences } from './components/Round2Sequences';
import { Round3Wall } from './components/Round3Wall';
import { Round4MissingVowels } from './components/Round4MissingVowels';
import { EndScreen } from './components/EndScreen';
import { AudioController } from './components/AudioController';

export default function App() {
  const phase = useGame((s) => s.phase);

  // Host keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      const st = useGame.getState();
      if (st.phase === 'setup') return;
      const k = e.key.toLowerCase();

      if (k === 'u') {
        st.undo();
        e.preventDefault();
        return;
      }
      if (st.phase === 'round1' || st.phase === 'round2') {
        const round = st.phase === 'round1' ? 1 : 2;
        const rt = round === 1 ? st.r1 : st.r2;
        if (e.key === ' ' && rt.current) {
          st.revealNextClue(round);
          e.preventDefault();
        } else if (e.key === 'Enter' && rt.current) {
          st.revealAnswer(round);
        }
      } else if (st.phase === 'round4') {
        if (k === 'a') {
          st.buzz(0);
          e.preventDefault();
        } else if (k === 'l') {
          st.buzz(1);
          e.preventDefault();
        } else if (e.key === ' ') {
          st.nextPuzzle();
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (phase === 'setup') {
    return (
      <>
        <Background />
        <AudioController />
        <div className="oc-app">
          <div className="oc-stage">
            <SetupScreen />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Background />
      <AudioController />
      <div className="oc-app">
        <Scoreboard />
        <div className="oc-stage">
          {phase === 'round1' && <Round1Connections />}
          {phase === 'round2' && <Round2Sequences />}
          {phase === 'round3' && <Round3Wall />}
          {phase === 'round4' && <Round4MissingVowels />}
          {phase === 'end' && <EndScreen />}
        </div>
        <HostBar />
      </div>
    </>
  );
}
