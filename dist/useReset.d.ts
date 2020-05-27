import { FilterResetter, FilterDefinition } from './utils/types';
/**
 * Returns a function to reset all the registered filters to their default values.
 * If a filter doesn't have a default value specified, remove it
 * Filters that are not registered with useFilter will not be affected
 */
export default function useReset(filter?: FilterDefinition): FilterResetter;
