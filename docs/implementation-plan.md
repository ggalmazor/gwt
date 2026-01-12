# Git Worktree CLI Tool (gwt) - Implementation Plan

## Overview

Build a TypeScript/Deno CLI tool to manage git worktrees with interactive branch selection, automatic file copying (.idea, .env*), and JetBrains IDE launching.

## Development Approach

### Test-Driven Development (TDD)

This project will be built using strict TDD:

1. **Red**: Write a failing test that defines desired behavior
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Clean up code while keeping tests green
4. **Commit**: Commit after each green test cycle

### Grey-Box Testing Strategy

- **Focus on observable behavior**: Test inputs and outputs, not internal implementation
- **Minimize mocks**: Use real git operations in temporary repositories
- **Integration-heavy**: Prefer end-to-end tests over isolated unit tests
- **Test through public interfaces**: Test commands as a user would invoke them

### Commit Strategy

- Commit after every test goes green (small, frequent commits)
- Commit message format: `test: <description>` or `feat: <description>`
- Each commit should represent a working, tested increment
- Keep commits atomic and focused on single behavior

## Technical Stack

- **Runtime**: Deno 2.6.4 (managed via ASDF)
- **Language**: TypeScript
- **CLI Framework**: Cliffy (commands + interactive prompts)
- **Testing**: Deno's built-in test framework
- **Compilation**: `deno compile` to standalone executable

## Project Structure

```
gwt/
├── .tool-versions           # ASDF: deno 2.6.4
├── deno.json                # Deno config, deps, tasks
├── CLAUDE.md                # Building guidelines for AI assistants
├── docs/
│   └── implementation-plan.md
├── main.ts                  # Entry point, CLI command registration
├── src/
│   ├── commands/
│   │   ├── list.ts         # List worktrees
│   │   ├── create.ts       # Interactive worktree creation
│   │   ├── delete.ts       # Delete worktree
│   │   └── config.ts       # Config management
│   ├── git/
│   │   ├── worktree.ts     # Worktree operations (list, add, remove)
│   │   ├── branch.ts       # Branch listing (local + remote)
│   │   └── repo.ts         # Repo validation, get root
│   ├── ide/
│   │   ├── launcher.ts     # IDE detection & launching
│   │   └── types.ts        # IDE constants
│   ├── config/
│   │   ├── manager.ts      # Read/write .gwt/config
│   │   └── types.ts        # Config types
│   ├── copy/
│   │   ├── idea.ts         # Copy .idea directory
│   │   └── env.ts          # Copy .env* files
│   └── utils/
│       ├── prompts.ts      # Reusable prompts
│       ├── errors.ts       # Custom error types
│       └── format.ts       # Output formatting
└── tests/
    ├── helpers/
    │   └── git-test-repo.ts # Helper to create temp git repos
    ├── commands/
    ├── git/
    ├── ide/
    ├── config/
    └── integration/
```

## CLI Commands

```bash
gwt list|ls                  # List all worktrees
gwt create|add               # Interactive worktree creation
gwt delete|remove <target>   # Delete worktree (by path or branch)
gwt config                   # View current config
gwt config set <ide>         # Set IDE preference
```

## TDD Implementation Steps

### Phase 1: Project Setup & Test Infrastructure

**Test First**: No application code yet, just setup

1. Create `.tool-versions` with `deno 2.6.4`
2. Run `asdf install`
3. Create `deno.json` with dependencies and tasks
4. Create `tests/helpers/git-test-repo.ts`:
   - Helper to create temporary git repositories
   - Helper to initialize git, create commits
   - Helper to cleanup temp repos
5. **Commit**: `chore: initial project setup`

### Phase 2: Git Repository Detection (TDD Cycle 1)

**Red Phase**:

```typescript
// tests/git/repo.test.ts
Deno.test('isGitRepo returns true when inside git repository', async () => {
  const tempRepo = await createTempGitRepo();
  Deno.chdir(tempRepo.path);
  assertEquals(await isGitRepo(), true);
  await tempRepo.cleanup();
});

Deno.test('isGitRepo returns false when not in git repository', async () => {
  const tempDir = await Deno.makeTempDir();
  Deno.chdir(tempDir);
  assertEquals(await isGitRepo(), false);
  await Deno.remove(tempDir, { recursive: true });
});
```

