/**
 * gwt - Git Worktree Manager
 * Copyright (C) 2026 Guillermo G. Almazor <guille@ggalmazor.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { Select, Input } from '@cliffy/prompt';
import type { EditorConfig, EditorType } from './types.ts';
import { saveConfig } from './manager.ts';
import { getRepoRoot } from '../git/repo.ts';
import { discoverFiles, selectFilesToCopy } from '../copy/selector.ts';
import { isEditorAvailable } from '../editor/detector.ts';

/**
 * Options for non-interactive wizard (for testing).
 */
export interface WizardOptions {
  editorType: EditorType;
  editorCommand?: string;
  files: string[];
}

/**
 * Runs the configuration wizard (non-interactive version for testing).
 */
export async function runConfigWizardNonInteractive(
  options: WizardOptions
): Promise<void> {
  const editor: EditorConfig = {
    type: options.editorType as EditorType,
    command: options.editorCommand,
  };

  await saveConfig({
    editor,
    filesToCopy: options.files,
  });
}

/**
 * Runs the interactive configuration wizard.
 * Prompts user to select editor type, command, and files to copy.
 */
export async function runConfigWizard(): Promise<void> {
  console.log('Configuration Setup');
  console.log('==================\n');

  // Step 1: Select editor type
  const editorType = await Select.prompt<EditorType>({
    message: 'Select editor type:',
    options: [
      { name: 'None (disable editor launching)', value: 'none' },
      { name: 'Custom command', value: 'custom' },
    ],
  });

  let editorCommand: string | undefined;

  // Step 2: Get editor command based on type
  if (editorType === 'custom') {
    editorCommand = await promptCustomEditor();
  }

  // Step 3: Select files to copy
  console.log('\nSelect files/directories to copy to new worktrees:');
  const repoRoot = await getRepoRoot();
  const availableFiles = await discoverFiles(repoRoot);
  const selectedFiles = await selectFilesToCopy(availableFiles);

  // Step 4: Save configuration
  const editor: EditorConfig = {
    type: editorType as EditorType,
    command: editorCommand,
  };

  await saveConfig({
    editor,
    filesToCopy: selectedFiles,
  });

  console.log('\n✓ Configuration saved');
}

/**
 * Prompt for a custom editor command.
 */
async function promptCustomEditor(): Promise<string> {
  const command = await Input.prompt({
    message: 'Enter editor command (e.g., "code", "/usr/bin/vim"):',
    validate: (value) => {
      if (!value || value.trim() === '') {
        return 'Command cannot be empty';
      }
      return true;
    },
  });

  // Validate if command exists
  if (!(await isEditorAvailable(command))) {
    console.log(`⚠ Warning: Command '${command}' not found in PATH or as a file`);
    console.log('Make sure to install it before creating worktrees');
  }

  return command;
}
