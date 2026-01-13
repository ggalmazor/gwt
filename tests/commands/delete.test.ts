import { assert, assertEquals, assertRejects } from '@std/assert';
import { createTempGitRepo } from '../helpers/git-test-repo.ts';
import { deleteWorktreeNonInteractive, deleteWorktreeWithForce } from '../../src/commands/delete.ts';
import { addWorktree, listWorktrees } from '../../src/git/worktree.ts';
import { WorktreeNotFoundError } from '../../src/utils/errors.ts';

Deno.test('deleteWorktreeNonInteractive removes worktree by path', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    // Create a worktree
    const wtPath = await Deno.makeTempDir({ prefix: 'gwt-wt-' });
    await addWorktree(wtPath, 'main', 'feature');

    // Verify worktree exists
    let worktrees = await listWorktrees();
    assertEquals(worktrees.length, 2);

    // Delete worktree by path
    await deleteWorktreeNonInteractive(wtPath);

    // Verify worktree is removed
    worktrees = await listWorktrees();
    assertEquals(worktrees.length, 1);
    assert(worktrees[0].branch === 'main');
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('deleteWorktreeNonInteractive removes worktree by branch name', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    // Create a worktree
    const wtPath = await Deno.makeTempDir({ prefix: 'gwt-wt-' });
    await addWorktree(wtPath, 'main', 'feature');

    // Verify worktree exists
    let worktrees = await listWorktrees();
    assertEquals(worktrees.length, 2);

    // Delete worktree by branch name
    await deleteWorktreeNonInteractive('feature');

    // Verify worktree is removed
    worktrees = await listWorktrees();
    assertEquals(worktrees.length, 1);
    assert(worktrees[0].branch === 'main');
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('deleteWorktreeNonInteractive throws when worktree not found', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    // Try to delete non-existent worktree
    await assertRejects(
      () => deleteWorktreeNonInteractive('non-existent'),
      WorktreeNotFoundError,
      'Worktree not found: non-existent',
    );
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('deleteWorktreeNonInteractive can delete multiple worktrees', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    // Create multiple worktrees
    const wtPath1 = await Deno.makeTempDir({ prefix: 'gwt-wt-1-' });
    const wtPath2 = await Deno.makeTempDir({ prefix: 'gwt-wt-2-' });
    await addWorktree(wtPath1, 'main', 'feature-1');
    await addWorktree(wtPath2, 'main', 'feature-2');

    // Verify both exist
    let worktrees = await listWorktrees();
    assertEquals(worktrees.length, 3);

    // Delete first worktree
    await deleteWorktreeNonInteractive('feature-1');
    worktrees = await listWorktrees();
    assertEquals(worktrees.length, 2);

    // Delete second worktree
    await deleteWorktreeNonInteractive('feature-2');
    worktrees = await listWorktrees();
    assertEquals(worktrees.length, 1);
    assert(worktrees[0].branch === 'main');
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('deleteWorktreeWithForce removes worktree with uncommitted changes', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    // Create a worktree
    const wtPath = await Deno.makeTempDir({ prefix: 'gwt-wt-' });
    await addWorktree(wtPath, 'main', 'feature');

    // Make uncommitted changes in the worktree
    await Deno.writeTextFile(`${wtPath}/uncommitted.txt`, 'uncommitted change');

    // Verify worktree exists
    let worktrees = await listWorktrees();
    assertEquals(worktrees.length, 2);

    // Try to delete without force (should fail)
    await assertRejects(
      () => deleteWorktreeNonInteractive('feature'),
      Error,
      'Failed to remove worktree',
    );

    // Verify worktree still exists
    worktrees = await listWorktrees();
    assertEquals(worktrees.length, 2);

    // Delete with force (should succeed)
    await deleteWorktreeWithForce('feature');

    // Verify worktree is removed
    worktrees = await listWorktrees();
    assertEquals(worktrees.length, 1);
    assert(worktrees[0].branch === 'main');
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('deleteWorktreeWithForce removes worktree with untracked files', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    // Create a worktree
    const wtPath = await Deno.makeTempDir({ prefix: 'gwt-wt-' });
    await addWorktree(wtPath, 'main', 'feature');

    // Add an untracked file in the worktree
    await Deno.writeTextFile(`${wtPath}/untracked.txt`, 'untracked file');

    // Verify worktree exists
    let worktrees = await listWorktrees();
    assertEquals(worktrees.length, 2);

    // Try to delete without force (should fail)
    await assertRejects(
      () => deleteWorktreeNonInteractive('feature'),
      Error,
      'Failed to remove worktree',
    );

    // Verify worktree still exists
    worktrees = await listWorktrees();
    assertEquals(worktrees.length, 2);

    // Delete with force (should succeed)
    await deleteWorktreeWithForce('feature');

    // Verify worktree is removed
    worktrees = await listWorktrees();
    assertEquals(worktrees.length, 1);
    assert(worktrees[0].branch === 'main');
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});
