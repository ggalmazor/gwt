import { assertEquals, assert } from '@std/assert';
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

Deno.test('saveConfig creates .gwt/config with IDE preference', async () => {
  const tempRepo = await createTempGitRepo();
  const originalCwd = Deno.cwd();

  try {
    Deno.chdir(tempRepo.path);

    await saveConfig({ ide: 'idea' });

    const configPath = join(tempRepo.path, '.gwt', 'config');
    assert(await exists(configPath));

    const config = await loadConfig();
    assertEquals(config?.ide, 'idea');
    assertEquals(config?.version, '1.0');
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
    await saveConfig({ ide: 'idea' });
    let config = await loadConfig();
    assertEquals(config?.ide, 'idea');

    // Update config
    await saveConfig({ ide: 'rubymine' });
    config = await loadConfig();
    assertEquals(config?.ide, 'rubymine');
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
