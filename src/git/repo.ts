/**
 * Check if the current directory is inside a git repository.
 * @returns true if inside a git repository, false otherwise
 */
export async function isGitRepo(): Promise<boolean> {
  try {
    const cmd = new Deno.Command('git', {
      args: ['rev-parse', '--git-dir'],
      stdout: 'null',
      stderr: 'null',
    });
    const output = await cmd.output();
    return output.success;
  } catch {
    return false;
  }
}

/**
 * Get the absolute path to the root of the git repository.
 * @returns the absolute path to the repository root
 * @throws Error if not in a git repository
 */
export async function getRepoRoot(): Promise<string> {
  try {
    const cmd = new Deno.Command('git', {
      args: ['rev-parse', '--show-toplevel'],
      stdout: 'piped',
      stderr: 'piped',
    });
    const output = await cmd.output();

    if (!output.success) {
      throw new Error('Not in a git repository');
    }

    const path = new TextDecoder().decode(output.stdout).trim();
    return path;
  } catch (error) {
    if (error instanceof Error && error.message === 'Not in a git repository') {
      throw error;
    }
    throw new Error('Not in a git repository');
  }
}
