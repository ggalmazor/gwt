import { assert, assertEquals } from '@std/assert';
import { fuzzyMatch, fuzzySearch } from '../../src/utils/fuzzy-search.ts';

Deno.test('fuzzyMatch returns true for exact matches', () => {
  assertEquals(fuzzyMatch('test', 'test'), true);
  assertEquals(fuzzyMatch('main', 'main'), true);
  assertEquals(fuzzyMatch('feature', 'feature'), true);
});

Deno.test('fuzzyMatch returns true for partial matches in order', () => {
  assertEquals(fuzzyMatch('fb', 'feature/branch'), true);
  assertEquals(fuzzyMatch('ftbr', 'feature/branch'), true);
  assertEquals(fuzzyMatch('main', 'origin/main'), true);
  assertEquals(fuzzyMatch('dev', 'develop'), true);
});

Deno.test('fuzzyMatch is case insensitive', () => {
  assertEquals(fuzzyMatch('FB', 'feature/branch'), true);
  assertEquals(fuzzyMatch('Main', 'origin/main'), true);
  assertEquals(fuzzyMatch('DEV', 'develop'), true);
});

Deno.test('fuzzyMatch returns false when characters are not in order', () => {
  assertEquals(fuzzyMatch('ba', 'abc'), false);
  assertEquals(fuzzyMatch('zz', 'feature'), false);
});

Deno.test('fuzzyMatch handles empty query', () => {
  assertEquals(fuzzyMatch('', 'anything'), true);
  assertEquals(fuzzyMatch('', ''), true);
});

Deno.test('fuzzySearch filters and sorts branches by relevance', () => {
  const branches = [
    'main',
    'develop',
    'feature/add-user',
    'feature/fix-bug',
    'hotfix/urgent',
    'release/v1.0',
  ];

  // Search for 'feat' should return feature branches
  const result1 = fuzzySearch('feat', branches);
  assert(result1.length > 0);
  assert(result1.every((branch) => branch.toLowerCase().includes('feat')));

  // Search for 'fu' should match 'feature/add-user' and 'feature/fix-bug'
  const result2 = fuzzySearch('fu', branches);
  assert(result2.includes('feature/add-user'));
  assert(result2.includes('feature/fix-bug'));

  // Search for 'main' should return main
  const result3 = fuzzySearch('main', branches);
  assertEquals(result3[0], 'main');
});

Deno.test('fuzzySearch returns all items when query is empty', () => {
  const branches = ['main', 'develop', 'feature/test'];
  const result = fuzzySearch('', branches);
  assertEquals(result.length, branches.length);
  assertEquals(result, branches);
});

Deno.test('fuzzySearch returns empty array when no matches', () => {
  const branches = ['main', 'develop'];
  const result = fuzzySearch('xyz', branches);
  assertEquals(result.length, 0);
});

Deno.test('fuzzySearch prioritizes matches at start of string', () => {
  const branches = [
    'feature/add-user',
    'bugfix/feature-toggle',
    'main',
  ];

  // 'feat' should prioritize 'feature/add-user' over 'bugfix/feature-toggle'
  const result = fuzzySearch('feat', branches);
  assertEquals(result[0], 'feature/add-user');
});
