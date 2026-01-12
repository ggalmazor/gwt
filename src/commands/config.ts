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

import { Command } from '@cliffy/command';
import { loadConfig } from '../config/manager.ts';
import { isGitRepo } from '../git/repo.ts';
import { NotInGitRepoError } from '../utils/errors.ts';
import { runConfigWizard } from '../config/wizard.ts';

async function showConfig(): Promise<void> {
  // Check if in git repository
  if (!(await isGitRepo())) {
    throw new NotInGitRepoError();
  }

  const config = await loadConfig();

  if (!config) {
    console.log('No configuration found.');
    console.log('Run "gwt config setup" to configure gwt for this repository.');
    return;
  }

  console.log('Configuration:');
  console.log('');

  // Display editor configuration
  console.log('Editor:');
  if (config.editor.type === 'none') {
    console.log('  Type: None (editor launching disabled)');
  } else if (config.editor.type === 'jetbrains') {
    console.log('  Type: JetBrains IDE');
    console.log(`  Command: ${config.editor.command}`);
  } else if (config.editor.type === 'custom') {
    console.log('  Type: Custom command');
    console.log(`  Command: ${config.editor.command}`);
  }

  console.log('');

  // Display files to copy
  console.log('Files to copy:');
  if (config.filesToCopy.length === 0) {
    console.log('  (none)');
  } else {
    config.filesToCopy.forEach(file => {
      console.log(`  - ${file}`);
    });
  }

  console.log('');
  console.log('Run "gwt config setup" to reconfigure.');
}

async function setupConfig(): Promise<void> {
  // Check if in git repository
  if (!(await isGitRepo())) {
    throw new NotInGitRepoError();
  }

  await runConfigWizard();
}

export const configCommand = new Command()
  .description('View or update configuration')
  .action(showConfig)
  .command('setup', 'Run the interactive configuration wizard')
  .action(setupConfig);
