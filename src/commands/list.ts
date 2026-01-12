import { Table } from '@cliffy/table';
import { listWorktrees } from '../git/worktree.ts';
import { isGitRepo } from '../git/repo.ts';
import { NotInGitRepoError } from '../utils/errors.ts';

export async function listCommand(): Promise<void> {
  // Check if in git repository
  if (!(await isGitRepo())) {
    throw new NotInGitRepoError();
  }

  // Get all worktrees
  const worktrees = await listWorktrees();

  if (worktrees.length === 0) {
    console.log('No worktrees found.');
    return;
  }

  // Create table
  const table = new Table()
    .header(['Path', 'Branch', 'Commit'])
    .body(
      worktrees.map((wt) => [
        wt.path,
        wt.branch,
        wt.commit.substring(0, 7), // Short commit hash
      ])
    )
    .border();

  table.render();
}
