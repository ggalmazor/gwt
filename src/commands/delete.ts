import { Confirm, Select } from '@cliffy/prompt';
import { listWorktrees, removeWorktree } from '../git/worktree.ts';
import { isGitRepo, getRepoRoot } from '../git/repo.ts';
import { NotInGitRepoError, WorktreeNotFoundError } from '../utils/errors.ts';

/**
 * Delete a worktree non-interactively (for testing).
 * @param target - the path or branch name of the worktree to delete
 */
export async function deleteWorktreeNonInteractive(target: string): Promise<void> {
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
  await removeWorktree(worktree.path);
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

  // Remove worktree
  await removeWorktree(selectedWorktree.path);

  console.log(`✓ Worktree deleted: ${selectedWorktree.path}`);
}
