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
    .map((row) => parseTeamRow(row, index))
    .filter((team): team is TeamScore => team !== null);

  return { teams: sortTeamsById(teams) };
}

export function parseTeamSummaries(response: GvizResponse): TeamScore[] {
  const table = requireTable(response);
  const index = columnMap(table);
  const teams: TeamScore[] = [];

  for (const row of table.rows) {
    const name = text(row, index.teamName);
    const id = teamIdFromName(name);
    if (!id) {
      continue;
    }

    const totalCell = cell(row, index.teamTotal);
    const total = number(totalCell);
    if (!Number.isFinite(total)) {
      continue;
    }

    teams.push({
      id,
      rank: text(row, index.rank),
      name,
      total,
      totalDisplay: totalCell?.f ?? undefined,
      players: [],
    });
  }

  return teams;
}

export function mergeScoreboardAndSummaries(
  scoreboard: EventScoreboard,
  summaries: TeamScore[],
): EventScoreboard {
  const summaryById = new Map(summaries.map((team) => [team.id, team]));

  const teams = scoreboard.teams.map((team) => {
    const summary = summaryById.get(team.id);
    if (!summary) {
      return team;
    }
    return {
      ...team,
      rank: summary.rank || team.rank,
      total: summary.total,
      totalDisplay: summary.totalDisplay ?? team.totalDisplay,
    };
  });

  for (const summary of summaries) {
    if (!teams.some((team) => team.id === summary.id)) {
      teams.push(summary);
    }
  }

  return { teams: sortTeamsById(teams) };
}

function parseTeamRow(
  row: { c: Array<GvizCell | null> },
  index: ColumnIndex,
): TeamScore | null {
  const name = text(row, index.teamName);
  const id = teamIdFromName(name);
  if (!id) {
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

  if (!players.length) {
    return null;
  }

  return {
    id,
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

function teamIdFromName(name: string): number | null {
  const match = /^Team\s+(\d+)$/i.exec(name.trim());
  return match ? Number(match[1]) : null;
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
