export class GwtError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotInGitRepoError extends GwtError {
  constructor() {
    super('Not in a git repository');
  }
}

export class WorktreeExistsError extends GwtError {
  constructor(path: string) {
    super(`Worktree already exists at: ${path}`);
  }
}

export class WorktreeNotFoundError extends GwtError {
  constructor(target: string) {
    super(`Worktree not found: ${target}`);
  }
}

export class IdeNotFoundError extends GwtError {
  constructor(ide: string) {
    super(`IDE command not found: ${ide}`);
  }
}
