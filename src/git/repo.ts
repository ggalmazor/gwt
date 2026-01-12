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
