import { parseScoreboard, parseTeamSummaries, mergeScoreboardAndSummaries } from './gviz';

const sampleTable = {
  cols: [
    { id: 'AD' },
    { id: 'AE' },
    { id: 'AF' },
    { id: 'AG' },
    { id: 'AH' },
    { id: 'AI' },
    { id: 'AJ' },
    { id: 'AK' },
    { id: 'AL' },
  ],
  rows: [
    {
      c: [
        { v: '1st' },
        { v: 'Team 3' },
        { v: 5024, f: '5024' },
        { v: 'Guy 7' },
        { v: 5007, f: '5007' },
        { v: 'Guy 8' },
        { v: 8, f: '8' },
        { v: 'Guy 9' },
        { v: 9, f: '9' },
      ],
    },
    {
      c: [
        { v: '2nd' },
        { v: 'Team 4' },
        { v: 1641, f: '1641' },
        { v: 'Guy 10' },
        { v: 910, f: '910' },
        { v: 'Guy 11' },
        { v: 719, f: '719' },
        { v: 'Guy 12' },
        { v: 12, f: '12' },
      ],
    },
    {
      c: [
        { v: '3rd' },
        { v: 'Team 2' },
        { v: 1014, f: '1014' },
        { v: 'Guy 4' },
        { v: 1003, f: '1003' },
        { v: 'Guy 5' },
        { v: 5, f: '5' },
        { v: 'Guy 6' },
        { v: 6, f: '6' },
      ],
    },
    {
      c: [
        { v: '4th' },
        { v: 'Team 1' },
        { v: 1006, f: '1006' },
        { v: 'Guy 1' },
        { v: 1001, f: '1001' },
        { v: 'Guy 2' },
        { v: 2, f: '2' },
        { v: 'Guy 3' },
        { v: 3, f: '3' },
      ],
    },
  ],
};

const summaryTable = {
  cols: sampleTable.cols,
  rows: [
    { c: [{ v: '4th' }, { v: 'Team 1' }, { v: 1006, f: '1006' }, null, null, null, null, null, null] },
    { c: [{ v: '3rd' }, { v: 'Team 2' }, { v: 1014, f: '1014' }, null, null, null, null, null, null] },
    { c: [{ v: '1st' }, { v: 'Team 3' }, { v: 5024, f: '5024' }, null, null, null, null, null, null] },
    { c: [{ v: '2nd' }, { v: 'Team 4' }, { v: 1641, f: '1641' }, null, null, null, null, null, null] },
  ],
};

describe('gviz event parser', () => {
  it('keeps teams in fixed Team 1–4 order', () => {
    const board = parseScoreboard({ status: 'ok', table: sampleTable });
    expect(board.teams.map((team) => team.id)).toEqual([1, 2, 3, 4]);
    expect(board.teams.map((team) => team.rank)).toEqual(['4th', '3rd', '1st', '2nd']);
    expect(board.teams[0]?.players).toHaveLength(3);
  });

  it('merges team summary ranks and totals from AD9:AL12', () => {
    const scoreboard = parseScoreboard({ status: 'ok', table: sampleTable });
    const summaries = parseTeamSummaries({ status: 'ok', table: summaryTable });
    const merged = mergeScoreboardAndSummaries(scoreboard, summaries);
    expect(merged.teams.map((team) => team.id)).toEqual([1, 2, 3, 4]);
    const team1 = merged.teams.find((team) => team.id === 1);
    expect(team1?.rank).toBe('4th');
    expect(team1?.players[0]?.name).toBe('Guy 1');
  });
});
