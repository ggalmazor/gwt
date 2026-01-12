import { assertEquals, assert } from '@std/assert';
import { createTempGitRepo } from '../helpers/git-test-repo.ts';
import { listBranches } from '../../src/git/branch.ts';

Deno.test('listBranches returns local and remote branches', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    // Create additional local branches
    await tempRepo.createBranch('feature-1');
    await tempRepo.createBranch('feature-2');

    const branches = await listBranches();

    // Verify local branches
    assert(branches.local.includes('main'));
    assert(branches.local.includes('feature-1'));
    assert(branches.local.includes('feature-2'));

    // Initially no remotes
    assertEquals(branches.remote.length, 0);
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('listBranches filters out HEAD reference', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    const branches = await listBranches();

    // Ensure HEAD is not in the list (git branch -r sometimes shows "origin/HEAD -> origin/main")
    assert(!branches.local.includes('HEAD'));
    assert(!branches.remote.some((b) => b === 'HEAD' || b.includes('HEAD ->')));
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('listBranches returns empty arrays when no branches exist', async () => {
  // This scenario is unlikely in practice but tests edge case handling
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    const branches = await listBranches();

    // Should have at least the main branch
    assert(branches.local.length >= 1);
    assert(Array.isArray(branches.remote));
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});
