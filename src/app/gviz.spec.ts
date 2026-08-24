import { entriesFromGviz, findEntry } from './gviz';

describe('gviz sheet parser', () => {
  const rangeQuery = {
    status: 'ok',
    table: {
      cols: [{ id: 'I' }, { id: 'J' }],
      rows: [
        { c: [{ v: 'Riley' }, { v: 10, f: '$10.00' }] },
        { c: [{ v: 'Jordan' }, { v: 313534, f: '$313,534.00' }] },
        { c: [{ v: 'Morgan' }, { v: 24646, f: '$24,646.00' }] },
        { c: [{ v: 'Casey' }, { v: 16559, f: '$16,559.00' }] },
        { c: [{ v: 'Alex' }, { v: 12357, f: '$12,357.00' }] },
      ],
    },
  };

  it('uses whatever names are in I4:J8', () => {
    const board = entriesFromGviz(rangeQuery);
    expect(board.entries.map((entry) => entry.name)).toEqual([
      'Riley',
      'Jordan',
      'Morgan',
      'Casey',
      'Alex',
    ]);
    expect(findEntry(board.entries, 'riley')?.display).toBe('$10.00');
  });

  it('reads two-column select results even without I/J ids', () => {
    const remapped = {
      status: 'ok',
      table: {
        cols: [{ id: 'A' }, { id: 'B' }],
        rows: [{ c: [{ v: 'Sam' }, { v: 42, f: '$42.00' }] }],
      },
    };
    expect(entriesFromGviz(remapped).entries).toEqual([
      { name: 'Sam', score: 42, display: '$42.00' },
    ]);
  });
});
