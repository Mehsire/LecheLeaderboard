import { EventScoreboard, PlayerScore, TeamScore } from './event-data';

interface GvizCell {
  v?: string | number | null;
  f?: string;
}

interface GvizTable {
  cols: { id: string }[];
  rows: { c: Array<GvizCell | null> }[];
}

export interface GvizResponse {
  status?: string;
  table?: GvizTable;
}

const COL = {
  rank: 'AD',
  teamName: 'AE',
  teamTotal: 'AF',
  player1: 'AG',
  p1Total: 'AH',
  player2: 'AI',
  p2Total: 'AJ',
  player3: 'AK',
  p3Total: 'AL',
} as const;

export function parseScoreboard(response: GvizResponse): EventScoreboard {
  const table = requireTable(response);
  const index = columnMap(table);

  const teams = table.rows
    .map((row, rowIndex) => parseTeamRow(row, index, rowIndex + 1))
    .filter((team): team is TeamScore => team !== null);

  return { teams: sortTeamsById(teams) };
}

export function parseTeamSummaries(response: GvizResponse): TeamScore[] {
  const table = requireTable(response);
  const index = columnMap(table);
  const teams: TeamScore[] = [];

  table.rows.forEach((row, rowIndex) => {
    const team = parseTeamRow(row, index, rowIndex + 1, { requirePlayers: false });
    if (team) {
      teams.push(team);
    }
  });

  return teams;
}

/**
 * Join scoreboard player rows with summary rows by team name.
 * Summary row order defines stable OBS ids for `/team/1` … `/team/4`.
 */
export function mergeScoreboardAndSummaries(
  scoreboard: EventScoreboard,
  summaries: TeamScore[],
): EventScoreboard {
  const boardByName = new Map(
    scoreboard.teams.map((team) => [normalizeTeamName(team.name), team]),
  );
  const teams: TeamScore[] = [];

  for (const summary of summaries) {
    const key = normalizeTeamName(summary.name);
    const board = boardByName.get(key);
    if (board) {
      boardByName.delete(key);
    }

    const rank = nonEmpty(summary.rank) || board?.rank || '';
    teams.push({
      id: summary.id,
      rank,
      name: summary.name || board?.name || '',
      total: Number.isFinite(summary.total) ? summary.total : (board?.total ?? 0),
      totalDisplay: summary.totalDisplay ?? board?.totalDisplay,
      players: board?.players ?? [],
    });
  }

  let nextId = summaries.length > 0 ? Math.max(...summaries.map((team) => team.id)) + 1 : 1;
  for (const board of boardByName.values()) {
    teams.push({ ...board, id: nextId++ });
  }

  return { teams: sortTeamsById(teams) };
}

function parseTeamRow(
  row: { c: Array<GvizCell | null> },
  index: ColumnIndex,
  slotId: number,
  options: { requirePlayers?: boolean } = {},
): TeamScore | null {
  const requirePlayers = options.requirePlayers !== false;
  const name = text(row, index.teamName);
  if (!name) {
    return null;
  }

  const totalCell = cell(row, index.teamTotal);
  const total = number(totalCell);
  if (!Number.isFinite(total)) {
    return null;
  }

  const players: PlayerScore[] = [
    player(row, index.player1, index.p1Total),
    player(row, index.player2, index.p2Total),
    player(row, index.player3, index.p3Total),
  ].filter((entry): entry is PlayerScore => entry !== null);

  if (requirePlayers && !players.length) {
    return null;
  }

  return {
    id: slotId,
    rank: text(row, index.rank),
    name,
    total,
    totalDisplay: totalCell?.f ?? undefined,
    players,
  };
}

function player(
  row: { c: Array<GvizCell | null> },
  nameIndex: number,
  totalIndex: number,
): PlayerScore | null {
  const name = text(row, nameIndex);
  const totalCell = cell(row, totalIndex);
  const total = number(totalCell);
  if (!name || !Number.isFinite(total)) {
    return null;
  }
  return { name, total, display: totalCell?.f ?? undefined };
}

function normalizeTeamName(name: string): string {
  return name.trim().toLowerCase();
}

function nonEmpty(value: string | undefined): string {
  return value?.trim() ?? '';
}

function sortTeamsById(teams: TeamScore[]): TeamScore[] {
  return [...teams].sort((a, b) => a.id - b.id);
}

interface ColumnIndex {
  rank: number;
  teamName: number;
  teamTotal: number;
  player1: number;
  p1Total: number;
  player2: number;
  p2Total: number;
  player3: number;
  p3Total: number;
}

function columnMap(table: GvizTable): ColumnIndex {
  const find = (id: string, fallback: number) => {
    const index = table.cols.findIndex((col) => col.id === id);
    return index >= 0 ? index : fallback;
  };

  return {
    rank: find(COL.rank, 0),
    teamName: find(COL.teamName, 1),
    teamTotal: find(COL.teamTotal, 2),
    player1: find(COL.player1, 3),
    p1Total: find(COL.p1Total, 4),
    player2: find(COL.player2, 5),
    p2Total: find(COL.p2Total, 6),
    player3: find(COL.player3, 7),
    p3Total: find(COL.p3Total, 8),
  };
}

function requireTable(response: GvizResponse): GvizTable {
  if (response.status && response.status !== 'ok') {
    throw new Error('Google Sheet query failed.');
  }
  if (!response.table) {
    throw new Error('Google Sheet returned no table.');
  }
  return response.table;
}

function cell(row: { c: Array<GvizCell | null> }, index: number): GvizCell | null {
  return row.c[index] ?? null;
}

function text(row: { c: Array<GvizCell | null> }, index: number): string {
  return String(cell(row, index)?.v ?? '').trim();
}

function number(value: GvizCell | null): number {
  return Number(value?.v);
}
