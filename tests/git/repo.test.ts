import { assertEquals } from '@std/assert';
import { createTempGitRepo } from '../helpers/git-test-repo.ts';
import { isGitRepo } from '../../src/git/repo.ts';

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
