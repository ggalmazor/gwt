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

import { assert, assertEquals } from '@std/assert';
import { createTempGitRepo } from '../helpers/git-test-repo.ts';
import { discoverFiles, selectFilesToCopyNonInteractive } from '../../src/copy/selector.ts';

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
    const fileNames = files.map((f) => f.name);
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

    const fileNames = files.map((f) => f.name);
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

    const envFile = files.find((f) => f.name === '.env');
    const ideaDir = files.find((f) => f.name === '.idea');

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
    const names = files.map((f) => f.name);

    // Check that files are sorted (case-insensitive)
    const sortedNames = [...names].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    assertEquals(names, sortedNames);
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('selectFilesToCopyNonInteractive returns selected files', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    // Create test files
    await Deno.writeTextFile('.env', 'TEST=value');
    await Deno.mkdir('.idea');
    await Deno.mkdir('.vscode');

    const files = await discoverFiles(tempRepo.path);
    const selected = selectFilesToCopyNonInteractive(files, ['.env', '.idea']);

    assertEquals(selected, ['.env', '.idea']);
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('selectFilesToCopyNonInteractive filters out invalid selections', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    const files = await discoverFiles(tempRepo.path);
    const selected = selectFilesToCopyNonInteractive(files, ['.env', 'nonexistent.txt']);

    // Should only return valid selections
    assertEquals(selected.includes('.env'), false); // .env doesn't exist in temp repo
    assertEquals(selected.includes('nonexistent.txt'), false);
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('selectFilesToCopyNonInteractive handles empty selection', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    const files = await discoverFiles(tempRepo.path);
    const selected = selectFilesToCopyNonInteractive(files, []);

    assertEquals(selected, []);
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('discoverFiles discovers files in subdirectories recursively', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    // Create nested directory structure
    await Deno.mkdir('config');
    await Deno.writeTextFile('config/app.yml', 'app: config');
    await Deno.writeTextFile('config/database.yml', 'db: config');
    await Deno.mkdir('config/environments', { recursive: true });
    await Deno.writeTextFile('config/environments/production.yml', 'prod: config');
    await Deno.mkdir('src');
    await Deno.writeTextFile('src/main.ts', 'console.log("hello")');

    const files = await discoverFiles(tempRepo.path);
    const fileNames = files.map((f) => f.name);

    // Should include files with relative paths
    assert(fileNames.includes('config/app.yml'));
    assert(fileNames.includes('config/database.yml'));
    assert(fileNames.includes('config/environments/production.yml'));
    assert(fileNames.includes('src/main.ts'));
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('discoverFiles marks files in subdirectories correctly', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    // Create nested structure
    await Deno.mkdir('config');
    await Deno.writeTextFile('config/app.yml', 'app: config');
    await Deno.mkdir('config/nested', { recursive: true });

    const files = await discoverFiles(tempRepo.path);

    const appFile = files.find((f) => f.name === 'config/app.yml');
    const nestedDir = files.find((f) => f.name === 'config/nested');

    assertEquals(appFile?.isDirectory, false);
    assertEquals(nestedDir?.isDirectory, true);
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});
