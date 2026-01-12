import { join } from '@std/path';

export interface GitTestRepo {
  path: string;
  cleanup: () => Promise<void>;
  createBranch: (name: string) => Promise<void>;
  createWorktree: (branch: string, wtPath: string) => Promise<void>;
  createRemoteBranch: (name: string) => Promise<void>;
  addRemote: (name: string, url: string) => Promise<void>;
}

export async function createTempGitRepo(): Promise<GitTestRepo> {
  const path = await Deno.makeTempDir({ prefix: 'gwt-test-' });

  // Initialize git repo
  await new Deno.Command('git', {
    args: ['init', '-b', 'main'],
    cwd: path,
    stdout: 'null',
    stderr: 'null',
  }).output();

  // Configure git
  await new Deno.Command('git', {
    args: ['config', 'user.email', 'test@example.com'],
    cwd: path,
    stdout: 'null',
    stderr: 'null',
  }).output();

  await new Deno.Command('git', {
    args: ['config', 'user.name', 'Test User'],
    cwd: path,
    stdout: 'null',
    stderr: 'null',
  }).output();

  // Create initial commit
  await Deno.writeTextFile(join(path, 'README.md'), '# Test Repo\n');
  await new Deno.Command('git', {
    args: ['add', '.'],
    cwd: path,
    stdout: 'null',
    stderr: 'null',
  }).output();

  await new Deno.Command('git', {
    args: ['commit', '-m', 'Initial commit'],
    cwd: path,
    stdout: 'null',
    stderr: 'null',
  }).output();

  return {
    path,

    async cleanup() {
      try {
        await Deno.remove(path, { recursive: true });
      } catch {
        // Ignore errors during cleanup
      }
    },

    async createBranch(name: string) {
      await new Deno.Command('git', {
        args: ['branch', name],
        cwd: path,
        stdout: 'null',
        stderr: 'null',
      }).output();
    },

    async createWorktree(branch: string, wtPath: string) {
      await new Deno.Command('git', {
        args: ['worktree', 'add', wtPath, branch],
        cwd: path,
        stdout: 'null',
        stderr: 'null',
      }).output();
    },

    async addRemote(name: string, url: string) {
      await new Deno.Command('git', {
        args: ['remote', 'add', name, url],
        cwd: path,
        stdout: 'null',
        stderr: 'null',
      }).output();
    },

    async createRemoteBranch(name: string) {
      // Create a remote-tracking branch reference without actually having a remote
      // This is a bit of a hack for testing purposes
      await new Deno.Command('git', {
        args: ['branch', '-r', name],
        cwd: path,
        stdout: 'null',
        stderr: 'null',
      }).output();
    },
  };
}
