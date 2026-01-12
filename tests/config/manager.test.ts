import { assert, assertEquals } from '@std/assert';
import { join } from '@std/path';
import { exists } from '@std/fs';
import { createTempGitRepo } from '../helpers/git-test-repo.ts';
import { loadConfig, saveConfig } from '../../src/config/manager.ts';

Deno.test('loadConfig returns null when config does not exist', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    const config = await loadConfig();
    assertEquals(config, null);
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('saveConfig creates .gwt/config with v2.0 format', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    await saveConfig({
      editor: { type: 'custom', command: 'idea' },
      filesToCopy: ['.idea', '.env'],
    });

    const configPath = join(tempRepo.path, '.gwt', 'config');
    assert(await exists(configPath));

    const config = await loadConfig();
    assertEquals(config?.version, '2.0');
    assertEquals(config?.editor.type, 'custom');
    assertEquals(config?.editor.command, 'idea');
    assertEquals(config?.filesToCopy, ['.idea', '.env']);
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('saveConfig updates existing config', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    // Save initial config
    await saveConfig({
      editor: { type: 'custom', command: 'idea' },
      filesToCopy: ['.idea'],
    });
    let config = await loadConfig();
    assertEquals(config?.editor.command, 'idea');

    // Update config
    await saveConfig({
      editor: { type: 'custom', command: 'rubymine' },
      filesToCopy: ['.idea', '.env'],
    });
    config = await loadConfig();
    assertEquals(config?.editor.command, 'rubymine');
    assertEquals(config?.filesToCopy, ['.idea', '.env']);
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('loadConfig returns null when not in git repository', async () => {
  const tempDir = await Deno.makeTempDir({ prefix: 'gwt-not-git-' });
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempDir);

    const config = await loadConfig();
    assertEquals(config, null);
  } finally {
    Deno.chdir(originalCwd);
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test('loadConfig auto-migrates v1.0 config to v2.0', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    // Create a v1.0 config file manually
    const configDir = join(tempRepo.path, '.gwt');
    await Deno.mkdir(configDir, { recursive: true });
    const configPath = join(configDir, 'config');
    await Deno.writeTextFile(
      configPath,
      JSON.stringify({ version: '1.0', ide: 'idea' }, null, 2),
    );

    // Load config - should auto-migrate
    const config = await loadConfig();
    assertEquals(config?.version, '2.0');
    assertEquals(config?.editor.type, 'custom');
    assertEquals(config?.editor.command, 'idea');
    assertEquals(config?.filesToCopy, []);
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('saveConfig saves v2.0 format', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    await saveConfig({
      editor: { type: 'custom', command: 'code' },
      filesToCopy: ['.vscode', '.env'],
    });

    const config = await loadConfig();
    assertEquals(config?.version, '2.0');
    assertEquals(config?.editor.type, 'custom');
    assertEquals(config?.editor.command, 'code');
    assertEquals(config?.filesToCopy, ['.vscode', '.env']);
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});

Deno.test('saveConfig with editor type "none" has no command', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    await saveConfig({
      editor: { type: 'none' },
      filesToCopy: ['.env'],
    });

    const config = await loadConfig();
    assertEquals(config?.editor.type, 'none');
    assertEquals(config?.editor.command, undefined);
  } finally {
    Deno.chdir(originalCwd);
    await tempRepo.cleanup();
  }
});
