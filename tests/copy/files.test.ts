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

import { assertEquals, assert } from '@std/assert';
import { exists } from '@std/fs';
import { join } from '@std/path';
import { createTempGitRepo } from '../helpers/git-test-repo.ts';
import { copyFiles } from '../../src/copy/files.ts';

Deno.test('copyFiles copies a single file', async () => {
  const tempRepo = await createTempGitRepo();
  const dest = await Deno.makeTempDir({ prefix: 'gwt-copy-dest-' });
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    // Create source file
    await Deno.writeTextFile('.env', 'TEST=value');

    await copyFiles(tempRepo.path, dest, ['.env']);

    assert(await exists(join(dest, '.env')));
    const content = await Deno.readTextFile(join(dest, '.env'));
    assertEquals(content, 'TEST=value');
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
    await Deno.remove(dest, { recursive: true });
  }
});

Deno.test('copyFiles copies a directory recursively', async () => {
  const tempRepo = await createTempGitRepo();
  const dest = await Deno.makeTempDir({ prefix: 'gwt-copy-dest-' });
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    // Create source directory with nested content
    await Deno.mkdir('.idea');
    await Deno.writeTextFile('.idea/workspace.xml', '<workspace/>');
    await Deno.mkdir('.idea/inspectionProfiles');
    await Deno.writeTextFile('.idea/inspectionProfiles/profiles.xml', '<profiles/>');

    await copyFiles(tempRepo.path, dest, ['.idea']);

    assert(await exists(join(dest, '.idea')));
    assert(await exists(join(dest, '.idea', 'workspace.xml')));
    assert(await exists(join(dest, '.idea', 'inspectionProfiles', 'profiles.xml')));
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
    await Deno.remove(dest, { recursive: true });
  }
});

Deno.test('copyFiles copies multiple files and directories', async () => {
  const tempRepo = await createTempGitRepo();
  const dest = await Deno.makeTempDir({ prefix: 'gwt-copy-dest-' });
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    // Create multiple sources
    await Deno.writeTextFile('.env', 'TEST=value');
    await Deno.writeTextFile('.env.local', 'LOCAL=value');
    await Deno.mkdir('.vscode');
    await Deno.writeTextFile('.vscode/settings.json', '{}');

    await copyFiles(tempRepo.path, dest, ['.env', '.env.local', '.vscode']);

    assert(await exists(join(dest, '.env')));
    assert(await exists(join(dest, '.env.local')));
    assert(await exists(join(dest, '.vscode', 'settings.json')));
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
    await Deno.remove(dest, { recursive: true });
  }
});

Deno.test('copyFiles expands glob patterns', async () => {
  const tempRepo = await createTempGitRepo();
  const dest = await Deno.makeTempDir({ prefix: 'gwt-copy-dest-' });
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    // Create files matching glob pattern
    await Deno.writeTextFile('.env', 'TEST=value');
    await Deno.writeTextFile('.env.local', 'LOCAL=value');
    await Deno.writeTextFile('.env.production', 'PROD=value');
    await Deno.writeTextFile('.env.example', 'EXAMPLE=value');

    await copyFiles(tempRepo.path, dest, ['.env*']);

    // Should copy all .env* files
    assert(await exists(join(dest, '.env')));
    assert(await exists(join(dest, '.env.local')));
    assert(await exists(join(dest, '.env.production')));
    assert(await exists(join(dest, '.env.example')));
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
    await Deno.remove(dest, { recursive: true });
  }
});

Deno.test('copyFiles skips if source does not exist', async () => {
  const tempRepo = await createTempGitRepo();
  const dest = await Deno.makeTempDir({ prefix: 'gwt-copy-dest-' });
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    // Try to copy non-existent file - should not throw
    await copyFiles(tempRepo.path, dest, ['nonexistent.txt']);

    assert(!(await exists(join(dest, 'nonexistent.txt'))));
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
    await Deno.remove(dest, { recursive: true });
  }
});

Deno.test('copyFiles handles empty file list', async () => {
  const tempRepo = await createTempGitRepo();
  const dest = await Deno.makeTempDir({ prefix: 'gwt-copy-dest-' });
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    // Should not throw with empty list
    await copyFiles(tempRepo.path, dest, []);

    // Dest should remain empty (except possibly created directory)
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
    await Deno.remove(dest, { recursive: true });
  }
});