**Green Phase**:

```typescript
// src/git/repo.ts
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
```

**Commit**: `test: add git repository detection`

### Phase 3: Get Repository Root (TDD Cycle 2)

**Red Phase**:

```typescript
// tests/git/repo.test.ts
Deno.test('getRepoRoot returns absolute path to repo root', async () => {
  const tempRepo = await createTempGitRepo();
  Deno.chdir(tempRepo.path);
  const root = await getRepoRoot();
  assertEquals(root, tempRepo.path);
  await tempRepo.cleanup();
});

Deno.test('getRepoRoot throws when not in git repository', async () => {
  const tempDir = await Deno.makeTempDir();
  Deno.chdir(tempDir);
  await assertRejects(() => getRepoRoot());
  await Deno.remove(tempDir, { recursive: true });
});
```

**Green Phase**: Implement `getRepoRoot()`

**Commit**: `test: add repository root detection`

### Phase 4: List Worktrees (TDD Cycle 3)

**Red Phase**:

```typescript
// tests/git/worktree.test.ts
Deno.test('listWorktrees returns empty array when no worktrees exist', async () => {
  const tempRepo = await createTempGitRepo();
  Deno.chdir(tempRepo.path);
  const worktrees = await listWorktrees();
  assertEquals(worktrees.length, 1); // Main worktree always exists
  assertEquals(worktrees[0].branch, 'main');
  await tempRepo.cleanup();
});

Deno.test('listWorktrees includes all worktrees', async () => {
  const tempRepo = await createTempGitRepo();
  await tempRepo.createWorktree('feature-branch', '../feature-wt');
  const worktrees = await listWorktrees();
  assertEquals(worktrees.length, 2);
  assert(worktrees.some((wt) => wt.branch === 'feature-branch'));
  await tempRepo.cleanup();
});
```

**Green Phase**: Implement `listWorktrees()` with porcelain parsing

**Commit**: `test: add worktree listing`

### Phase 5: Create Worktree (TDD Cycle 4)

**Red Phase**:

```typescript
// tests/git/worktree.test.ts
Deno.test('addWorktree creates worktree for existing branch', async () => {
  const tempRepo = await createTempGitRepo();
  await tempRepo.createBranch('feature');

  const wtPath = await Deno.makeTempDir();
  await addWorktree(wtPath, 'feature');

  const worktrees = await listWorktrees();
  assert(worktrees.some((wt) => wt.branch === 'feature'));

  await tempRepo.cleanup();
});

Deno.test('addWorktree creates new branch when newBranch specified', async () => {
  const tempRepo = await createTempGitRepo();

  const wtPath = await Deno.makeTempDir();
  await addWorktree(wtPath, 'main', 'new-feature');

  const worktrees = await listWorktrees();
  assert(worktrees.some((wt) => wt.branch === 'new-feature'));

  await tempRepo.cleanup();
});
```

**Green Phase**: Implement `addWorktree()`

**Commit**: `test: add worktree creation`

### Phase 6: Delete Worktree (TDD Cycle 5)

**Red Phase**:

```typescript
// tests/git/worktree.test.ts
Deno.test('removeWorktree deletes worktree', async () => {
  const tempRepo = await createTempGitRepo();
  const wtPath = await Deno.makeTempDir();
  await addWorktree(wtPath, 'main', 'feature');

  await removeWorktree(wtPath);

  const worktrees = await listWorktrees();
  assertEquals(worktrees.length, 1); // Only main remains

  await tempRepo.cleanup();
});
```

**Green Phase**: Implement `removeWorktree()`

**Commit**: `test: add worktree deletion`

### Phase 7: List Branches (TDD Cycle 6)

**Red Phase**:

