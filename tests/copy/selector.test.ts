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
import { createTempGitRepo } from '../helpers/git-test-repo.ts';
import { discoverFiles } from '../../src/copy/selector.ts';

Deno.test('discoverFiles lists all files and directories including hidden', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    // Create test files and directories
    await Deno.writeTextFile('.env', 'TEST=value');
    await Deno.writeTextFile('.env.local', 'LOCAL=value');
    await Deno.writeTextFile('config.yml', 'config: test');
    await Deno.mkdir('.idea');
    await Deno.writeTextFile('.idea/workspace.xml', '<workspace/>');
    await Deno.mkdir('.vscode');
    await Deno.writeTextFile('.vscode/settings.json', '{}');

    const files = await discoverFiles(tempRepo.path);

    // Check that all files and directories are found
    const fileNames = files.map(f => f.name);
    assert(fileNames.includes('.env'));
    assert(fileNames.includes('.env.local'));
    assert(fileNames.includes('config.yml'));
    assert(fileNames.includes('.idea'));
    assert(fileNames.includes('.vscode'));
    assert(fileNames.includes('README.md')); // Created by createTempGitRepo
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('discoverFiles filters out .git directory', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    const files = await discoverFiles(tempRepo.path);

    const fileNames = files.map(f => f.name);
    assert(!fileNames.includes('.git'));
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('discoverFiles distinguishes files from directories', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    // Create test files and directories
    await Deno.writeTextFile('.env', 'TEST=value');
    await Deno.mkdir('.idea');

    const files = await discoverFiles(tempRepo.path);

    const envFile = files.find(f => f.name === '.env');
    const ideaDir = files.find(f => f.name === '.idea');

    assertEquals(envFile?.isDirectory, false);
    assertEquals(ideaDir?.isDirectory, true);
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('discoverFiles returns files sorted alphabetically', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    // Create files in random order
    await Deno.writeTextFile('zebra.txt', 'z');
    await Deno.writeTextFile('alpha.txt', 'a');
    await Deno.writeTextFile('beta.txt', 'b');

    const files = await discoverFiles(tempRepo.path);
    const names = files.map(f => f.name);

    // Check that files are sorted (case-insensitive)
    const sortedNames = [...names].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    assertEquals(names, sortedNames);
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});
