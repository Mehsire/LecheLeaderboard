import { Board, BoardEntry } from './board';
import { SPENDING_SHEET } from './sheet';

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

export function entriesFromGviz(response: GvizResponse): Board {
  if (response.status && response.status !== 'ok') {
    throw new Error('Google Sheet query failed.');
  }

  const table = response.table;
  if (!table) {
    throw new Error('Google Sheet returned no table.');
  }

  const { nameIndex, scoreIndex } = columnIndexes(table);
  const entries: BoardEntry[] = [];

  for (const row of table.rows) {
    const name = String(row.c[nameIndex]?.v ?? '').trim();
    const scoreCell = row.c[scoreIndex];
    const score = Number(scoreCell?.v);
    if (!name || !Number.isFinite(score)) {
      continue;
    }

    entries.push({
      name,
      score,
      display: scoreCell?.f ?? undefined,
    });
  }

  return {
    title: SPENDING_SHEET.title,
    entries,
  };
}

export function findEntry(entries: BoardEntry[], name: string): BoardEntry | undefined {
  const needle = name.trim().toLowerCase();
  return entries.find((entry) => entry.name.trim().toLowerCase() === needle);
}

function columnIndexes(table: GvizTable): { nameIndex: number; scoreIndex: number } {
  const nameIndex = table.cols.findIndex((col) => col.id === SPENDING_SHEET.nameColumn);
  const scoreIndex = table.cols.findIndex((col) => col.id === SPENDING_SHEET.scoreColumn);
  if (nameIndex >= 0 && scoreIndex >= 0) {
    return { nameIndex, scoreIndex };
  }
  if (table.cols.length >= 2) {
    return { nameIndex: 0, scoreIndex: 1 };
  }
  throw new Error('Could not find name/score columns I and J.');
}
