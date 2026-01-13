/**
 * gwt - Git Worktree Manager
 * Copyright (C) 2026 Guillermo G. Almazor <guille@ggalmazor.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { assert, assertEquals, assertRejects } from '@std/assert';
import { exists } from '@std/fs';
import { cleanOrphanedWorktreesNonInteractive } from '../../src/commands/clean.ts';
import { createTempGitRepo } from '../helpers/git-test-repo.ts';
import { NotInGitRepoError } from '../../src/utils/errors.ts';
import { addWorktree } from '../../src/git/worktree.ts';

Deno.test('cleanOrphanedWorktreesNonInteractive throws NotInGitRepoError when not in git repo', async () => {
  const tempDir = await Deno.makeTempDir();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempDir);
    await assertRejects(
      () => cleanOrphanedWorktreesNonInteractive([]),
      NotInGitRepoError,
    );
  } finally {
    Deno.chdir(originalCwd);
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test('cleanOrphanedWorktreesNonInteractive removes selected orphaned directories', async () => {
  const repo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(repo.path);

    // Create a directory that looks like an orphaned worktree
    // but isn't actually tracked by git
    const orphanedPath = await Deno.makeTempDir({ prefix: 'gwt-wt-orphaned-' });

    // Create a .git file to make it look like a worktree
    await Deno.writeTextFile(`${orphanedPath}/.git`, 'gitdir: /fake/path');

    // Verify it exists
    assert(await exists(orphanedPath));

    // Clean it up
    await cleanOrphanedWorktreesNonInteractive([orphanedPath]);

    // Verify it's been removed
    assert(!(await exists(orphanedPath)));
  } finally {
    Deno.chdir(originalCwd);
    await repo.cleanup();
  }
});

Deno.test('cleanOrphanedWorktreesNonInteractive does not remove active worktrees', async () => {
  const repo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(repo.path);

    // Create a worktree
    const wtPath = await Deno.makeTempDir({ prefix: 'gwt-wt-' });
    await addWorktree(wtPath, 'main', 'feature');

    // Try to clean an active worktree (should not remove it)
    await cleanOrphanedWorktreesNonInteractive([wtPath]);

    // Verify it still exists
    assert(await exists(wtPath));
  } finally {
    Deno.chdir(originalCwd);
    await repo.cleanup();
  }
});

Deno.test('cleanOrphanedWorktreesNonInteractive handles empty selection', async () => {
  const repo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(repo.path);

    // Clean with empty selection (should not throw)
    await cleanOrphanedWorktreesNonInteractive([]);

    // If we get here, it succeeded
    assertEquals(true, true);
  } finally {
    Deno.chdir(originalCwd);
    await repo.cleanup();
  }
});