```typescript
// tests/git/branch.test.ts
Deno.test('listBranches returns local and remote branches', async () => {
  const tempRepo = await createTempGitRepo();
  await tempRepo.createBranch('feature-1');
  await tempRepo.createBranch('feature-2');
  await tempRepo.addRemote('origin', 'https://example.com/repo.git');
  await tempRepo.createRemoteBranch('origin/develop');

  const branches = await listBranches();

  assert(branches.local.includes('main'));
  assert(branches.local.includes('feature-1'));
  assert(branches.remote.includes('origin/develop'));

  await tempRepo.cleanup();
});
```

**Green Phase**: Implement `listBranches()`

**Commit**: `test: add branch listing`

### Phase 8: Config Management (TDD Cycle 7)

**Red Phase**:

```typescript
// tests/config/manager.test.ts
Deno.test('loadConfig returns null when config does not exist', async () => {
  const tempRepo = await createTempGitRepo();
  Deno.chdir(tempRepo.path);

  const config = await loadConfig();
  assertEquals(config, null);

  await tempRepo.cleanup();
});

Deno.test('saveConfig creates .gwt/config with IDE preference', async () => {
  const tempRepo = await createTempGitRepo();
  Deno.chdir(tempRepo.path);

  await saveConfig({ ide: 'idea' });

  const configPath = join(tempRepo.path, '.gwt', 'config');
  assert(await exists(configPath));

  const config = await loadConfig();
  assertEquals(config?.ide, 'idea');

  await tempRepo.cleanup();
});
```

**Green Phase**: Implement config read/write

**Commit**: `test: add config management`

### Phase 9: Copy .idea Directory (TDD Cycle 8)

**Red Phase**:

```typescript
// tests/copy/idea.test.ts
Deno.test('copyIdeaDir copies .idea directory to destination', async () => {
  const tempRepo = await createTempGitRepo();
  const ideaDir = join(tempRepo.path, '.idea');
  await Deno.mkdir(ideaDir);
  await Deno.writeTextFile(join(ideaDir, 'modules.xml'), '<modules/>');

  const destPath = await Deno.makeTempDir();
  await copyIdeaDir(tempRepo.path, destPath);

  const copiedFile = join(destPath, '.idea', 'modules.xml');
  assert(await exists(copiedFile));

  await tempRepo.cleanup();
});

Deno.test('copyIdeaDir does nothing when .idea does not exist', async () => {
  const tempRepo = await createTempGitRepo();
  const destPath = await Deno.makeTempDir();

  await copyIdeaDir(tempRepo.path, destPath);

  const ideaDir = join(destPath, '.idea');
  assertEquals(await exists(ideaDir), false);

  await tempRepo.cleanup();
});
```

**Green Phase**: Implement `.idea` copying

**Commit**: `test: add .idea directory copying`

### Phase 10: Copy .env Files (TDD Cycle 9)

**Red Phase**:

```typescript
// tests/copy/env.test.ts
Deno.test('copyEnvFiles copies all .env* files', async () => {
  const tempRepo = await createTempGitRepo();
  await Deno.writeTextFile(join(tempRepo.path, '.env'), 'KEY=value');
  await Deno.writeTextFile(join(tempRepo.path, '.env.database'), 'DB=test');
  await Deno.writeTextFile(join(tempRepo.path, '.env.test'), 'TEST=1');

  const destPath = await Deno.makeTempDir();
  await copyEnvFiles(tempRepo.path, destPath);

  assert(await exists(join(destPath, '.env')));
  assert(await exists(join(destPath, '.env.database')));
  assert(await exists(join(destPath, '.env.test')));

  await tempRepo.cleanup();
});

Deno.test('copyEnvFiles skips nested .env files', async () => {
  const tempRepo = await createTempGitRepo();
  const subdir = join(tempRepo.path, 'config');
  await Deno.mkdir(subdir);
  await Deno.writeTextFile(join(subdir, '.env.local'), 'LOCAL=1');

  const destPath = await Deno.makeTempDir();
  await copyEnvFiles(tempRepo.path, destPath);

  assertEquals(await exists(join(destPath, 'config', '.env.local')), false);

  await tempRepo.cleanup();
});
```

**Green Phase**: Implement `.env*` file copying (root level only)

**Commit**: `test: add .env files copying`

### Phase 11: List Command (TDD Cycle 10)

