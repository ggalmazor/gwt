import { assertEquals } from '@std/assert';

// Test the sanitizeBranchName function behavior
Deno.test('sanitizeBranchName replaces slashes with dashes', () => {
  const sanitizeBranchName = (branch: string): string => {
    return branch.replace(/\//g, '-').replace(/[^\w.-]/g, '');
  };

  assertEquals(sanitizeBranchName('foo/bar'), 'foo-bar');
  assertEquals(sanitizeBranchName('feature/add-user'), 'feature-add-user');
  assertEquals(sanitizeBranchName('hotfix/urgent-fix'), 'hotfix-urgent-fix');
  assertEquals(sanitizeBranchName('main'), 'main');
  assertEquals(sanitizeBranchName('origin/develop'), 'origin-develop');
});

Deno.test('sanitizeBranchName removes problematic characters', () => {
  const sanitizeBranchName = (branch: string): string => {
    return branch.replace(/\//g, '-').replace(/[^\w.-]/g, '');
  };

  assertEquals(sanitizeBranchName('feature@123'), 'feature123');
  assertEquals(sanitizeBranchName('fix:bug'), 'fixbug');
  assertEquals(sanitizeBranchName('test (wip)'), 'testwip');
});
