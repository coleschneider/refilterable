import { useContext, useCallback, useEffect, useDebugValue, useState } from 'react';
import invariant from 'invariant';
import { FilterObject, FilterComposition, FilterSetter, SetFilterOptions, ForwardHistoryAction, isFilterObject, FiltersContextValue, isFilterComposition, FilterDefinition, FilterRegistry, LocationObserver } from './utils/types';
import createFilter from './createFilter';
import filtersContext from './utils/filtersContext';
import applyHistoryAction from './utils/applyHistoryAction';
import computeFilterValue from './utils/computeFilterValue';
import { defaultSetFilterOptions } from './utils/constants';

/**
 * Returns the current filter value, and a function to update it
 *
 * @param filter can be either a string that'll server as the name of the url parameter or the filter configuration created with createFilter()
 */
export default function useFilter<T = undefined>(
  filter: FilterDefinition<T> | string
) : [
  T | { [paramName: string]: any } | undefined,
  FilterSetter<T>
] {
  // bail out if filter is empty
  invariant(
    filter,
    `refilterable: you called useFilter() without a filter.`
  );

  // pull the context
  let context = <FiltersContextValue> useContext(filtersContext);

  invariant(
    context,
    `refilterable: Components that utilize the "useFilter" hook need to be wrapped with FiltersProvider.`,
  );

  const { locationObserver, history, filterRegistry } = context;

  // normalize FilterObject vs FilterComposition
  let filters: FilterObject<T | undefined>[];
  let compositeValidate: (input: any) => boolean = () => true;
  let singleFilterMode: boolean = true;

  // filter is a string
  if (typeof filter === 'string') {
    filters = [createFilter<T>(filter)];
  } else {
    invariant(
      (isFilterComposition(filter) || isFilterObject(filter)),
      `refilterable: you called useFilter and passed an invalid filter object.
      Instead of constructing the configuration object on your own,
      use createFilter() or composeFilters().`
    );

    if(isFilterComposition(filter)) {
      filters = filter.filters;
      compositeValidate = filter.validate;
      singleFilterMode = false;
    } else {
      filters = [filter];
    }
  }

  // at this point, we have an array of filter objects and a composite validate function
  const [, forceUpdate] = useState();

  const paramNames = filters.map(filter => filter.paramName).sort();

  // 1) check for configuration collisions
  useEffect(() => {
    const unsubscribers = {};

    filters.forEach((filter) => {
      invariant(
        !filterRegistry.isColliding(filter),
        `refilterable: you attempted to register conflicting configurations for the "${filter.paramName}" filter`
      );

      filterRegistry.addFilterUse(filter);

      // 2) subscribe to changes in location
      unsubscribers[filter.paramName] = locationObserver.watch(filter.paramName, () => (
        forceUpdate(+ new Date))
      );
    });

    return () => {
      // unsusbscribe and remove filter from the registry
      filters.forEach((filter) => {
        unsubscribers[filter.paramName](filter.paramName)
        filterRegistry.deleteFilterUse(filter)
      });
    }
  }, paramNames);

  // 3) parse the current value and pass it down to the return array
  const filterValues = filters.reduce((acc, filter) => {
    acc[filter.paramName] = computeFilterValue(filter, locationObserver);
    return acc;
  }, {});

  // 4) provide a setter that changes all the filters at once
  const filterSetter = useCallback((
    nextValue: any | { [paramName: string]: any },
    options: SetFilterOptions = defaultSetFilterOptions
  ): string => {
    const params = locationObserver.getCurrentParams();

    function computeNextParams(): URLSearchParams {
      const valuesToSet: { [paramName: string]: any } = (
        singleFilterMode ?
          { [paramNames[0]]: nextValue } :
          nextValue
      );

      const keysToSet = new Set(Object.keys(valuesToSet));

      filters.forEach(({ paramName, format }: FilterObject<any>) => {
        let nextValue = valuesToSet[paramName];

        // the key isn't present...
        if (!keysToSet.has(paramName)) {
          // if incrementally=true, don't change the value
          if (!options.incrementally) {
            params.delete(paramName);
          }
        } else if(typeof nextValue === 'undefined') {
          // the value is set to undefined, remove it from the query string
          params.delete(paramName);
        } else {
          // a value is provided, ...
          const formattedValue = format(nextValue);

          invariant(
            ['string', 'undefined'].includes(typeof formattedValue),
            `refilterable: a custom formatter (${paramName}) produced a non-string value.
            Make sure your formatter always returns a string or undefined`,
          );

          // apply the new value
          if (formattedValue == null) {
            params.delete(paramName)
          } else {
            params.set(paramName, formattedValue);
          }
        }
      });

      return params;
    }

    return applyHistoryAction(history, computeNextParams(), options);
  }, paramNames);

  // display the debug value in React inspector
  useDebugValue('useFilter', () => paramNames.join(', '));

  return [
    (
      singleFilterMode ?
        filterValues[paramNames[0]] :
        compositeValidate(filterValues) ? filterValues : undefined
    ),
    filterSetter
  ];
}
