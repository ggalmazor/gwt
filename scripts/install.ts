#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env

import { join } from '@std/path';
import { exists } from '@std/fs';

const HOME = Deno.env.get('HOME');
if (!HOME) {
  console.error('Error: HOME environment variable not set');
  Deno.exit(1);
}

const INSTALL_DIR = join(HOME, 'bin');
const PROJECT_ROOT = join(import.meta.dirname!, '..');
const BINARY_NAME = 'gwt';
const SOURCE_BINARY = join(PROJECT_ROOT, BINARY_NAME);
const TARGET_BINARY = join(INSTALL_DIR, BINARY_NAME);

console.log('🔨 Compiling gwt...');

// Compile the executable
const compileCmd = new Deno.Command('deno', {
  args: [
    'compile',
    '--allow-run',
    '--allow-read',
    '--allow-write',
    '--allow-env',
    '--output',
    BINARY_NAME,
    'main.ts',
  ],
  cwd: PROJECT_ROOT,
  stdout: 'inherit',
  stderr: 'inherit',
});

const compileResult = await compileCmd.output();

if (!compileResult.success) {
  console.error('❌ Compilation failed');
  Deno.exit(1);
}

console.log('✓ Compilation successful');

// Ensure ~/bin directory exists
console.log(`\n📁 Ensuring ${INSTALL_DIR} exists...`);
await Deno.mkdir(INSTALL_DIR, { recursive: true });
console.log('✓ Directory ready');

// Check if source binary exists
if (!(await exists(SOURCE_BINARY))) {
  console.error(`❌ Binary not found at: ${SOURCE_BINARY}`);
  Deno.exit(1);
}

// Copy binary to ~/bin
console.log(`\n📦 Installing to ${TARGET_BINARY}...`);

try {
  // Remove existing binary if it exists
  if (await exists(TARGET_BINARY)) {
    await Deno.remove(TARGET_BINARY);
    console.log('  ✓ Removed existing binary');
  }

  // Copy the new binary
  await Deno.copyFile(SOURCE_BINARY, TARGET_BINARY);
  console.log('  ✓ Binary copied');

  // Make executable
  await Deno.chmod(TARGET_BINARY, 0o755);
  console.log('  ✓ Permissions set');
} catch (error) {
  const message = (error instanceof Error) ? error.message : error;
  console.error(`❌ Installation failed: ${message}`);
  Deno.exit(1);
}

// Verify installation
console.log('\n🎉 Installation complete!');
console.log(`\nThe 'gwt' command is now available at: ${TARGET_BINARY}`);

// Check if ~/bin is in PATH
const PATH = Deno.env.get('PATH') || '';
const pathDirs = PATH.split(':');

if (!pathDirs.includes(INSTALL_DIR)) {
  console.log('\n⚠️  Note: ~/bin is not in your PATH');
  console.log('Add this line to your shell configuration file (~/.zshrc, ~/.bashrc, etc.):');
  console.log(`\n  export PATH="$HOME/bin:$PATH"\n`);
  console.log('Then restart your shell or run: source ~/.zshrc');
} else {
  console.log('\n✓ ~/bin is in your PATH');
  console.log('\nYou can now run: gwt --help');
}
