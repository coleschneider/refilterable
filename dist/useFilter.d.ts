import { FilterSetter, FilterDefinition } from './utils/types';
/**
 * Returns the current filter value, and a function to update it
 *
 * @param filter can be either a string that'll server as the name of the url parameter or the filter configuration created with createFilter()
 */
export default function useFilter<T = undefined>(filter: FilterDefinition<T> | string): [T | {
    [paramName: string]: any;
} | undefined, FilterSetter<T>];
