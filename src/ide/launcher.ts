import { Select } from '@cliffy/prompt';
import { IDE_COMMANDS, IDE_NAMES, type IdeCommand } from './types.ts';
import { IdeNotFoundError } from '../utils/errors.ts';

/**
 * Check if an IDE command is available in the PATH.
 * @param command - the IDE command to check
 * @returns true if the command exists, false otherwise
 */
async function isIdeAvailable(command: string): Promise<boolean> {
  try {
    const cmd = new Deno.Command('which', {
      args: [command],
      stdout: 'null',
      stderr: 'null',
    });
    const output = await cmd.output();
    return output.success;
  } catch {
    return false;
  }
}

/**
 * Detect which JetBrains IDEs are available in the PATH.
 * @returns array of available IDE command names
 */
export async function detectAvailableIDEs(): Promise<IdeCommand[]> {
  const available: IdeCommand[] = [];

  for (const [key, command] of Object.entries(IDE_COMMANDS)) {
    if (await isIdeAvailable(command)) {
      available.push(key as IdeCommand);
    }
  }

  return available;
}

/**
 * Prompt the user to select an IDE from available options.
 * @returns the selected IDE command name
 */
export async function promptForIDE(): Promise<IdeCommand> {
  const available = await detectAvailableIDEs();

  if (available.length === 0) {
    throw new IdeNotFoundError('No JetBrains IDEs found in PATH');
  }

  if (available.length === 1) {
    // Only one IDE available, use it without prompting
    return available[0];
  }

  const selection = await Select.prompt({
    message: 'Select JetBrains IDE to use:',
    options: available.map((ide) => ({
      name: IDE_NAMES[ide],
      value: ide,
    })),
  });

  return selection as IdeCommand;
}

/**
 * Launch a JetBrains IDE at the specified path.
 * @param ide - the IDE command name
 * @param path - the path to open in the IDE
 */
export async function launchIDE(ide: string, path: string): Promise<void> {
  // Verify IDE command exists
  if (!(await isIdeAvailable(ide))) {
    throw new IdeNotFoundError(ide);
  }

  // Get the full path to the IDE command
  const whichCmd = new Deno.Command('which', {
    args: [ide],
    stdout: 'piped',
    stderr: 'piped',
  });
  const whichOutput = await whichCmd.output();
  const idePath = new TextDecoder().decode(whichOutput.stdout).trim();

  // Launch IDE in background using nohup for proper detachment
  // This ensures the IDE continues running even after gwt exits
  const cmd = new Deno.Command('nohup', {
    args: [idePath, path],
    stdout: 'null',
    stderr: 'null',
    stdin: 'null',
  });

  // Spawn and detach - don't wait for completion
  const child = cmd.spawn();
  child.unref();

  // Give it a moment to start
  await new Promise(resolve => setTimeout(resolve, 100));
}