**Red Phase**:

```typescript
// tests/commands/list.test.ts
Deno.test('list command displays worktrees in table format', async () => {
  const tempRepo = await createTempGitRepo();
  await tempRepo.createWorktree('feature', '../feature-wt');
  Deno.chdir(tempRepo.path);

  // Capture stdout
  const output = await captureCommandOutput(() => listWorktrees());

  assert(output.includes('main'));
  assert(output.includes('feature'));

  await tempRepo.cleanup();
});
```

**Green Phase**: Implement list command with table formatting

**Commit**: `feat: add list command`

### Phase 12: Delete Command (TDD Cycle 11)

**Red Phase**:

```typescript
// tests/commands/delete.test.ts
Deno.test('delete command removes worktree by branch name', async () => {
  const tempRepo = await createTempGitRepo();
  const wtPath = await Deno.makeTempDir();
  await addWorktree(wtPath, 'main', 'feature');

  await deleteWorktree('feature');

  const worktrees = await listWorktrees();
  assertEquals(worktrees.length, 1);

  await tempRepo.cleanup();
});
```

**Green Phase**: Implement delete command

**Commit**: `feat: add delete command`

### Phase 13: IDE Detection (TDD Cycle 12)

**Red Phase**:

```typescript
// tests/ide/launcher.test.ts
Deno.test('detectAvailableIDEs returns IDEs available in PATH', async () => {
  // This test verifies actual system state
  const ides = await detectAvailableIDEs();

  assert(Array.isArray(ides));
  // At least one IDE should be available on dev machine
  // This is a grey-box test - we verify behavior without mocking
});
```

**Green Phase**: Implement IDE detection using `which` command

**Commit**: `test: add IDE detection`

### Phase 14: Integration Test - Full Create Flow (TDD Cycle 13)

**Red Phase**:

```typescript
// tests/integration/create.test.ts
Deno.test('create command: full workflow without IDE launch', async () => {
  const tempRepo = await createTempGitRepo();
  await tempRepo.createBranch('feature');

  // Setup source repo with .idea and .env
  const ideaDir = join(tempRepo.path, '.idea');
  await Deno.mkdir(ideaDir);
  await Deno.writeTextFile(join(ideaDir, 'modules.xml'), '<modules/>');
  await Deno.writeTextFile(join(tempRepo.path, '.env'), 'KEY=value');

  Deno.chdir(tempRepo.path);

  // Mock user input programmatically (select 'feature' branch, specify path)
  const wtPath = await Deno.makeTempDir();

  // Call create command with programmatic inputs (no actual prompts)
  await createWorktreeNonInteractive({
    branch: 'feature',
    path: wtPath,
    skipIde: true, // Don't launch IDE in test
  });

  // Verify worktree exists
  const worktrees = await listWorktrees();
  assert(worktrees.some((wt) => wt.branch === 'feature'));

  // Verify .idea was copied
  assert(await exists(join(wtPath, '.idea', 'modules.xml')));

  // Verify .env was copied
  assert(await exists(join(wtPath, '.env')));

  await tempRepo.cleanup();
});
```

**Green Phase**: Implement full create workflow (non-interactive variant for testing)

**Commit**: `test: add create command integration test`

### Phase 15: Interactive Create Command (TDD Cycle 14)

**Note**: Interactive prompts are harder to test automatically. Strategy:

- Separate prompt logic from business logic
- Test business logic thoroughly (already done)
- Create non-interactive variant that accepts all inputs as parameters
- Interactive variant delegates to non-interactive after gathering inputs

**Red Phase**:

```typescript
// tests/commands/create.test.ts
Deno.test('create command validates worktree path does not exist', async () => {
  const tempRepo = await createTempGitRepo();
  await tempRepo.createBranch('feature');

  // Create worktree first
  const wtPath = await Deno.makeTempDir();
  await createWorktreeNonInteractive({
    branch: 'feature',
    path: wtPath,
    skipIde: true,
  });

  // Try to create again at same path
  await assertRejects(
    () =>
      createWorktreeNonInteractive({
        branch: 'feature',
        path: wtPath,
        skipIde: true,
      }),
    WorktreeExistsError,
  );

  await tempRepo.cleanup();
});
```

