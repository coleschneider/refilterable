(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react'], factory) :
  (global = global || self, factory(global.refilterable = {}, global.React));
}(this, function (exports, React) { 'use strict';

  var React__default = 'default' in React ? React['default'] : React;

  /**
   * Copyright (c) 2013-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */

  var invariant = function(condition, format, a, b, c, d, e, f) {
    {
      if (format === undefined) {
        throw new Error('invariant requires an error message argument');
      }
    }

    if (!condition) {
      var error;
      if (format === undefined) {
        error = new Error(
          'Minified exception occurred; use the non-minified dev environment ' +
          'for the full error message and additional helpful warnings.'
        );
      } else {
        var args = [a, b, c, d, e, f];
        var argIndex = 0;
        error = new Error(
          format.replace(/%s/g, function() { return args[argIndex++]; })
        );
        error.name = 'Invariant Violation';
      }

      error.framesToPop = 1; // we don't care about invariant's own frame
      throw error;
    }
  };

  var invariant_1 = invariant;

  var filtersContext = React.createContext(null);

  var FILTER_OBJECT_MARKER = Symbol('FILTER_OBJECT');
  var FILTER_COMPOSITION_MARKER = Symbol('FILTER_COMPOSITION');
  var FILTER_HAS_OVEWRITES = Symbol('FILTER_HAS_OVEWRITES');
  var defaultSetFilterOptions = Object.freeze({
      dry: false,
      action: 'PUSH',
      incrementally: false,
  });

  function filterHasOverwrites(filter) {
      return filter[FILTER_HAS_OVEWRITES];
  }

  function createFilterRegistry() {
      var registered = new Map();
      var refCounts = {};
      return {
          isColliding: function (filter) {
              if (!registered.has(filter.paramName))
                  return false;
              var storedFilter = registered.get(filter.paramName);
              if (filterHasOverwrites(filter) !== filterHasOverwrites(storedFilter))
                  return true;
              return filter !== storedFilter;
          },
          addFilterUse: function (filter) {
              refCounts[filter.paramName] = (refCounts[filter.paramName] || 0) + 1;
              registered.set(filter.paramName, filter);
          },
          deleteFilterUse: function (filter) {
              if (!registered.has(filter.paramName))
                  return;
              refCounts[filter.paramName]--;
              if (refCounts[filter.paramName] <= 0) {
                  registered.delete(filter.paramName);
                  delete refCounts[filter.paramName];
              }
          },
          getAllFilters: function () {
              return Array.from(registered.values());
          },
      };
  }

  function createLocationObserver(initialQueryString) {
      if (initialQueryString === void 0) { initialQueryString = ''; }
      var subscribers = {};
      var params = new URLSearchParams(initialQueryString);
      function watch(param, callback) {
          if (!subscribers[param])
              subscribers[param] = [];
          subscribers[param].push(callback);
          return function () {
              subscribers[param] = subscribers[param].filter(function (s) { return s !== callback; });
              if (subscribers[param].length === 0)
                  delete subscribers[param];
          };
      }
      function getParamInfo(paramName) {
          return {
              hasParam: params.has(paramName),
              paramValue: params.get(paramName),
          };
      }
      function getCurrentParams() {
          return new URLSearchParams(params);
      }
      function notify(queryString) {
          var prevParams = params;
          params = new URLSearchParams(queryString);
          Object
              .keys(subscribers)
              .forEach(function (paramName) {
              if (prevParams.get(paramName) !== params.get(paramName)) {
                  var paramInfo_1 = getParamInfo(paramName);
                  subscribers[paramName].forEach(function (subscriber) { return subscriber(paramInfo_1); });
              }
          });
      }
      return { watch: watch, notify: notify, getParamInfo: getParamInfo, getCurrentParams: getCurrentParams };
  }

  var FiltersProvider = function (_a) {
      var history = _a.history, children = _a.children;
      invariant_1(history, "refilterable: FiltersProvider was not passed a history instance. \n     Make sure you pass it via the history prop");
      var filterRegistry = React.useRef(createFilterRegistry());
      var locationObserver = React.useRef(createLocationObserver(history.location.search));
      React.useEffect(function () {
          // listen to location changes
          var unlisten = history.listen(function (location) {
              locationObserver.current.notify(location.search);
          });
          // fire once, to capture current location
          locationObserver.current.notify(history.location.search);
          // unsubscribe when the component unmounts
          return unlisten;
      }, []);
      var contextValue = {
          history: history,
          locationObserver: locationObserver.current,
          filterRegistry: filterRegistry.current
      };
      return (React__default.createElement(filtersContext.Provider, { value: contextValue }, children));
  };

  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.

  See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** */

  var __assign = function() {
      __assign = Object.assign || function __assign(t) {
          for (var s, i = 1, n = arguments.length; i < n; i++) {
              s = arguments[i];
              for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
          }
          return t;
      };
      return __assign.apply(this, arguments);
  };

  function createFilter(paramName, config) {
      var _a;
      invariant_1(String(paramName || '').length > 0, "refilterable: param name cannot be empty");
      var defaultConfig = (_a = {
              parse: function (input) { return input; },
              format: function (value) { return String(value); },
              validate: function () { return true; },
              defaultValue: undefined,
              resetValue: undefined
          },
          _a[FILTER_OBJECT_MARKER] = true,
          _a[FILTER_HAS_OVEWRITES] = !config,
          _a);
      // by default, resetValue is the same as defaultValue
      if (config && !config.hasOwnProperty("resetValue")) {
          var parse = typeof config.parse === "function" ? config.parse : defaultConfig.parse;
          config.resetValue = typeof config.defaultValue !== "undefined" ? parse(config.defaultValue) : undefined;
      }
      return __assign({}, defaultConfig, config, { paramName: paramName });
  }

  /**
   * User defined type guard to check if the passed object is a valid instance of FiterObject
   *
   * @param filter
   */
  function isFilterObject(filter) {
      return Boolean(filter[FILTER_OBJECT_MARKER]);
  }
  /**
   * User defined type guard to check if the passed object is a valid instance of FiterObject
   *
   * @param filter
   */
  function isFilterComposition(filter) {
      return Boolean(filter[FILTER_COMPOSITION_MARKER]);
  }

  function applyHistoryAction(history, params, options) {
      // override the default options
      options = __assign({}, defaultSetFilterOptions, options);
      // make sure the order of params is stable
      params.sort();
      // convert query to query string
      var queryString = params.toString();
      // dry run -> just return the next string (used in <Link> or <a>)
      if (options.dry)
          return queryString;
      switch (options.action) {
          case 'PUSH':
              history.push({ search: queryString });
              break;
          case 'REPLACE':
              history.replace({ search: queryString });
      }
      return queryString;
  }

  function computeFilterValue(filter, observer) {
      var parse = filter.parse, validate = filter.validate, defaultValue = filter.defaultValue;
      var _a = observer.getParamInfo(filter.paramName), hasParam = _a.hasParam, paramValue = _a.paramValue;
      // if param isn't present, immediately return the default value
      if (!hasParam)
          return typeof defaultValue === 'undefined' ? undefined : parse(defaultValue);
      // if param is invalid return invalid
      if (!validate(paramValue, parse))
          return undefined;
      return parse(paramValue);
  }

  /**
   * Returns the current filter value, and a function to update it
   *
   * @param filter can be either a string that'll server as the name of the url parameter or the filter configuration created with createFilter()
   */
  function useFilter(filter) {
      // bail out if filter is empty
      invariant_1(filter, "refilterable: you called useFilter() without a filter.");
      // pull the context
      var context = React.useContext(filtersContext);
      invariant_1(context, "refilterable: Components that utilize the \"useFilter\" hook need to be wrapped with FiltersProvider.");
      var locationObserver = context.locationObserver, history = context.history, filterRegistry = context.filterRegistry;
      // normalize FilterObject vs FilterComposition
      var filters;
      var compositeValidate = function () { return true; };
      var singleFilterMode = true;
      // filter is a string
      if (typeof filter === 'string') {
          filters = [createFilter(filter)];
      }
      else {
          invariant_1((isFilterComposition(filter) || isFilterObject(filter)), "refilterable: you called useFilter and passed an invalid filter object.\n      Instead of constructing the configuration object on your own,\n      use createFilter() or composeFilters().");
          if (isFilterComposition(filter)) {
              filters = filter.filters;
              compositeValidate = filter.validate;
              singleFilterMode = false;
          }
          else {
              filters = [filter];
          }
      }
      // at this point, we have an array of filter objects and a composite validate function
      var _a = React.useState(), forceUpdate = _a[1];
      var paramNames = filters.map(function (filter) { return filter.paramName; }).sort();
      // 1) check for configuration collisions
      React.useEffect(function () {
          var unsubscribers = {};
          filters.forEach(function (filter) {
              invariant_1(!filterRegistry.isColliding(filter), "refilterable: you attempted to register conflicting configurations for the \"" + filter.paramName + "\" filter");
              filterRegistry.addFilterUse(filter);
              // 2) subscribe to changes in location
              unsubscribers[filter.paramName] = locationObserver.watch(filter.paramName, function () { return (forceUpdate(+new Date)); });
          });
          return function () {
              // unsusbscribe and remove filter from the registry
              filters.forEach(function (filter) {
                  unsubscribers[filter.paramName](filter.paramName);
                  filterRegistry.deleteFilterUse(filter);
              });
          };
      }, paramNames);
      // 3) parse the current value and pass it down to the return array
      var filterValues = filters.reduce(function (acc, filter) {
          acc[filter.paramName] = computeFilterValue(filter, locationObserver);
          return acc;
      }, {});
      // 4) provide a setter that changes all the filters at once
      var filterSetter = React.useCallback(function (nextValue, options) {
          if (options === void 0) { options = defaultSetFilterOptions; }
          var params = locationObserver.getCurrentParams();
          function computeNextParams() {
              var _a;
              var valuesToSet = (singleFilterMode ? (_a = {}, _a[paramNames[0]] = nextValue, _a) :
                  nextValue);
              var keysToSet = new Set(Object.keys(valuesToSet));
              filters.forEach(function (_a) {
                  var paramName = _a.paramName, format = _a.format;
                  var nextValue = valuesToSet[paramName];
                  // the key isn't present...
                  if (!keysToSet.has(paramName)) {
                      // if incrementally=true, don't change the value
                      if (!options.incrementally) {
                          params.delete(paramName);
                      }
                  }
                  else if (typeof nextValue === 'undefined') {
                      // the value is set to undefined, remove it from the query string
                      params.delete(paramName);
                  }
                  else {
                      // a value is provided, ...
                      var formattedValue = format(nextValue);
                      invariant_1(['string', 'undefined'].includes(typeof formattedValue), "refilterable: a custom formatter (" + paramName + ") produced a non-string value.\n            Make sure your formatter always returns a string or undefined");
                      // apply the new value
                      if (formattedValue == null) {
                          params.delete(paramName);
                      }
                      else {
                          params.set(paramName, formattedValue);
                      }
                  }
              });
              return params;
          }
          return applyHistoryAction(history, computeNextParams(), options);
      }, paramNames);
      // display the debug value in React inspector
      React.useDebugValue('useFilter', function () { return paramNames.join(', '); });
      return [
          (singleFilterMode ?
              filterValues[paramNames[0]] :
              compositeValidate(filterValues) ? filterValues : undefined),
          filterSetter
      ];
  }

  /**
   * Returns a function to reset all the registered filters to their default values.
   * If a filter doesn't have a default value specified, remove it
   * Filters that are not registered with useFilter will not be affected
   */
  function useReset(filter) {
      var context = React.useContext(filtersContext);
      var filtersToReset;
      invariant_1(context, "refilterable: Components that utilize the \"useFilter\" hook need to be wrapped with FiltersProvider.");
      if (filter) {
          invariant_1((isFilterComposition(filter) || isFilterObject(filter)), "refilterable: you called useReset() and passed an invalid filter object.\n      Instead of constructing the configuration object on your own,\n      use createFilter() or composeFilters().");
          filtersToReset = isFilterComposition(filter) ? filter.filters : [filter];
      }
      // @ts-ignore because this is checked by invariant
      var locationObserver = context.locationObserver, history = context.history, filterRegistry = context.filterRegistry;
      var reset = React.useCallback(function (options) {
          if (options === void 0) { options = defaultSetFilterOptions; }
          var params = locationObserver.getCurrentParams();
          (filtersToReset || filterRegistry.getAllFilters())
              .forEach(function (_a) {
              var paramName = _a.paramName, format = _a.format, resetValue = _a.resetValue;
              if (typeof resetValue === "undefined") {
                  params.delete(paramName);
              }
              else {
                  params.set(paramName, format(resetValue));
              }
          });
          return applyHistoryAction(history, params, options);
      }, [history]);
      return reset;
  }

  // @todo: support filter compositions in filters
  function composeFilters(filters, validate) {
      var _a;
      invariant_1(filters && filters.length > 0, "refilterable: you called compose filters and didn't pass any filters ");
      invariant_1(filters.every(function (filter) { return isFilterObject(filter); }), "refilterable: composeFilters() was called with non-filter objects. \n    Use createFilter() to create filters");
      return _a = {
              filters: filters,
              validate: typeof validate === 'function' ? validate : function () { return true; }
          },
          _a[FILTER_COMPOSITION_MARKER] = true,
          _a;
  }

  exports.FiltersProvider = FiltersProvider;
  exports.composeFilters = composeFilters;
  exports.createFilter = createFilter;
  exports.useFilter = useFilter;
  exports.useReset = useReset;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
