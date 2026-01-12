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

import { assertEquals } from '@std/assert';
import { createTempGitRepo } from '../helpers/git-test-repo.ts';
import { runConfigWizardNonInteractive } from '../../src/config/wizard.ts';
import { loadConfig } from '../../src/config/manager.ts';

Deno.test('runConfigWizardNonInteractive creates config with none editor', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    await runConfigWizardNonInteractive({
      editorType: 'none',
      files: ['.env'],
    });

    const config = await loadConfig();
    assertEquals(config?.editor.type, 'none');
    assertEquals(config?.editor.command, undefined);
    assertEquals(config?.filesToCopy, ['.env']);
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('runConfigWizardNonInteractive creates config with custom editor command', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    await runConfigWizardNonInteractive({
      editorType: 'custom',
      editorCommand: 'idea',
      files: ['.idea', '.env'],
    });

    const config = await loadConfig();
    assertEquals(config?.editor.type, 'custom');
    assertEquals(config?.editor.command, 'idea');
    assertEquals(config?.filesToCopy, ['.idea', '.env']);
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('runConfigWizardNonInteractive creates config with custom editor', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    await runConfigWizardNonInteractive({
      editorType: 'custom',
      editorCommand: 'code',
      files: ['.vscode', '.env'],
    });

    const config = await loadConfig();
    assertEquals(config?.editor.type, 'custom');
    assertEquals(config?.editor.command, 'code');
    assertEquals(config?.filesToCopy, ['.vscode', '.env']);
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('runConfigWizardNonInteractive handles empty file list', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    await runConfigWizardNonInteractive({
      editorType: 'none',
      files: [],
    });

    const config = await loadConfig();
    assertEquals(config?.filesToCopy, []);
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});
