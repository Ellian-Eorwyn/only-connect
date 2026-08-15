import { useRef, useState } from 'react';
import { useGame } from '../game/store';
import { loadWorkbookFile } from '../game/loadWorkbook';
import { buildMediaMap } from '../game/media';
import { EXAMPLE_GAME } from '../game/exampleGame';
import { EXAMPLE_MEDIA } from '../assets/example';
import { LoadWarning } from '../types';
import {
  blankTemplateWorkbook,
  downloadWorkbook,
  gameToWorkbook,
} from '../game/exportWorkbook';
import { HieroglyphIcon } from './Hieroglyphs';
import { MuteButton } from './AudioController';
import { UpdateButton } from './UpdateButton';

export function SetupScreen() {
  const teams = useGame((s) => s.teams);
  const gameSet = useGame((s) => s.gameSet);
  const media = useGame((s) => s.media);
  const loadGame = useGame((s) => s.loadGame);
  const setMedia = useGame((s) => s.setMedia);
  const setTeamName = useGame((s) => s.setTeamName);
  const startGame = useGame((s) => s.startGame);

  const [warnings, setWarnings] = useState<LoadWarning[]>([]);
  const [error, setError] = useState<string | null>(null);
  const xlsxRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<HTMLInputElement>(null);
  const mediaCount = Object.keys(media).length;

  async function onXlsx(file: File) {
    setError(null);
    try {
      const { game, warnings } = await loadWorkbookFile(file);
      loadGame(game);
      setWarnings(warnings);
    } catch (e) {
      setError('Could not read that file. Is it a valid .xlsx workbook?');
      console.error(e);
    }
  }

  function loadExample() {
    setError(null);
    setWarnings([]);
    loadGame(EXAMPLE_GAME);
    setMedia({ ...EXAMPLE_MEDIA });
  }

  const counts = gameSet
    ? `${gameSet.round1.length} connections · ${gameSet.round2.length} sequences · ${gameSet.round3.length} wall(s) · ${gameSet.round4.length} vowel categories`
    : '';

  return (
    <div className="oc-setup">
      <MuteButton className="oc-mute--corner" />
      <div className="oc-logo">
        <div className="oc-logo-eye">
          <HieroglyphIcon name="eye-of-horus" />
        </div>
        <div className="oc-logo-title">ONLY CONNECT</div>
        <div className="oc-logo-sub">Home Game</div>
      </div>

      <div className="oc-panel oc-field">
        <label>1 · Question set</label>
        <div className="oc-row">
          <button className="oc-btn oc-btn--primary oc-btn--lg" onClick={() => xlsxRef.current?.click()}>
            Load question set (.xlsx)
          </button>
          <button className="oc-btn oc-btn--lg" onClick={loadExample}>
            Load example game
          </button>
        </div>
        <input
          ref={xlsxRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && onXlsx(e.target.files[0])}
        />
        {gameSet && (
          <div className="oc-loaded-ok">
            ✓ Loaded: {gameSet.title} <span className="oc-subtle">— {counts}</span>
          </div>
        )}
        {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}
        {warnings.length > 0 && (
          <div className="oc-warnings">
            {warnings.map((w, i) => (
              <div key={i}>
                <b>{w.sheet}:</b> {w.message}
              </div>
            ))}
          </div>
        )}
        <div className="oc-links">
          <button className="oc-link" onClick={() => downloadWorkbook(blankTemplateWorkbook(), 'Only-Connect-Template.xlsx')}>
            ⬇ Download blank template
          </button>
          <button className="oc-link" onClick={() => downloadWorkbook(gameToWorkbook(EXAMPLE_GAME), 'Example-Sinistrals.xlsx')}>
            ⬇ Download example as spreadsheet
          </button>
        </div>
      </div>

      <div className="oc-panel oc-field">
        <label>2 · Media folder (pictures &amp; music) — optional</label>
        <div className="oc-row">
          <button className="oc-btn oc-btn--lg" onClick={() => mediaRef.current?.click()}>
            Load media folder
          </button>
          <div className="oc-subtle" style={{ alignSelf: 'center' }}>
            {mediaCount > 0 ? `${mediaCount} media file(s) loaded` : 'No media loaded'}
          </div>
        </div>
        <input
          ref={mediaRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
          onChange={(e) => e.target.files && e.target.files.length && setMedia(buildMediaMap(e.target.files))}
        />
        <div className="oc-subtle">
          Picture/music clues reference filenames; select the folder that holds them.
          The example game’s media is built in.
        </div>
      </div>

      <div className="oc-panel oc-field">
        <label>3 · Teams</label>
        <div className="oc-row">
          {[0, 1].map((idx) => {
            const i = idx as 0 | 1;
            return (
              <input
                key={i}
                className="oc-input"
                value={teams[i].name}
                onChange={(e) => setTeamName(i, e.target.value)}
                placeholder={`Team ${i + 1} name`}
              />
            );
          })}
        </div>
      </div>

      <button
        className="oc-btn oc-btn--primary oc-btn--lg"
        disabled={!gameSet}
        onClick={startGame}
        style={{ alignSelf: 'center', minWidth: 240 }}
      >
        Start game →
      </button>

      <UpdateButton />
    </div>
  );
}
