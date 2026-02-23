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

import { assertStringIncludes } from '@std/assert';
import { upgradeCommandWithVersions } from '../../src/commands/upgrade.ts';

Deno.test('upgradeCommand prints update available when newer version exists', async () => {
  const lines: string[] = [];
  const print = (line: string) => lines.push(line);

  await upgradeCommandWithVersions('1.0.0', '2.0.0', print);

  const output = lines.join('\n');
  assertStringIncludes(output, '2.0.0');
  assertStringIncludes(
    output,
    'curl -fsSL https://raw.githubusercontent.com/ggalmazor/gwt/main/install.sh | bash',
  );
});

Deno.test('upgradeCommand prints up to date when on latest version', async () => {
  const lines: string[] = [];
  const print = (line: string) => lines.push(line);

  await upgradeCommandWithVersions('2.0.0', '2.0.0', print);

  const output = lines.join('\n');
  assertStringIncludes(output, 'up to date');
});

Deno.test('upgradeCommand prints up to date when on newer version than latest', async () => {
  const lines: string[] = [];
  const print = (line: string) => lines.push(line);

  await upgradeCommandWithVersions('2.1.0', '2.0.0', print);

  const output = lines.join('\n');
  assertStringIncludes(output, 'up to date');
});
