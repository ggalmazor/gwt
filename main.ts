import { Command } from '@cliffy/command';
import { listCommand } from './src/commands/list.ts';
import { createCommand } from './src/commands/create.ts';
import { deleteCommand } from './src/commands/delete.ts';
import { configCommand } from './src/commands/config.ts';

await new Command()
  .name('gwt')
  .version('1.0.0')
  .description('Git Worktree Manager - Manage git worktrees with ease')
  .command('list', 'List all worktrees')
  .alias('ls')
  .action(async () => {
    try {
      await listCommand();
    } catch (error) {
      console.error(`Error: ${error.message}`);
      Deno.exit(1);
    }
  })
  .command('create', 'Create a new worktree interactively')
  .alias('add')
  .action(async () => {
    try {
      await createCommand();
    } catch (error) {
      console.error(`Error: ${error.message}`);
      Deno.exit(1);
    }
  })
  .command('delete <target:string>', 'Delete a worktree (by path or branch name)')
  .alias('remove')
  .action(async (_options, target: string) => {
    try {
      await deleteCommand(target);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      Deno.exit(1);
    }
  })
  .command('config', configCommand)
  .parse(Deno.args);
