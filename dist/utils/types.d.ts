import { History } from 'history';
export declare type ParseFunction<T> = (input: string) => T | undefined;
export interface FilterObject<T = undefined> {
    paramName: string;
    parse: ParseFunction<T>;
    format(value: T): string;
    validate(input: string, parse: ParseFunction<T>): boolean;
    defaultValue?: string | undefined;
    resetValue?: T | undefined;
}
export interface FilterConfig<T = string> {
    parse?: ParseFunction<T>;
    format?(value: T): string;
    validate?(input: string, parse: ParseFunction<T>): boolean;
    defaultValue?: string | undefined;
    resetValue?: T | undefined;
}
export interface FilterComposition {
    filters: FilterObject<any>[];
    validate(input: {
        [paramName: string]: any;
    }): boolean;
}
export declare type FilterDefinition<T = any> = FilterObject<T> | FilterComposition;
/**
 * User defined type guard to check if the passed object is a valid instance of FiterObject
 *
 * @param filter
 */
export declare function isFilterObject<T = any>(filter: FilterDefinition<T>): filter is FilterObject<T>;
/**
 * User defined type guard to check if the passed object is a valid instance of FiterObject
 *
 * @param filter
 */
export declare function isFilterComposition<T = undefined>(filter: FilterDefinition<T>): filter is FilterComposition;
export interface LocationObserver {
    watch(paramName: string, callback: Function): Function;
    notify(queryString: string): any;
    getParamInfo(paramName: string): {
        hasParam: boolean;
        paramValue: any;
    };
    getCurrentParams(): URLSearchParams;
}
export interface FilterRegistry {
    getAllFilters(): FilterObject<any>[];
    isColliding(filter: FilterObject<any>): boolean;
    addFilterUse(filter: FilterObject<any>): void;
    deleteFilterUse(filter: FilterObject<any>): void;
}
export declare type FiltersContextValue = {
    locationObserver: LocationObserver;
    filterRegistry: FilterRegistry;
    history: History;
};
export declare type ForwardHistoryAction = 'PUSH' | 'REPLACE';
export declare type SetFilterOptions = {
    dry?: boolean;
    action?: ForwardHistoryAction;
    incrementally?: boolean;
};
export declare type FilterSetter<T = undefined> = (nextValue: T | any | {
    [paramName: string]: any;
}, options?: SetFilterOptions) => string;
export declare type FilterResetter = (options?: SetFilterOptions) => string;
