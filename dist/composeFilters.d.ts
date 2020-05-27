import { FilterObject, FilterComposition } from './utils/types';
export default function composeFilters(filters: FilterObject<any>[], validate?: (input: any) => boolean): FilterComposition;
