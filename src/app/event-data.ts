import { EVENT_SHEET } from './sheet';

export interface PlayerScore {
  name: string;
  total: number;
  display?: string;
}

export interface TeamScore {
  /** 1–4 from the sheet label "Team N" */
  id: number;
  rank: string;
  name: string;
  total: number;
  totalDisplay?: string;
  players: PlayerScore[];
}

export interface EventScoreboard {
  teams: TeamScore[];
}

export interface ViewOptions {
  preview: boolean;
  eventName: string;
  logoUrl: string | null;
}

export function parseViewOptions(params: URLSearchParams): ViewOptions {
  return {
    preview: params.get('preview') === '1' || params.get('preview') === 'true',
    eventName: params.get('event')?.trim() || EVENT_SHEET.defaultEventName,
    logoUrl: params.get('logo')?.trim() || null,
  };
}

export function teamById(board: EventScoreboard, teamId: number): TeamScore | undefined {
  return board.teams.find((team) => team.id === teamId);
}

export function formatAmount(value: number, display?: string): string {
  const raw = (display ?? value.toLocaleString()).trim();
  return raw.startsWith('$') ? raw : `$${raw}`;
}
