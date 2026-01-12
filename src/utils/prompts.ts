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
