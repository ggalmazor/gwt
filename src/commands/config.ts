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
