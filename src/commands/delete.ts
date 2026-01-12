import { Confirm } from '@cliffy/prompt';
import { listWorktrees, removeWorktree } from '../git/worktree.ts';
import { isGitRepo } from '../git/repo.ts';
import { NotInGitRepoError, WorktreeNotFoundError } from '../utils/errors.ts';

export async function deleteCommand(target: string): Promise<void> {
  // Check if in git repository
  if (!(await isGitRepo())) {
    throw new NotInGitRepoError();
  }

  // List all worktrees
  const worktrees = await listWorktrees();

  // Find worktree by path or branch name
  const worktree = worktrees.find((wt) => wt.path === target || wt.branch === target);

  if (!worktree) {
    throw new WorktreeNotFoundError(target);
  }

  // Show confirmation prompt
  const confirmed = await Confirm.prompt({
    message: `Delete worktree at ${worktree.path} (branch: ${worktree.branch})?`,
    default: false,
  });

  if (!confirmed) {
    console.log('Deletion cancelled.');
    return;
  }

  // Remove worktree
  await removeWorktree(worktree.path);

  console.log(`Worktree deleted: ${worktree.path}`);
}
