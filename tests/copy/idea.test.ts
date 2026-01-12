import { assert, assertEquals } from '@std/assert';
import { join } from '@std/path';
import { exists } from '@std/fs';
import { createTempGitRepo } from '../helpers/git-test-repo.ts';
import { copyIdeaDir } from '../../src/copy/idea.ts';

Deno.test('copyIdeaDir copies .idea directory to destination', async () => {
  const tempRepo = await createTempGitRepo();

  try {
    // Create .idea directory with some files
    const ideaDir = join(tempRepo.path, '.idea');
    await Deno.mkdir(ideaDir);
    await Deno.writeTextFile(join(ideaDir, 'modules.xml'), '<modules/>');
    await Deno.writeTextFile(join(ideaDir, 'workspace.xml'), '<workspace/>');

    // Create subdirectory in .idea
    const inspectionDir = join(ideaDir, 'inspectionProfiles');
    await Deno.mkdir(inspectionDir);
    await Deno.writeTextFile(join(inspectionDir, 'profiles_settings.xml'), '<settings/>');

    const destPath = await Deno.makeTempDir({ prefix: 'gwt-dest-' });

    // Copy .idea directory
    await copyIdeaDir(tempRepo.path, destPath);

    // Verify .idea directory and files were copied
    const copiedIdeaDir = join(destPath, '.idea');
    assert(await exists(copiedIdeaDir));
    assert(await exists(join(copiedIdeaDir, 'modules.xml')));
    assert(await exists(join(copiedIdeaDir, 'workspace.xml')));
    assert(await exists(join(copiedIdeaDir, 'inspectionProfiles', 'profiles_settings.xml')));

    // Verify content is the same
    const originalContent = await Deno.readTextFile(join(ideaDir, 'modules.xml'));
    const copiedContent = await Deno.readTextFile(join(copiedIdeaDir, 'modules.xml'));
    assertEquals(copiedContent, originalContent);

    // Cleanup
    await Deno.remove(destPath, { recursive: true });
  } finally {
    await tempRepo.cleanup();
  }
});

Deno.test('copyIdeaDir does nothing when .idea does not exist', async () => {
  const tempRepo = await createTempGitRepo();

  try {
    const destPath = await Deno.makeTempDir({ prefix: 'gwt-dest-' });

    // Copy .idea directory (which doesn't exist)
    await copyIdeaDir(tempRepo.path, destPath);

    // Verify .idea directory was not created
    const copiedIdeaDir = join(destPath, '.idea');
    assertEquals(await exists(copiedIdeaDir), false);

    // Cleanup
    await Deno.remove(destPath, { recursive: true });
  } finally {
    await tempRepo.cleanup();
  }
});

Deno.test('copyIdeaDir handles destination .idea already exists', async () => {
  const tempRepo = await createTempGitRepo();

  try {
    // Create .idea directory in source
    const ideaDir = join(tempRepo.path, '.idea');
    await Deno.mkdir(ideaDir);
    await Deno.writeTextFile(join(ideaDir, 'modules.xml'), '<modules/>');

    const destPath = await Deno.makeTempDir({ prefix: 'gwt-dest-' });

    // Create existing .idea directory in destination
    const destIdeaDir = join(destPath, '.idea');
    await Deno.mkdir(destIdeaDir);
    await Deno.writeTextFile(join(destIdeaDir, 'existing.xml'), '<existing/>');

    // Copy .idea directory
    await copyIdeaDir(tempRepo.path, destPath);

    // Verify .idea directory exists and has both old and new files
    assert(await exists(join(destIdeaDir, 'modules.xml')));
    assert(await exists(join(destIdeaDir, 'existing.xml')));

    // Cleanup
    await Deno.remove(destPath, { recursive: true });
  } finally {
    await tempRepo.cleanup();
  }
});
