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

import { Input, Select } from '@cliffy/prompt';
import { basename, join } from '@std/path';
import { exists } from '@std/fs';
import { getRepoRoot, isGitRepo } from '../git/repo.ts';
import { listBranches } from '../git/branch.ts';
import { addWorktree } from '../git/worktree.ts';
import { loadConfig } from '../config/manager.ts';
import { copyFiles } from '../copy/files.ts';
import { launchEditor } from '../editor/launcher.ts';
import { runConfigWizard } from '../config/wizard.ts';
import { NotInGitRepoError } from '../utils/errors.ts';

/**
 * Sanitize branch name for use in file system path.
 * Replace / with - and remove other problematic characters.
 */
export function sanitizeBranchName(branch: string): string {
  return branch.replace(/\//g, '-').replace(/[^\w.-]/g, '');
}

/**
 * Options for non-interactive worktree creation.
 */
export interface CreateWorktreeOptions {
  /** Existing branch to check out */
  branch?: string;
  /** Path for the new worktree (computed from repo name + branch if omitted) */
  path?: string;
  /** New branch name to create */
  newBranch?: string;
  /** Base branch for the new branch */
  base?: string;
  /** Skip editor launch (default: true for non-interactive) */
  noEditor?: boolean;
}

/**
 * Create a worktree non-interactively.
 * Requires either `branch` + `path` or `newBranch` + `base` + `path`.
 */
export async function createWorktreeNonInteractive(options: CreateWorktreeOptions): Promise<void> {
  if (!(await isGitRepo())) {
    throw new NotInGitRepoError();
  }

  const repoRoot = await getRepoRoot();

  let targetBranch: string;
  let newBranch: string | undefined;

  if (options.newBranch) {
    if (!options.base) {
      throw new Error('--base is required when using --new-branch');
    }
    targetBranch = options.base;
    newBranch = options.newBranch;
  } else if (options.branch) {
    targetBranch = options.branch;
  } else {
    throw new Error('Either --branch or --new-branch is required');
  }

  // Compute path from repo name + branch if not provided
  const branchForPath = newBranch || targetBranch;
  const worktreePath = options.path || (await generateDefaultPath(branchForPath));

  if (await exists(worktreePath)) {
    throw new Error(`Path already exists: ${worktreePath}`);
  }

  // Create worktree
  await addWorktree(worktreePath, targetBranch, newBranch);

  // Copy configured files
  const config = await loadConfig();
  if (config && config.filesToCopy.length > 0) {
    await copyFiles(repoRoot, worktreePath, config.filesToCopy);
  }

  // Launch editor unless --no-editor
  if (!options.noEditor && config && config.editor.type !== 'none') {
    await launchEditor(config.editor, worktreePath);
  }
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

  // Prompt for branch selection with built-in search
  // Cliffy's search uses substring matching by default, which works well enough
  const selection = await Select.prompt({
    message: 'Select branch for new worktree (type to search):',
    options,
    search: true,
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
      message: 'Select base branch (type to search):',
      options: [
        ...branches.local.map((branch) => ({ name: `  ${branch}`, value: branch })),
        ...branches.remote.map((branch) => ({ name: `  ${branch}`, value: branch })),
      ],
      search: true,
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

  // Load or create configuration
  let config = await loadConfig();

  if (!config) {
    console.log('\nNo configuration found. Running setup wizard...\n');
    await runConfigWizard();
    config = await loadConfig();

    if (!config) {
      throw new Error('Configuration setup failed');
    }
  }

  // Copy configured files
  if (config.filesToCopy.length > 0) {
    console.log('Copying configured files...');
    await copyFiles(repoRoot, worktreePath, config.filesToCopy);
    console.log(`✓ Copied ${config.filesToCopy.length} file(s)/directory(ies)`);
  }

  // Launch editor
  if (config.editor.type !== 'none') {
    const editorName = config.editor.command || 'editor';
    console.log(`Launching ${editorName}...`);
    await launchEditor(config.editor, worktreePath);
    console.log('✓ Editor launched');
  }

  console.log('');
  console.log(`Worktree ready at: ${worktreePath}`);
}
