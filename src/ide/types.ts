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

export const IDE_COMMANDS = {
  idea: 'idea',
  rubymine: 'rubymine',
  goland: 'goland',
  webstorm: 'webstorm',
  pycharm: 'pycharm',
  phpstorm: 'phpstorm',
  clion: 'clion',
  rider: 'rider',
} as const;

export type IdeCommand = keyof typeof IDE_COMMANDS;

export const IDE_NAMES: Record<IdeCommand, string> = {
  idea: 'IntelliJ IDEA',
  rubymine: 'RubyMine',
  goland: 'GoLand',
  webstorm: 'WebStorm',
  pycharm: 'PyCharm',
  phpstorm: 'PhpStorm',
  clion: 'CLion',
  rider: 'Rider',
};
