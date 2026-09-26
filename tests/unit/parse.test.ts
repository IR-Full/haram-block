import { describe, expect, it } from 'vitest';
import { parseList } from '../../tools/build-lists/parse.ts';

describe('parseList', () => {
  it('reads hosts files, skipping comments, loopback names and non-sink addresses', () => {
    const text = [
      '# header',
      '127.0.0.1 localhost',
      '0.0.0.0 0.0.0.0',
      '0.0.0.0 a.example # inline comment',
      '0.0.0.0\tb.example c.example',
      '192.168.1.1 router.example',
      '',
    ].join('\r\n');
    expect(parseList(text, 'hosts')).toEqual(['a.example', 'b.example', 'c.example']);
  });

  it('reads plain domain lists', () => {
    expect(parseList('# c\n! adblock comment\nx.example\n\n y.example \n', 'domains')).toEqual([
      'x.example',
      'y.example',
    ]);
  });

  it('strips the wildcard prefix', () => {
    expect(parseList('*.x.example\ny.example\n', 'wildcard')).toEqual(['x.example', 'y.example']);
  });
});
