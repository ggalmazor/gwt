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
import { fuzzySearch } from './fuzzy-search.ts';

export interface SelectOption<T> {
  name: string;
  value: T;
}

/**
 * Prompt for selection with fuzzy search filtering.
 * Shows an optional search input first, then filters options using fuzzy search.
 * Press Enter with empty search to see all options.
 */
export async function selectWithFuzzySearch<T extends string>(
  message: string,
  options: SelectOption<T>[],
  searchPrompt = 'Filter branches (press Enter to skip):'
): Promise<T> {
  // Ask for search query first
  const searchQuery = await Input.prompt({
    message: searchPrompt,
    default: '',
  });

  // Filter options if search query is provided
  let filteredOptions = options;
  if (searchQuery.trim().length > 0) {
    // Extract values for fuzzy searching
    const values = options.map((opt) => opt.value);
    const matches = fuzzySearch(searchQuery, values);

    // Filter options to only include matches, preserving order
    filteredOptions = options.filter((opt) => matches.includes(opt.value));

    // If no matches, show all options
    if (filteredOptions.length === 0) {
      console.log(`No matches found for "${searchQuery}". Showing all options.`);
      filteredOptions = options;
    } else if (filteredOptions.length === 1) {
      // If only one match, auto-select it
      console.log(`Auto-selected: ${filteredOptions[0].name}`);
      return filteredOptions[0].value;
    }
  }

  // Show selection prompt with filtered options
  return await Select.prompt({
    message,
    options: filteredOptions,
  });
}
