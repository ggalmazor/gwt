#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

/**
 * Release script for gwt.
 *
 * Usage:
 *   deno task release patch|minor|major
 *
 * This script:
 * 1. Computes the next semver version based on release type
 * 2. Checks for uncommitted changes
 * 3. Runs lint and tests to ensure code quality
 * 4. Asks for confirmation (including CHANGELOG update check)
 * 5. Updates src/version.ts and deno.json
 * 6. Creates a git commit and tag
 * 7. Asks for confirmation before pushing
 */

import { VERSION } from '../src/version.ts';

type ReleaseType = 'patch' | 'minor' | 'major';

function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

function computeNextVersion(current: string, releaseType: ReleaseType): string {
  const { major, minor, patch } = parseVersion(current);

  switch (releaseType) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
  }
}

async function prompt(message: string): Promise<string> {
  const buf = new Uint8Array(1024);
  await Deno.stdout.write(new TextEncoder().encode(message));
  const n = await Deno.stdin.read(buf);
  if (n === null) return '';
  return new TextDecoder().decode(buf.subarray(0, n)).trim();
}

async function confirm(message: string): Promise<boolean> {
  const answer = await prompt(`${message} [y/N] `);
  return answer.toLowerCase() === 'y';
}

async function run(
  cmd: string[],
  options?: { cwd?: string },
): Promise<{ success: boolean; output: string }> {
  const command = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    cwd: options?.cwd,
    stdout: 'piped',
    stderr: 'piped',
  });

  const { success, stdout, stderr } = await command.output();
  const output = new TextDecoder().decode(success ? stdout : stderr);
  return { success, output };
}

async function runWithOutput(cmd: string[]): Promise<boolean> {
  const command = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdout: 'inherit',
    stderr: 'inherit',
  });

  const { success } = await command.output();
  return success;
}

async function updateVersionFile(newVersion: string): Promise<void> {
  const content = `/**
 * Central version management for gwt.
 * This is the single source of truth for the application version.
 */
export const VERSION = '${newVersion}';
`;
  await Deno.writeTextFile('src/version.ts', content);
}

async function updateDenoJson(newVersion: string): Promise<void> {
  const content = await Deno.readTextFile('deno.json');
  const json = JSON.parse(content);
  json.version = newVersion;
  await Deno.writeTextFile('deno.json', JSON.stringify(json, null, 2) + '\n');
}

async function hasUncommittedChanges(): Promise<boolean> {
  const { output } = await run(['git', 'status', '--porcelain']);
  return output.trim().length > 0;
}

async function getCurrentBranch(): Promise<string> {
  const { output } = await run(['git', 'rev-parse', '--abbrev-ref', 'HEAD']);
  return output.trim();
}

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.length !== 1 || !['patch', 'minor', 'major'].includes(args[0])) {
    console.error('Usage: deno task release patch|minor|major');
    Deno.exit(1);
  }

  const releaseType = args[0] as ReleaseType;
  const currentVersion = VERSION;
  const nextVersion = computeNextVersion(currentVersion, releaseType);
  const tagName = `v${nextVersion}`;

  console.log('');
  console.log('=== gwt Release Script ===');
  console.log('');
  console.log(`Current version: ${currentVersion}`);
  console.log(`Release type:    ${releaseType}`);
  console.log(`Next version:    ${nextVersion}`);
  console.log(`Git tag:         ${tagName}`);
  console.log('');

  // Check for uncommitted changes
  if (await hasUncommittedChanges()) {
    console.error('Error: You have uncommitted changes. Please commit or stash them first.');
    Deno.exit(1);
  }

  // Check current branch
  const branch = await getCurrentBranch();
  if (branch !== 'main') {
    console.log(`Warning: You are on branch '${branch}', not 'main'.`);
    if (!await confirm('Continue anyway?')) {
      console.log('Release cancelled.');
      Deno.exit(0);
    }
  }

  // Run lint
  console.log('Running lint...');
  console.log('');
  const lintSuccess = await runWithOutput(['deno', 'lint']);
  if (!lintSuccess) {
    console.error('');
    console.error('Error: Lint failed. Please fix the issues before releasing.');
    Deno.exit(1);
  }
  console.log('');

  // Run tests
  console.log('Running tests...');
  console.log('');
  const testSuccess = await runWithOutput([
    'deno',
    'test',
    '--allow-run',
    '--allow-read',
    '--allow-write',
    '--allow-env',
  ]);
  if (!testSuccess) {
    console.error('');
    console.error('Error: Tests failed. Please fix the issues before releasing.');
    Deno.exit(1);
  }
  console.log('');

  // Ask about CHANGELOG
  console.log('Before releasing, please ensure:');
  console.log('  1. CHANGELOG.md has been updated with the new version');
  console.log('  2. All changes are documented under the new version section');
  console.log('');

  if (!await confirm('Has CHANGELOG.md been updated for this release?')) {
    console.log('');
    console.log('Please update CHANGELOG.md before releasing.');
    console.log('Add a new section for version ' + nextVersion + ' with your changes.');
    Deno.exit(0);
  }

  // Confirm release
  if (!await confirm(`Proceed with releasing v${nextVersion}?`)) {
    console.log('Release cancelled.');
    Deno.exit(0);
  }

  console.log('');
  console.log('Updating version files...');

  // Update version files
  await updateVersionFile(nextVersion);
  console.log('  - Updated src/version.ts');

  await updateDenoJson(nextVersion);
  console.log('  - Updated deno.json');

  // Stage and commit
  console.log('');
  console.log('Creating git commit...');

  await run(['git', 'add', 'src/version.ts', 'deno.json']);
  const commitResult = await run(['git', 'commit', '-m', `chore: bump version to ${nextVersion}`]);

  if (!commitResult.success) {
    console.error('Error creating commit:', commitResult.output);
    Deno.exit(1);
  }
  console.log(`  - Created commit: chore: bump version to ${nextVersion}`);

  // Create tag
  console.log('');
  console.log('Creating git tag...');

  const tagResult = await run(['git', 'tag', '-a', tagName, '-m', `Release ${tagName}`]);

  if (!tagResult.success) {
    console.error('Error creating tag:', tagResult.output);
    Deno.exit(1);
  }
  console.log(`  - Created tag: ${tagName}`);

  // Confirm push
  console.log('');
  console.log('The release has been prepared locally.');
  console.log('');

  if (await confirm(`Push commit and tag '${tagName}' to origin?`)) {
    console.log('');
    console.log('Pushing to origin...');

    const pushCommit = await run(['git', 'push']);
    if (!pushCommit.success) {
      console.error('Error pushing commit:', pushCommit.output);
      Deno.exit(1);
    }
    console.log('  - Pushed commit');

    const pushTag = await run(['git', 'push', 'origin', tagName]);
    if (!pushTag.success) {
      console.error('Error pushing tag:', pushTag.output);
      Deno.exit(1);
    }
    console.log(`  - Pushed tag: ${tagName}`);

    console.log('');
    console.log(`Release ${tagName} completed successfully!`);
  } else {
    console.log('');
    console.log('Release prepared but not pushed.');
    console.log('To push manually, run:');
    console.log('  git push');
    console.log(`  git push origin ${tagName}`);
  }
}

main();
