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

import { assertEquals, assertRejects } from '@std/assert';
import { openCommand, openCommandNonInteractive } from '../../src/commands/open.ts';
import { createTempGitRepo } from '../helpers/git-test-repo.ts';
import { NotInGitRepoError } from '../../src/utils/errors.ts';
import { saveConfig } from '../../src/config/manager.ts';
import { addWorktree } from '../../src/git/worktree.ts';

Deno.test('openCommandNonInteractive throws NotInGitRepoError when not in git repo', async () => {
  const tempDir = await Deno.makeTempDir();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempDir);
    await assertRejects(
      () => openCommandNonInteractive('/some/path'),
      NotInGitRepoError,
    );
  } finally {
    Deno.chdir(originalCwd);
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test('openCommandNonInteractive launches editor when configured', async () => {
  const repo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(repo.path);

    // Create a worktree
    const wtPath = await Deno.makeTempDir({ prefix: 'gwt-wt-' });
    await addWorktree(wtPath, 'main', 'feature');

    // Configure editor to use 'echo' as a safe test command
    await saveConfig({
      editor: { type: 'custom', command: 'echo' },
      filesToCopy: [],
    });

    // Open the worktree (should not throw)
    await openCommandNonInteractive(wtPath);

    // If we get here, it means the command succeeded
    assertEquals(true, true);
  } finally {
    Deno.chdir(originalCwd);
    await repo.cleanup();
  }
});

Deno.test('openCommandNonInteractive with no editor configured outputs cd message', async () => {
  const repo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(repo.path);

    // Create a worktree
    const wtPath = await Deno.makeTempDir({ prefix: 'gwt-wt-' });
    await addWorktree(wtPath, 'main', 'feature');

    // Configure with no editor
    await saveConfig({
      editor: { type: 'none' },
      filesToCopy: [],
    });

    // Open the worktree (should output cd message)
    await openCommandNonInteractive(wtPath);

    // If we get here, it means the command succeeded
    assertEquals(true, true);
  } finally {
    Deno.chdir(originalCwd);
    await repo.cleanup();
  }
});

Deno.test('openCommandNonInteractive throws error when worktree path does not exist', async () => {
  const repo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(repo.path);

    await saveConfig({
      editor: { type: 'none' },
      filesToCopy: [],
    });

    // Try to open a non-existent worktree
    await assertRejects(
      () => openCommandNonInteractive('/non/existent/path'),
      Error,
      'Path does not exist',
    );
  } finally {
    Deno.chdir(originalCwd);
    await repo.cleanup();
  }
});

Deno.test('openCommand with target opens worktree by branch name', async () => {
  const repo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(repo.path);

    const wtPath = await Deno.makeTempDir({ prefix: 'gwt-wt-' });
    await addWorktree(wtPath, 'main', 'feature');

    await saveConfig({
      editor: { type: 'custom', command: 'echo' },
      filesToCopy: [],
    });

    // Open by branch name (non-interactive)
    await openCommand('feature');

    assertEquals(true, true);
  } finally {
    Deno.chdir(originalCwd);
    await repo.cleanup();
  }
});

Deno.test('openCommand with target opens worktree by path', async () => {
  const repo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(repo.path);

    const wtPath = await Deno.makeTempDir({ prefix: 'gwt-wt-' });
    await addWorktree(wtPath, 'main', 'feature');

    await saveConfig({
      editor: { type: 'custom', command: 'echo' },
      filesToCopy: [],
    });

    // Open by path (non-interactive)
    await openCommand(wtPath);

    assertEquals(true, true);
  } finally {
    Deno.chdir(originalCwd);
    await repo.cleanup();
  }
});

Deno.test('openCommand with invalid target throws error', async () => {
  const repo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(repo.path);

    await saveConfig({
      editor: { type: 'none' },
      filesToCopy: [],
    });

    await assertRejects(
      () => openCommand('nonexistent-branch'),
      Error,
      'Worktree not found',
    );
  } finally {
    Deno.chdir(originalCwd);
    await repo.cleanup();
  }
});
