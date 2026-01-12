# Building Guidelines for AI Assistants

This document provides guidelines for AI assistants (like Claude) when working on the gwt (Git Worktree Manager) project.

## Development Philosophy

### Test-Driven Development (TDD)

This project follows strict TDD:

1. **Write a failing test first** (Red)
2. **Write minimal code to pass the test** (Green)
3. **Refactor while keeping tests green**
4. **Commit after every green cycle**

**Never write production code without a failing test first.**

### Grey-Box Testing Approach

- **Test observable behavior**, not implementation details
- **Use real git repositories** (temporary) instead of mocks
- **Favor integration tests** over isolated unit tests
- **Avoid mocking** except when absolutely necessary (e.g., interactive prompts)

### Commit Strategy

- Commit after **every test goes green**
- Use **small, atomic commits**
- Commit message format:
  - `test: <description>` - for tests and test infrastructure
  - `feat: <description>` - for features
  - `fix: <description>` - for bug fixes
  - `refactor: <description>` - for refactoring
  - `chore: <description>` - for tooling/setup
  - `build: <description>` - for build/compilation

## Project Structure

```
gwt/
├── .tool-versions           # ASDF: deno 2.6.4
├── deno.json                # Deno config, deps, tasks
├── CLAUDE.md                # This file
├── docs/
│   └── implementation-plan.md
├── main.ts                  # CLI entry point
├── src/                     # Source code
│   ├── commands/            # CLI commands
│   ├── git/                 # Git operations
│   ├── ide/                 # IDE detection & launching
│   ├── config/              # Configuration management
│   ├── copy/                # File copying utilities
│   └── utils/               # Shared utilities
└── tests/                   # Tests mirror src/ structure
    ├── helpers/             # Test utilities
    ├── commands/
    ├── git/
    ├── ide/
    ├── config/
    └── integration/
```

## TDD Workflow

### 1. Before Writing Any Code

- Read the implementation plan (`docs/implementation-plan.md`)
- Identify the next TDD cycle to implement
- Understand the expected behavior

### 2. Red Phase

Create a test file in `tests/` that mirrors the source structure:

- If implementing `src/git/repo.ts`, create `tests/git/repo.test.ts`
- Write one or more tests that define the expected behavior
- Tests should **fail** when first run
- Run `deno test` to confirm failure

Example:

```typescript
// tests/git/repo.test.ts
import { assertEquals } from '@std/assert';
import { isGitRepo } from '../../src/git/repo.ts';

Deno.test('isGitRepo returns true when inside git repository', async () => {
  const tempRepo = await createTempGitRepo();
  Deno.chdir(tempRepo.path);
  assertEquals(await isGitRepo(), true);
  await tempRepo.cleanup();
});
```

### 3. Green Phase

- Create the corresponding source file in `src/`
- Write **minimal code** to make the test pass
- Avoid over-engineering or adding features not tested
- Run `deno test` until all tests pass

Example:

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

### 4. Refactor Phase

- Clean up code while keeping tests green
- Extract duplicated logic
- Improve naming
- Run `deno test` frequently to ensure tests still pass

### 5. Commit

```bash
git add tests/git/repo.test.ts src/git/repo.ts
git commit -m "test: add git repository detection"
```

### 6. Repeat

Move to the next TDD cycle in the implementation plan.

## Testing Guidelines

### Use Real Git Repositories

Create temporary git repositories for tests:

```typescript
// tests/helpers/git-test-repo.ts
export async function createTempGitRepo() {
  const path = await Deno.makeTempDir();

  // Initialize git repo
  await new Deno.Command('git', {
    args: ['init'],
    cwd: path,
  }).output();

  // Configure git
  await new Deno.Command('git', {
    args: ['config', 'user.email', 'test@example.com'],
    cwd: path,
  }).output();

  await new Deno.Command('git', {
    args: ['config', 'user.name', 'Test User'],
    cwd: path,
  }).output();

  // Create initial commit
  await Deno.writeTextFile(`${path}/README.md`, '# Test Repo');
  await new Deno.Command('git', {
    args: ['add', '.'],
    cwd: path,
  }).output();
  await new Deno.Command('git', {
    args: ['commit', '-m', 'Initial commit'],
    cwd: path,
  }).output();

  return {
    path,
    async cleanup() {
      await Deno.remove(path, { recursive: true });
    },
    async createBranch(name: string) {
      await new Deno.Command('git', {
        args: ['branch', name],
        cwd: path,
      }).output();
    },
    async createWorktree(branch: string, wtPath: string) {
      await new Deno.Command('git', {
        args: ['worktree', 'add', wtPath, branch],
        cwd: path,
      }).output();
    },
  };
}
```

### Test Observable Behavior

Focus on **what** the code does, not **how** it does it:

✅ Good:

```typescript
Deno.test('listWorktrees returns all worktrees', async () => {
  const repo = await createTempGitRepo();
  await repo.createWorktree('feature', '../feature-wt');

  const worktrees = await listWorktrees();

  assertEquals(worktrees.length, 2);
  assert(worktrees.some((wt) => wt.branch === 'feature'));

  await repo.cleanup();
});
```

❌ Bad:

```typescript
Deno.test('listWorktrees calls parseWorktreeOutput', async () => {
  // Don't test internal implementation details
  const spy = sinon.spy(parseWorktreeOutput);
  await listWorktrees();
  assert(spy.called);
});
```

### Minimize Mocking

