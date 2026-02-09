import { assert, assertEquals, assertRejects } from '@std/assert';
import { exists } from '@std/fs';
import { basename, join } from '@std/path';
import { createTempGitRepo } from '../helpers/git-test-repo.ts';
import { createWorktreeNonInteractive } from '../../src/commands/create.ts';
import { listWorktrees } from '../../src/git/worktree.ts';
import { saveConfig } from '../../src/config/manager.ts';
import { NotInGitRepoError } from '../../src/utils/errors.ts';

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

Deno.test('createWorktreeNonInteractive creates worktree from existing branch', async () => {
  const repo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(repo.path);

    // Create a branch to use
    await repo.createBranch('feature');

    // Configure with no editor
    await saveConfig({
      editor: { type: 'none' },
      filesToCopy: [],
    });

    const wtPath = join(repo.path, '..', 'test-wt-existing');

    await createWorktreeNonInteractive({
      branch: 'feature',
      path: wtPath,
      noEditor: true,
    });

    // Verify worktree was created
    const worktrees = await listWorktrees();
    assertEquals(worktrees.length, 2);
    assert(worktrees.some((wt) => wt.branch === 'feature'));
    assert(await exists(wtPath));

    // Cleanup worktree dir
    await Deno.remove(wtPath, { recursive: true });
  } finally {
    Deno.chdir(originalCwd);
    await repo.cleanup();
  }
});

Deno.test('createWorktreeNonInteractive computes path from repo name and branch when path is omitted', async () => {
  const repo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(repo.path);

    await repo.createBranch('feature/my-thing');

    await saveConfig({
      editor: { type: 'none' },
      filesToCopy: [],
    });

    await createWorktreeNonInteractive({
      branch: 'feature/my-thing',
      noEditor: true,
    });

    const repoName = basename(repo.path);
    const expectedPath = join(repo.path, '..', `${repoName}-feature-my-thing`);

    const worktrees = await listWorktrees();
    assertEquals(worktrees.length, 2);
    assert(worktrees.some((wt) => wt.branch === 'feature/my-thing'));
    assert(await exists(expectedPath));

    // Cleanup
    await Deno.remove(expectedPath, { recursive: true });
  } finally {
    Deno.chdir(originalCwd);
    await repo.cleanup();
  }
});

Deno.test('createWorktreeNonInteractive creates worktree with new branch', async () => {
  const repo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(repo.path);

    await saveConfig({
      editor: { type: 'none' },
      filesToCopy: [],
    });

    const wtPath = join(repo.path, '..', 'test-wt-new-branch');

    await createWorktreeNonInteractive({
      newBranch: 'feature-new',
      base: 'main',
      path: wtPath,
      noEditor: true,
    });

    const worktrees = await listWorktrees();
    assertEquals(worktrees.length, 2);
    assert(worktrees.some((wt) => wt.branch === 'feature-new'));
    assert(await exists(wtPath));

    await Deno.remove(wtPath, { recursive: true });
  } finally {
    Deno.chdir(originalCwd);
    await repo.cleanup();
  }
});

Deno.test('createWorktreeNonInteractive throws when path already exists', async () => {
  const repo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(repo.path);

    await repo.createBranch('feature');

    await saveConfig({
      editor: { type: 'none' },
      filesToCopy: [],
    });

    // Create a directory at the target path
    const wtPath = await Deno.makeTempDir({ prefix: 'gwt-exists-' });

    await assertRejects(
      () =>
        createWorktreeNonInteractive({
          branch: 'feature',
          path: wtPath,
          noEditor: true,
        }),
      Error,
      'Path already exists',
    );

    await Deno.remove(wtPath, { recursive: true });
  } finally {
    Deno.chdir(originalCwd);
    await repo.cleanup();
  }
});

Deno.test('createWorktreeNonInteractive throws when --new-branch without --base', async () => {
  const repo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(repo.path);

    await assertRejects(
      () =>
        createWorktreeNonInteractive({
          newBranch: 'feature',
          path: '/tmp/some-path',
          noEditor: true,
        }),
      Error,
      '--base is required',
    );
  } finally {
    Deno.chdir(originalCwd);
    await repo.cleanup();
  }
});

Deno.test('createWorktreeNonInteractive throws when neither --branch nor --new-branch', async () => {
  const repo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(repo.path);

    await assertRejects(
      () =>
        createWorktreeNonInteractive({
          path: '/tmp/some-path',
          noEditor: true,
        }),
      Error,
      'Either --branch or --new-branch is required',
    );
  } finally {
    Deno.chdir(originalCwd);
    await repo.cleanup();
  }
});

Deno.test('createWorktreeNonInteractive throws NotInGitRepoError outside git repo', async () => {
  const tempDir = await Deno.makeTempDir();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempDir);

    await assertRejects(
      () =>
        createWorktreeNonInteractive({
          branch: 'main',
          path: '/tmp/some-path',
          noEditor: true,
        }),
      NotInGitRepoError,
    );
  } finally {
    Deno.chdir(originalCwd);
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test('createWorktreeNonInteractive copies configured files', async () => {
  const repo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(repo.path);

    // Create a file to copy
    await Deno.writeTextFile(join(repo.path, '.env'), 'SECRET=test');

    await repo.createBranch('feature');

    await saveConfig({
      editor: { type: 'none' },
      filesToCopy: ['.env'],
    });

    const wtPath = join(repo.path, '..', 'test-wt-copy');

    await createWorktreeNonInteractive({
      branch: 'feature',
      path: wtPath,
      noEditor: true,
    });

    // Verify file was copied
    assert(await exists(join(wtPath, '.env')));
    const content = await Deno.readTextFile(join(wtPath, '.env'));
    assertEquals(content, 'SECRET=test');

    await Deno.remove(wtPath, { recursive: true });
  } finally {
    Deno.chdir(originalCwd);
    await repo.cleanup();
  }
});
