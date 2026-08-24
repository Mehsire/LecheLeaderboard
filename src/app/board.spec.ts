import { parseOverlayOptions, parseRows, rankBoard } from './board';

describe('board helpers', () => {
  it('parses comma-separated name:score rows', () => {
    expect(parseRows('Alice:120,Bob:90')).toEqual([
      { name: 'Alice', score: 120 },
      { name: 'Bob', score: 90 },
    ]);
  });

  it('ranks and limits entries', () => {
    const ranked = rankBoard(
      {
        title: 'Test',
        entries: [
          { name: 'B', score: 2 },
          { name: 'A', score: 10 },
          { name: 'C', score: 5 },
        ],
      },
      parseOverlayOptions(new URLSearchParams('limit=2&title=Top')),
    );

    expect(ranked.title).toBe('Top');
    expect(ranked.entries.map((entry) => entry.name)).toEqual(['A', 'C']);
  });

  it('reads the name overlay param', () => {
    const options = parseOverlayOptions(new URLSearchParams('name=Taylor'));
    expect(options.name).toBe('Taylor');
    expect(options.refresh).toBe(30);
  });
});
