// Maps clue media filenames (from the spreadsheet) to in-browser object URLs.
//
// Media is loaded at runtime from a folder the user selects; nothing is
// uploaded anywhere. Object URLs live for the browser session only, so after a
// page refresh the user re-selects the folder (game progress itself persists).

export type MediaMap = Record<string, string>;

function basename(name: string): string {
  return name.split('/').pop()!.split('\\').pop()!.toLowerCase().trim();
}

/** Build a { filename -> objectURL } map from a picked folder / file list. */
export function buildMediaMap(files: FileList | File[]): MediaMap {
  const map: MediaMap = {};
  for (const f of Array.from(files)) {
    const url = URL.createObjectURL(f);
    map[basename(f.name)] = url;
    // Also key by the relative path (webkitRelativePath) when present.
    const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath;
    if (rel) map[rel.toLowerCase()] = url;
  }
  return map;
}

/** Resolve a spreadsheet filename to an object URL, tolerant of path/case. */
export function resolveMedia(map: MediaMap, filename: string): string | null {
  if (!filename) return null;
  const key = basename(filename);
  return map[key] ?? map[filename.toLowerCase().trim()] ?? null;
}

/** Free all object URLs (call before replacing the map). */
export function revokeMediaMap(map: MediaMap): void {
  for (const url of Object.values(map)) URL.revokeObjectURL(url);
}
