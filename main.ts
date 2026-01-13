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
import { listCommand } from './src/commands/list.ts';
import { createCommand } from './src/commands/create.ts';
import { deleteCommand } from './src/commands/delete.ts';
import { configCommand } from './src/commands/config.ts';
import { openCommand } from './src/commands/open.ts';
import { cleanCommand } from './src/commands/clean.ts';

const program = new Command()
  .name('gwt')
  .version('1.1.2')
  .description('Git Worktree Manager - Manage git worktrees with ease')
  .action(function () {
    this.showHelp();
  })
  .command('list', 'List all worktrees')
  .alias('ls')
  .action(async () => {
    try {
      await listCommand();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      Deno.exit(1);
    }
  })
  .command('create', 'Create a new worktree interactively')
  .alias('add')
  .action(async () => {
    try {
      await createCommand();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      Deno.exit(1);
    }
  })
  .command('delete [target:string]', 'Delete a worktree (interactive if no target)')
  .alias('remove')
  .action(async (_options, target?: string) => {
    try {
      await deleteCommand(target);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      Deno.exit(1);
    }
  })
  .command('open', 'Open a worktree in your configured editor')
  .action(async () => {
    try {
      await openCommand();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      Deno.exit(1);
    }
  })
  .command('clean', 'Remove orphaned worktree directories')
  .action(async () => {
    try {
      await cleanCommand();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      Deno.exit(1);
    }
  })
  .command('config', configCommand);

await program.parse(Deno.args);
