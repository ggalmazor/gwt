import { assert, assertEquals } from '@std/assert';
import { createTempGitRepo } from '../helpers/git-test-repo.ts';
import { addWorktree, listWorktrees, removeWorktree } from '../../src/git/worktree.ts';

Deno.test('listWorktrees returns main worktree when no additional worktrees exist', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);
    const worktrees = await listWorktrees();

    assertEquals(worktrees.length, 1);
    assertEquals(worktrees[0].branch, 'main');
    assert(worktrees[0].path.endsWith(tempRepo.path.split('/').pop() || ''));
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('listWorktrees includes all worktrees', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    // Create a new branch and worktree
    await tempRepo.createBranch('feature');
    const wtPath = await Deno.makeTempDir({ prefix: 'gwt-wt-' });
    await tempRepo.createWorktree('feature', wtPath);

    const worktrees = await listWorktrees();

    assertEquals(worktrees.length, 2);
    assert(worktrees.some((wt) => wt.branch === 'main'));
    assert(worktrees.some((wt) => wt.branch === 'feature'));

    // Cleanup worktree
    await Deno.remove(wtPath, { recursive: true });
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('listWorktrees parses worktree information correctly', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    const worktrees = await listWorktrees();
    const mainWorktree = worktrees[0];

    assert(mainWorktree.path);
    assert(mainWorktree.branch === 'main');
    assert(mainWorktree.commit);
    assert(mainWorktree.commit.length === 40); // SHA-1 hash length
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('addWorktree creates worktree for existing branch', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    await tempRepo.createBranch('feature');
    const wtPath = await Deno.makeTempDir({ prefix: 'gwt-wt-' });

    await addWorktree(wtPath, 'feature');

    const worktrees = await listWorktrees();
    assert(worktrees.some((wt) => wt.branch === 'feature'));

    // Cleanup
    await Deno.remove(wtPath, { recursive: true });
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('addWorktree creates new branch when newBranch specified', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    const wtPath = await Deno.makeTempDir({ prefix: 'gwt-wt-' });

    await addWorktree(wtPath, 'main', 'new-feature');

    const worktrees = await listWorktrees();
    assert(worktrees.some((wt) => wt.branch === 'new-feature'));

    // Cleanup
    await Deno.remove(wtPath, { recursive: true });
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('removeWorktree deletes worktree', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    const wtPath = await Deno.makeTempDir({ prefix: 'gwt-wt-' });
    await addWorktree(wtPath, 'main', 'feature');

    // Verify worktree exists
    let worktrees = await listWorktrees();
    assertEquals(worktrees.length, 2);

    // Remove worktree
    await removeWorktree(wtPath);

    // Verify worktree is removed
    worktrees = await listWorktrees();
    assertEquals(worktrees.length, 1);
    assert(worktrees[0].branch === 'main');
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});
