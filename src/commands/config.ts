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
import { loadConfig, saveConfig } from '../config/manager.ts';
import { isGitRepo } from '../git/repo.ts';
import { NotInGitRepoError } from '../utils/errors.ts';
import { IDE_COMMANDS } from '../ide/types.ts';

async function showConfig(): Promise<void> {
  // Check if in git repository
  if (!(await isGitRepo())) {
    throw new NotInGitRepoError();
  }

  const config = await loadConfig();

  if (!config) {
    console.log('No configuration found.');
    console.log('Configuration will be created when you create your first worktree.');
    return;
  }

  console.log('Configuration:');
  console.log(`  IDE: ${config.ide}`);
}

async function setIde(ide: string): Promise<void> {
  // Check if in git repository
  if (!(await isGitRepo())) {
    throw new NotInGitRepoError();
  }

  // Validate IDE
  if (!(ide in IDE_COMMANDS)) {
    const validIdes = Object.keys(IDE_COMMANDS).join(', ');
    throw new Error(`Invalid IDE: ${ide}. Valid options: ${validIdes}`);
  }

  await saveConfig({ ide });
  console.log(`IDE set to: ${ide}`);
}

export const configCommand = new Command()
  .description('View or update configuration')
  .action(showConfig)
  .command('set <ide:string>', 'Set the IDE preference')
  .action((_options, ide) => setIde(ide));
