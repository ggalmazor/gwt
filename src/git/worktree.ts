export interface Worktree {
  path: string;
  commit: string;
  branch: string;
}

/**
 * Parse the output of `git worktree list --porcelain`.
 * Format:
 * worktree /path/to/worktree
 * HEAD <commit-sha>
 * branch refs/heads/<branch-name>
 * (blank line)
 */
function parseWorktreeList(output: string): Worktree[] {
  const worktrees: Worktree[] = [];
  const entries = output.trim().split('\n\n');

  for (const entry of entries) {
    const lines = entry.split('\n');
    let path = '';
    let commit = '';
    let branch = '';

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        path = line.substring('worktree '.length);
      } else if (line.startsWith('HEAD ')) {
        commit = line.substring('HEAD '.length);
      } else if (line.startsWith('branch ')) {
        const branchRef = line.substring('branch '.length);
        // Extract branch name from refs/heads/<branch-name>
        branch = branchRef.replace('refs/heads/', '');
      }
    }

    if (path && commit && branch) {
      worktrees.push({ path, commit, branch });
    }
  }

  return worktrees;
}

/**
 * List all git worktrees.
 * @returns array of worktrees
 */
export async function listWorktrees(): Promise<Worktree[]> {
  const cmd = new Deno.Command('git', {
    args: ['worktree', 'list', '--porcelain'],
    stdout: 'piped',
    stderr: 'piped',
  });

  const output = await cmd.output();

  if (!output.success) {
    throw new Error('Failed to list worktrees');
  }

  const stdout = new TextDecoder().decode(output.stdout);
  return parseWorktreeList(stdout);
}
