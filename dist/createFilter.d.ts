import { FilterConfig, FilterObject } from './utils/types';
export default function createFilter<T>(paramName: string, config?: FilterConfig<T>): FilterObject<T>;
