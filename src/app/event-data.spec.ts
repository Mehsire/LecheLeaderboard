import { TeamScore, rankPositionFromSheet, slotRankLabel, teamsByRankSlot } from './event-data';

const teams: TeamScore[] = [
  {
    id: 1,
    rank: '4th',
    name: 'Team Alpha',
    total: 1006,
    players: [{ name: 'Player A', total: 1001 }],
  },
  {
    id: 2,
    rank: '3rd',
    name: 'Team Beta',
    total: 1014,
    players: [{ name: 'Player B', total: 1003 }],
  },
  {
    id: 3,
    rank: '1st',
    name: 'Team Gamma',
    total: 5024,
    players: [{ name: 'Player C', total: 5007 }],
  },
  {
    id: 4,
    rank: '2nd',
    name: 'Team Delta',
    total: 1641,
    players: [{ name: 'Player D', total: 910 }],
  },
];

describe('event-data rank slots', () => {
  it('parses numeric rank positions from sheet ordinals', () => {
    expect(rankPositionFromSheet('1st')).toBe(1);
    expect(rankPositionFromSheet('4th place')).toBe(4);
    expect(rankPositionFromSheet('')).toBeNull();
  });

  it('maps teams into fixed rank slots by spreadsheet rank', () => {
    const slots = teamsByRankSlot(teams);
    expect(slots.map((slot) => slot.position)).toEqual([1, 2, 3, 4]);
    expect(slots.map((slot) => slot.team?.id)).toEqual([3, 4, 2, 1]);
    expect(slots[0]?.team?.name).toBe('Team Gamma');
    expect(slots[1]?.team?.name).toBe('Team Delta');
  });

  it('labels rank slots with static place text', () => {
    expect(slotRankLabel(1)).toBe('1st place');
    expect(slotRankLabel(4)).toBe('4th place');
  });
});
