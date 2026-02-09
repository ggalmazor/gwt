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

import { Confirm, Select } from '@cliffy/prompt';
import { listWorktrees, removeWorktree } from '../git/worktree.ts';
import { getRepoRoot, isGitRepo } from '../git/repo.ts';
import { NotInGitRepoError, WorktreeNotFoundError } from '../utils/errors.ts';

/**
 * Delete a worktree non-interactively (for testing).
 * @param target - the path or branch name of the worktree to delete
 * @param force - force removal even with uncommitted changes
 */
export async function deleteWorktreeNonInteractive(target: string, force = false): Promise<void> {
  // Check if in git repository
  if (!(await isGitRepo())) {
    throw new NotInGitRepoError();
  }

  // List all worktrees
  const worktrees = await listWorktrees();

  // Resolve target path if it exists (handle symlinks)
  let resolvedTarget = target;
  try {
    const stat = await Deno.stat(target);
    if (stat.isDirectory) {
      resolvedTarget = await Deno.realPath(target);
    }
  } catch {
    // Not a path, might be a branch name
  }

  // Find worktree by path or branch name
  const worktree = worktrees.find((wt) => wt.path === resolvedTarget || wt.branch === target);

  if (!worktree) {
    throw new WorktreeNotFoundError(target);
  }

  // Remove worktree
  await removeWorktree(worktree.path, force);
}

/**
 * Delete a worktree with force flag (for testing).
 * @param target - the path or branch name of the worktree to delete
 */
export async function deleteWorktreeWithForce(target: string): Promise<void> {
  await deleteWorktreeNonInteractive(target, true);
}

/**
 * Delete multiple worktrees non-interactively (for testing).
 * @param targets - array of paths or branch names of worktrees to delete
 * @param force - force removal even with uncommitted changes
 */
export async function deleteMultipleWorktreesNonInteractive(
  targets: string[],
  force = false,
): Promise<void> {
  for (const target of targets) {
    await deleteWorktreeNonInteractive(target, force);
  }
}

/**
 * Delete a worktree interactively.
 * If target is provided, delete that worktree (with confirmation).
 * If no target is provided, show a selection prompt.
 * @param target - optional path or branch name of the worktree to delete
 */
export async function deleteCommand(target?: string): Promise<void> {
  // Check if in git repository
  if (!(await isGitRepo())) {
    throw new NotInGitRepoError();
  }

  // List all worktrees
  const worktrees = await listWorktrees();

  // Get current repository root to exclude it from deletion
  const repoRoot = await getRepoRoot();

  // Filter out the main worktree (current repository)
  const linkedWorktrees = worktrees.filter((wt) => wt.path !== repoRoot);

  if (linkedWorktrees.length === 0) {
    console.log('No linked worktrees to delete.');
    console.log('Use "gwt create" to create a new worktree.');
    return;
  }

  let selectedWorktree;

  if (target) {
    // Resolve target path if it exists (handle symlinks)
    let resolvedTarget = target;
    try {
      const stat = await Deno.stat(target);
      if (stat.isDirectory) {
        resolvedTarget = await Deno.realPath(target);
      }
    } catch {
      // Not a path, might be a branch name
    }

    // Find worktree by path or branch name
    selectedWorktree = worktrees.find((wt) => wt.path === resolvedTarget || wt.branch === target);

    if (!selectedWorktree) {
      throw new WorktreeNotFoundError(target);
    }

    // Prevent deletion of main worktree
    if (selectedWorktree.path === repoRoot) {
      throw new Error('Cannot delete the main worktree');
    }
  } else {
    // Interactive selection
    const selection = await Select.prompt({
      message: 'Select worktree to delete:',
      options: linkedWorktrees.map((wt) => ({
        name: `${wt.branch} (${wt.path})`,
        value: wt.path,
      })),
    });

    selectedWorktree = worktrees.find((wt) => wt.path === selection);

    if (!selectedWorktree) {
      throw new Error('Selected worktree not found');
    }
  }

  // Show confirmation prompt
  const confirmed = await Confirm.prompt({
    message: `Delete worktree at ${selectedWorktree.path} (branch: ${selectedWorktree.branch})?`,
    default: false,
  });

  if (!confirmed) {
    console.log('Deletion cancelled.');
    return;
  }

  // Try to remove worktree
  try {
    await removeWorktree(selectedWorktree.path);
    console.log(`✓ Worktree deleted: ${selectedWorktree.path}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if the error is due to uncommitted changes or modified/untracked files
    const hasUncommittedWork = errorMessage.includes('uncommitted changes') ||
      errorMessage.includes('modified or untracked files');

    if (hasUncommittedWork) {
      console.log('\n⚠️  This worktree has uncommitted or untracked changes.');
      console.log('Deleting it will permanently lose those changes.\n');

      // Double confirmation for force deletion
      const forceConfirmed = await Confirm.prompt({
        message: 'Are you absolutely sure you want to force delete this worktree?',
        default: false,
      });

      if (!forceConfirmed) {
        console.log('Deletion cancelled.');
        return;
      }

      // Retry with force
      await removeWorktree(selectedWorktree.path, true);
      console.log(`✓ Worktree forcefully deleted: ${selectedWorktree.path}`);
    } else {
      // Re-throw other errors
      throw error;
    }
  }
}
