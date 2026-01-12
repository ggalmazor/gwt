import { Select, Input } from '@cliffy/prompt';
import { basename, join } from '@std/path';
import { exists } from '@std/fs';
import { isGitRepo, getRepoRoot } from '../git/repo.ts';
import { listBranches } from '../git/branch.ts';
import { addWorktree } from '../git/worktree.ts';
import { loadConfig, saveConfig } from '../config/manager.ts';
import { copyIdeaDir } from '../copy/idea.ts';
import { copyEnvFiles } from '../copy/env.ts';
import { promptForIDE, launchIDE } from '../ide/launcher.ts';
import { NotInGitRepoError, WorktreeExistsError } from '../utils/errors.ts';

/**
 * Sanitize branch name for use in file system path.
 * Replace / with - and remove other problematic characters.
 */
function sanitizeBranchName(branch: string): string {
  return branch.replace(/\//g, '-').replace(/[^\w.-]/g, '');
}

/**
 * Generate default worktree path based on repo name and branch.
 */
async function generateDefaultPath(branch: string): Promise<string> {
  const repoRoot = await getRepoRoot();
  const repoName = basename(repoRoot);
  const sanitizedBranch = sanitizeBranchName(branch);
  return join(repoRoot, '..', `${repoName}-${sanitizedBranch}`);
}

export async function createCommand(): Promise<void> {
  // Check if in git repository
  if (!(await isGitRepo())) {
    throw new NotInGitRepoError();
  }

  // Get repository root for file operations
  const repoRoot = await getRepoRoot();

  // List all branches
  const branches = await listBranches();

  // Build branch selection options
  const options: Array<{ name: string; value: string }> = [
    { name: '✨ Create new branch...', value: '__CREATE_NEW__' },
  ];

  if (branches.local.length > 0) {
    options.push({ name: '─────── Local Branches ───────', value: '__SEPARATOR_LOCAL__' });
    branches.local.forEach((branch) => {
      options.push({ name: `  ${branch}`, value: `local:${branch}` });
    });
  }

  if (branches.remote.length > 0) {
    options.push({ name: '─────── Remote Branches ───────', value: '__SEPARATOR_REMOTE__' });
    branches.remote.forEach((branch) => {
      options.push({ name: `  ${branch}`, value: `remote:${branch}` });
    });
  }

  // Prompt for branch selection
  const selection = await Select.prompt({
    message: 'Select branch for new worktree:',
    options,
  });

  let targetBranch: string;
  let newBranch: string | undefined;
  let baseBranch: string | undefined;

  if (selection === '__CREATE_NEW__') {
    // Create new branch flow
    newBranch = await Input.prompt({
      message: 'Enter new branch name:',
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Branch name cannot be empty';
        }
        if (branches.local.includes(value)) {
          return `Branch '${value}' already exists`;
        }
        return true;
      },
    });

    baseBranch = await Select.prompt({
      message: 'Select base branch:',
      options: [
        ...branches.local.map((branch) => ({ name: `  ${branch}`, value: branch })),
        ...branches.remote.map((branch) => ({ name: `  ${branch}`, value: branch })),
      ],
    });

    targetBranch = baseBranch;
  } else if (selection.startsWith('local:')) {
    targetBranch = selection.substring('local:'.length);
  } else if (selection.startsWith('remote:')) {
    const remoteBranch = selection.substring('remote:'.length);
    // For remote branches, extract the branch name without remote prefix
    // e.g., "origin/feature" -> "feature"
    const branchName = remoteBranch.split('/').slice(1).join('/');
    targetBranch = remoteBranch;
    newBranch = branchName; // Create local tracking branch
  } else {
    // Separator selected (shouldn't happen with proper filtering)
    throw new Error('Invalid selection');
  }

  // Generate default path
  // Use the full branch name - sanitizeBranchName will handle slashes
  const branchForPath = newBranch || targetBranch;
  const defaultPath = await generateDefaultPath(branchForPath);

  // Prompt for worktree path
  const worktreePath = await Input.prompt({
    message: 'Enter worktree path:',
    default: defaultPath,
    validate: async (value) => {
      if (!value || value.trim().length === 0) {
        return 'Path cannot be empty';
      }
      if (await exists(value)) {
        return `Path already exists: ${value}`;
      }
      return true;
    },
  });

  // Create worktree
  console.log(`Creating worktree at: ${worktreePath}...`);
  await addWorktree(worktreePath, targetBranch, newBranch);
  console.log('✓ Worktree created');

  // Copy .idea directory
  console.log('Copying .idea directory...');
  await copyIdeaDir(repoRoot, worktreePath);
  console.log('✓ .idea directory copied');

  // Copy .env files
  console.log('Copying .env files...');
  await copyEnvFiles(repoRoot, worktreePath);
  console.log('✓ .env files copied');

  // Get or prompt for IDE
  let config = await loadConfig();

  if (!config) {
    console.log('No IDE configuration found. Setting up...');
    const ide = await promptForIDE();
    await saveConfig({ ide });
    config = { version: '1.0', ide };
    console.log(`✓ IDE set to: ${ide}`);
  }

  // Launch IDE
  console.log(`Launching ${config.ide}...`);
  await launchIDE(config.ide, worktreePath);
  console.log('✓ IDE launched');

  console.log('');
  console.log(`Worktree ready at: ${worktreePath}`);
}
