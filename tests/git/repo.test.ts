import { assertEquals, assertRejects } from '@std/assert';
import { createTempGitRepo } from '../helpers/git-test-repo.ts';
import { getRepoRoot, isGitRepo } from '../../src/git/repo.ts';

Deno.test('isGitRepo returns true when inside git repository', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);
    assertEquals(await isGitRepo(), true);
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('isGitRepo returns false when not in git repository', async () => {
  const tempDir = await Deno.makeTempDir({ prefix: 'gwt-not-git-' });
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempDir);
    assertEquals(await isGitRepo(), false);
  } finally {
    Deno.chdir(originalCwd);
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test('getRepoRoot returns absolute path to repo root', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);
    const root = await getRepoRoot();
    // Resolve real path to handle symlinks (e.g., /var -> /private/var on macOS)
    const realPath = await Deno.realPath(tempRepo.path);
    assertEquals(root, realPath);
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('getRepoRoot throws when not in git repository', async () => {
  const tempDir = await Deno.makeTempDir({ prefix: 'gwt-not-git-' });
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempDir);
    await assertRejects(
      () => getRepoRoot(),
      Error,
      'Not in a git repository',
    );
  } finally {
    Deno.chdir(originalCwd);
    await Deno.remove(tempDir, { recursive: true });
  }
});
