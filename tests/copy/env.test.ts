import { assert, assertEquals } from '@std/assert';
import { join } from '@std/path';
import { exists } from '@std/fs';
import { createTempGitRepo } from '../helpers/git-test-repo.ts';
import { copyEnvFiles } from '../../src/copy/env.ts';

Deno.test('copyEnvFiles copies all .env* files', async () => {
  const tempRepo = await createTempGitRepo();

  try {
    // Create various .env files
    await Deno.writeTextFile(join(tempRepo.path, '.env'), 'KEY=value');
    await Deno.writeTextFile(join(tempRepo.path, '.env.database'), 'DB=test');
    await Deno.writeTextFile(join(tempRepo.path, '.env.test'), 'TEST=1');
    await Deno.writeTextFile(join(tempRepo.path, '.env.local'), 'LOCAL=true');

    const destPath = await Deno.makeTempDir({ prefix: 'gwt-dest-' });

    // Copy .env files
    await copyEnvFiles(tempRepo.path, destPath);

    // Verify all .env files were copied
    assert(await exists(join(destPath, '.env')));
    assert(await exists(join(destPath, '.env.database')));
    assert(await exists(join(destPath, '.env.test')));
    assert(await exists(join(destPath, '.env.local')));

    // Verify content is the same
    const originalContent = await Deno.readTextFile(join(tempRepo.path, '.env'));
    const copiedContent = await Deno.readTextFile(join(destPath, '.env'));
    assertEquals(copiedContent, originalContent);

    // Cleanup
    await Deno.remove(destPath, { recursive: true });
  } finally {
    await tempRepo.cleanup();
  }
});

Deno.test('copyEnvFiles does nothing when no .env files exist', async () => {
  const tempRepo = await createTempGitRepo();

  try {
    const destPath = await Deno.makeTempDir({ prefix: 'gwt-dest-' });

    // Copy .env files (which don't exist)
    await copyEnvFiles(tempRepo.path, destPath);

    // Verify no .env files were created
    assertEquals(await exists(join(destPath, '.env')), false);

    // Cleanup
    await Deno.remove(destPath, { recursive: true });
  } finally {
    await tempRepo.cleanup();
  }
});

Deno.test('copyEnvFiles skips nested .env files', async () => {
  const tempRepo = await createTempGitRepo();

  try {
    // Create root level .env file
    await Deno.writeTextFile(join(tempRepo.path, '.env'), 'ROOT=value');

    // Create nested .env file in subdirectory
    const subdir = join(tempRepo.path, 'config');
    await Deno.mkdir(subdir);
    await Deno.writeTextFile(join(subdir, '.env.local'), 'NESTED=value');

    const destPath = await Deno.makeTempDir({ prefix: 'gwt-dest-' });

    // Copy .env files
    await copyEnvFiles(tempRepo.path, destPath);

    // Verify root .env was copied
    assert(await exists(join(destPath, '.env')));

    // Verify nested .env was NOT copied
    assertEquals(await exists(join(destPath, 'config', '.env.local')), false);
    assertEquals(await exists(join(destPath, 'config')), false);

    // Cleanup
    await Deno.remove(destPath, { recursive: true });
  } finally {
    await tempRepo.cleanup();
  }
});

Deno.test('copyEnvFiles only copies files starting with .env', async () => {
  const tempRepo = await createTempGitRepo();

  try {
    // Create .env file
    await Deno.writeTextFile(join(tempRepo.path, '.env'), 'KEY=value');

    // Create other dotfiles
    await Deno.writeTextFile(join(tempRepo.path, '.gitignore'), '*.log');
    await Deno.writeTextFile(join(tempRepo.path, '.editorconfig'), 'root=true');

    const destPath = await Deno.makeTempDir({ prefix: 'gwt-dest-' });

    // Copy .env files
    await copyEnvFiles(tempRepo.path, destPath);

    // Verify .env was copied
    assert(await exists(join(destPath, '.env')));

    // Verify other dotfiles were NOT copied
    assertEquals(await exists(join(destPath, '.gitignore')), false);
    assertEquals(await exists(join(destPath, '.editorconfig')), false);

    // Cleanup
    await Deno.remove(destPath, { recursive: true });
  } finally {
    await tempRepo.cleanup();
  }
});
