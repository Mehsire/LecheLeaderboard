export interface BoardEntry {
  name: string;
  score: number;
  display?: string;
}

export interface Board {
  title: string;
  unit?: string;
  entries: BoardEntry[];
}

export interface OverlayOptions {
  src: string | null;
  rows: string | null;
  name: string | null;
  title: string | null;
  unit: string | null;
  limit: number | null;
  refresh: number | null;
  theme: 'dark' | 'light';
  accent: string | null;
  help: boolean;
  preview: boolean;
}

export function parseOverlayOptions(params: URLSearchParams): OverlayOptions {
  const theme = params.get('theme') === 'light' ? 'light' : 'dark';
  const limitRaw = Number(params.get('limit'));
  const refreshRaw = Number(params.get('refresh'));
  const refresh = params.has('refresh')
    ? Number.isFinite(refreshRaw) && refreshRaw > 0
      ? refreshRaw
      : null
    : 30;

  return {
    src: params.get('src'),
    rows: params.get('rows'),
    name: params.get('name')?.trim() || null,
    title: params.get('title'),
    unit: params.get('unit'),
    limit: Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : null,
    refresh,
    theme,
    accent: params.get('accent'),
    help: params.get('help') === '1' || params.get('help') === 'true',
    preview: params.get('preview') === '1' || params.get('preview') === 'true',
  };
}

/** Parses `Alice:120,Bob:90` (or `Alice=120|Bob=90`) into ranked entries. */
export function parseRows(rows: string): BoardEntry[] {
  return rows
    .split(/[|,]/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [name, scoreRaw] = chunk.split(/[:=]/).map((part) => part.trim());
      const score = Number(scoreRaw);
      return { name, score };
    })
    .filter((entry) => entry.name && Number.isFinite(entry.score));
}

export function rankBoard(board: Board, options: OverlayOptions): Board {
  const sorted = [...board.entries].sort((a, b) => b.score - a.score);
  const limited = options.limit ? sorted.slice(0, options.limit) : sorted;

  return {
    title: options.title?.trim() || board.title,
    unit: options.unit?.trim() || board.unit,
    entries: limited,
  };
}

export function formatScore(entry: BoardEntry, unit?: string): string {
  const value = entry.display ?? entry.score.toLocaleString();
  return unit && !entry.display ? `${value} ${unit}` : value;
}
