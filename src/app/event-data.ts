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

export interface RankSlot {
  /** Fixed leaderboard position (1–4). */
  position: number;
  team: TeamScore | null;
}

const RANK_ORDINALS = ['1st', '2nd', '3rd', '4th'] as const;
const SLOT_COUNT = RANK_ORDINALS.length;

/** Numeric rank from sheet ordinals (e.g. "2nd" → 2). */
export function rankPositionFromSheet(rank: string): number | null {
  const match = /\d+/.exec(rank.trim());
  if (!match) {
    return null;
  }
  const position = Number(match[0]);
  return Number.isInteger(position) && position >= 1 && position <= SLOT_COUNT ? position : null;
}

/** Map teams into fixed rank slots for display. */
export function teamsByRankSlot(teams: TeamScore[]): RankSlot[] {
  const slots: RankSlot[] = Array.from({ length: SLOT_COUNT }, (_, index) => ({
    position: index + 1,
    team: null,
  }));

  for (const team of teams) {
    const position = rankPositionFromSheet(team.rank);
    if (position) {
      slots[position - 1].team = team;
    }
  }

  return slots;
}

/** Label for a fixed rank slot (e.g. 1 → "1st place"). */
export function slotRankLabel(position: number): string {
  const ordinal = RANK_ORDINALS[position - 1];
  return ordinal ? `${ordinal} place` : `${position} place`;
}

export interface ViewOptions {
  preview: boolean;
  eventName: string;
  logoUrl: string | null;
  /** Seconds to show the team overlay before rotating to sponsors. */
  teamSec: number | null;
  /** Seconds to show the sponsor segment before rotating back. */
  sponsorSec: number | null;
}

export function parseViewOptions(params: URLSearchParams): ViewOptions {
  return {
    preview: params.get('preview') === '1' || params.get('preview') === 'true',
    eventName: params.get('event')?.trim() || EVENT_SHEET.defaultEventName,
    logoUrl: params.get('logo')?.trim() || null,
    teamSec: positiveSeconds(params.get('teamSec') ?? params.get('team')),
    sponsorSec: positiveSeconds(params.get('sponsorSec') ?? params.get('sponsorsSec')),
  };
}

function positiveSeconds(raw: string | null): number | null {
  if (raw === null || raw.trim() === '') {
    return null;
  }
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function teamById(board: EventScoreboard, teamId: number): TeamScore | undefined {
  return board.teams.find((team) => team.id === teamId);
}

export function formatAmount(value: number, _display?: string): string {
  const whole = Math.round(Number(value));
  if (!Number.isFinite(whole)) {
    return '0';
  }
  // Whole numbers only; period as thousands separator (e.g. 5024 → 5.024).
  return whole.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export const CURRENCY_ICON = 'currency-icon.svg';