**Green Phase**: Add validation logic

**Commit**: `test: add worktree path validation`

### Phase 16: CLI Integration (TDD Cycle 15)

**Red Phase**:

```typescript
// tests/integration/cli.test.ts
Deno.test('CLI: gwt list shows worktrees', async () => {
  const tempRepo = await createTempGitRepo();
  await tempRepo.createWorktree('feature', '../feature-wt');

  // Execute compiled CLI
  const output = await execCli(['list'], { cwd: tempRepo.path });

  assert(output.includes('main'));
  assert(output.includes('feature'));

  await tempRepo.cleanup();
});
```

**Green Phase**: Wire up commands in `main.ts`

**Commit**: `feat: integrate commands into CLI`

### Phase 17: Compilation & Distribution

**Manual Testing** (not automated):

1. `deno task compile`
2. Test binary: `./gwt list`, `./gwt create`, etc.
3. Verify on different platforms if possible

**Commit**: `build: add compilation support`

## Grey-Box Testing Principles Applied

### What We Test

- **Observable behavior**: Command outputs, file system changes, git state changes
- **Real git operations**: Use actual `git` commands in temporary repositories
- **Public interfaces**: Test through CLI commands and exported functions
- **Error conditions**: Invalid inputs, missing files, wrong directories

### What We Don't Test

- **Internal implementation details**: How parsing is done, intermediate data structures
- **Private functions**: Only test through public APIs
- **Exact string formatting**: Test that output contains key info, not exact format

### Avoiding Mocks

- Use **real temporary git repositories** instead of mocking git commands
- Use **real file system operations** in temporary directories
- Only mock when absolutely necessary (e.g., interactive prompts in automated tests)
- Provide **non-interactive variants** of commands for testing

## Verification Checklist

After implementation, verify:

### Functional Tests (Automated)

- [ ] All unit tests pass (`deno test`)
- [ ] All integration tests pass
- [ ] Test coverage for edge cases
- [ ] Error scenarios properly tested

### Manual Testing

- [ ] `gwt list` shows existing worktrees in table format
- [ ] `gwt create` shows interactive branch selection
- [ ] Creating worktree copies `.idea` directory
- [ ] Creating worktree copies all `.env*` files
- [ ] First create prompts for IDE, saves to `.gwt/config`
- [ ] Subsequent creates use saved IDE preference
- [ ] IDE launches at correct path
- [ ] `gwt delete <branch>` removes worktree
- [ ] `gwt config` shows current settings
- [ ] `gwt config set <ide>` updates preference
- [ ] Compiled binary works without Deno installed

### Edge Cases

- [ ] Error when not in git repo
- [ ] Error when worktree path exists
- [ ] Works when no `.idea` directory
- [ ] Works when no `.env` files
- [ ] Remote branch creates tracking branch
- [ ] Branch names with `/` sanitized in paths
- [ ] Can delete by path or branch name

## Dependencies (deno.json)

```json
{
  "imports": {
    "@cliffy/command": "jsr:@cliffy/command@^1.0.0-rc.7",
    "@cliffy/prompt": "jsr:@cliffy/prompt@^1.0.0-rc.7",
    "@cliffy/table": "jsr:@cliffy/table@^1.0.0-rc.7",
    "@std/path": "jsr:@std/path@^1.0.0",
    "@std/fs": "jsr:@std/fs@^1.0.0",
    "@std/jsonc": "jsr:@std/jsonc@^1.0.0"
  },
  "tasks": {
    "dev": "deno run --allow-run --allow-read --allow-write --allow-env main.ts",
    "test": "deno test --allow-run --allow-read --allow-write --allow-env",
    "compile": "deno compile --allow-run --allow-read --allow-write --allow-env --output=gwt main.ts"
  }
}
```

## Permissions Required

- `--allow-run`: Execute git commands, IDE launchers, which/where
- `--allow-read`: Read git repo, config files, .idea, .env files
- `--allow-write`: Write config files, copy files to worktrees
- `--allow-env`: Optional, for git environment variables