Use real implementations whenever possible:

✅ Good:

```typescript
Deno.test('addWorktree creates worktree', async () => {
  const repo = await createTempGitRepo();
  const wtPath = await Deno.makeTempDir();

  await addWorktree(wtPath, 'main', 'feature');

  // Verify with real git command
  const worktrees = await listWorktrees();
  assert(worktrees.some((wt) => wt.branch === 'feature'));

  await repo.cleanup();
});
```

❌ Bad:

```typescript
Deno.test('addWorktree calls git command', async () => {
  // Avoid mocking git commands
  const mock = mockGitCommand();
  await addWorktree('/path', 'main', 'feature');
  assert(mock.calledWith(['worktree', 'add', ...]));
});
```

### Test Error Conditions

Test both success and failure paths:

```typescript
Deno.test('isGitRepo returns false when not in git repository', async () => {
  const tempDir = await Deno.makeTempDir();
  Deno.chdir(tempDir);

  assertEquals(await isGitRepo(), false);

  await Deno.remove(tempDir, { recursive: true });
});

Deno.test('addWorktree throws when path already exists', async () => {
  const repo = await createTempGitRepo();
  const wtPath = await Deno.makeTempDir();

  await assertRejects(
    () => addWorktree(wtPath, 'main', 'feature'),
    WorktreeExistsError,
  );

  await repo.cleanup();
});
```

### Integration Tests

Test complete workflows:

```typescript
// tests/integration/create.test.ts
Deno.test('full worktree creation workflow', async () => {
  const repo = await createTempGitRepo();

  // Setup source repo
  await Deno.mkdir(`${repo.path}/.idea`);
  await Deno.writeTextFile(`${repo.path}/.idea/modules.xml`, '<modules/>');
  await Deno.writeTextFile(`${repo.path}/.env`, 'KEY=value');
  await repo.createBranch('feature');

  Deno.chdir(repo.path);

  const wtPath = await Deno.makeTempDir();

  // Execute full workflow
  await createWorktreeNonInteractive({
    branch: 'feature',
    path: wtPath,
    skipIde: true,
  });

  // Verify all side effects
  const worktrees = await listWorktrees();
  assert(worktrees.some((wt) => wt.branch === 'feature'));
  assert(await exists(`${wtPath}/.idea/modules.xml`));
  assert(await exists(`${wtPath}/.env`));

  await repo.cleanup();
});
```

## Running Tests

```bash
# Run all tests
deno test --allow-run --allow-read --allow-write --allow-env

# Run specific test file
deno test --allow-run --allow-read --allow-write --allow-env tests/git/repo.test.ts

# Run tests in watch mode (useful during TDD)
deno test --allow-run --allow-read --allow-write --allow-env --watch

# Run tests with coverage
deno test --coverage=coverage --allow-run --allow-read --allow-write --allow-env
deno coverage coverage
```

Or use the task defined in `deno.json`:

```bash
deno task test
```

## Common Patterns

### Creating Test Helpers

Put reusable test utilities in `tests/helpers/`:

```typescript
// tests/helpers/git-test-repo.ts - Git repository setup
// tests/helpers/capture-output.ts - Capture stdout/stderr
// tests/helpers/assertions.ts - Custom assertions
```

### Handling Interactive Prompts

For functions with prompts, create **two variants**:

1. **Interactive variant** (for actual use):

```typescript
// src/commands/create.ts
export async function createWorktree() {
  const branches = await listBranches();
  const selection = await Select.prompt({
    message: 'Select branch',
    options: branches,
  });
  // ... rest of logic
}
```

2. **Non-interactive variant** (for testing):

```typescript
export async function createWorktreeNonInteractive(opts: {
  branch: string;
  path: string;
  newBranch?: string;
  skipIde?: boolean;
}) {
  // Same logic but accepts parameters instead of prompting
}
```

Test the non-interactive variant:

```typescript
Deno.test('createWorktree copies files', async () => {
  await createWorktreeNonInteractive({
    branch: 'feature',
    path: '/tmp/wt',
    skipIde: true,
  });
  // assertions...
});
```

### Error Handling

Define custom error types:

```typescript
// src/utils/errors.ts
export class GwtError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotInGitRepoError extends GwtError {}
export class WorktreeExistsError extends GwtError {}
```

Test error conditions:

```typescript
import { assertRejects } from '@std/assert';

Deno.test('throws NotInGitRepoError when not in repo', async () => {
  await assertRejects(
    () => someFunction(),
    NotInGitRepoError,
    'Not in a git repository',
  );
});
```

## Code Style

- Use **TypeScript** with strict type checking
- Use **async/await** for asynchronous code
- Use **descriptive variable names**
- Keep functions **small and focused**
- Use **early returns** to reduce nesting
- Prefer **immutability** where reasonable

## Compilation

After all tests pass, compile the executable:

```bash
deno task compile
```

This creates a standalone binary `gwt` that includes the Deno runtime.

Test the compiled binary:

```bash
./gwt list
./gwt create
```

## Summary: TDD Checklist

For each feature:

- [ ] Write failing test(s) that define expected behavior
- [ ] Run tests to confirm failure (`deno test`)
- [ ] Write minimal code to make tests pass
- [ ] Run tests to confirm success
- [ ] Refactor while keeping tests green
- [ ] Commit with descriptive message
- [ ] Move to next TDD cycle

**Remember**: Test first, code second, commit often!
