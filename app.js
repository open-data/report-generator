(function(window, angular, wb, $) {'use strict';
    var app = angular.module('reportGenerator', ['dataset-types', 'advanced-search', 'display-fields', 'services.config']),
        $resultsTable = $('#results');

    app.run(['$http', '$rootScope', 'configuration', function($http, $rootScope, configuration) {

        function createQuery(keywords) {
            var regexp = /(.*?)((?: (?:OR|AND) )|$)/g;

            if (keywords.length === 0) {
                return '*';
            }

            keywords = keywords.replace(regexp, function(match, key, sep) {
                if (key.length !== 0 && !key.match(/:[\(\[].*?[\)\]]/)) {
                    key = 'entext:(' + key + ')';
                }
                return key + sep;
            });
            return keywords;
        }

        function sanitizeData(rows, fields) {
            var row, r, field, f, cell;

            for (r = 0; r < rows.length; r += 1) {
                row = rows[r];

                for (f = 0; f < fields.length; f += 1) {
                    field = fields[f];
                    cell = row[field];

                    row[field] = cell || '';

                    if (field === 'name') {
                        row[field] = '' + cell + ' ' +
                            '<a target="_blank" href="' + configuration.ckanInstance + '/dataset/' + cell + '" class="btn btn-default">' +
                                '<span class="glyphicon glyphicon-eye-open"><span class="wb-inv">View ' + cell + '</span></a>' +
                            '<a target="_blank" href="' + configuration.ckanInstance + '/dataset/edit/' + cell + '" class="btn btn-default">' +
                                '<span class="glyphicon glyphicon-pencil"><span class="wb-inv">Edit ' + cell + '</span></a>';
                    } else if (typeof cell === 'object') {
                        row[field] = cell.join(',');
                    }
                }
            }

            return rows;
        }

        function createFieldsMapping(fields) {
            var fieldsMapping = [],
                f;

            for (f = 0; f < fields.length; f += 1) {
                fieldsMapping.push({
                    data: fields[f],
                    title: fields[f],
                });
            }

            return fieldsMapping;
        }

        function maxResultsFromUrl() {
            var maxResults = wb.pageUrlParts.params.rows;

            if ($rootScope.maxResultsOptions[maxResults]) {
                return maxResults;
            }
        }

        $rootScope.query = wb.pageUrlParts.params.q ? decodeURI(wb.pageUrlParts.params.q) : '';
        $rootScope.maxResultsOptions = {
            20: 20,
            50: 50,
            100: 100,
            1000: '1000 (default)',
            2000: 2000
        };
        $rootScope.maxResults = maxResultsFromUrl() || '1000';

        $rootScope.clearKeywords = function() {
            $rootScope.query = '';
        };

        $rootScope.saveUrl = function() {
            var urlParts = wb.pageUrlParts,
                url = urlParts.absolute.replace(urlParts.search, '').replace(urlParts.hash, '');

            $rootScope.savedUrl = url +
                '?fq=' + $rootScope.dataTypeCtrl.selectedDatasetTypes.join(',') +
                '&q=' + $rootScope.query +
                '&fl=' + $rootScope.dspFieldCtrl.fields.join(',') +
                '&rows=' + $rootScope.maxResults;
        };

        $rootScope.sendQuery = function() {
            var url = configuration.solrCore + '/select',
                params = {
                    wt: 'json',
                    'json.wrf': 'JSON_CALLBACK',
                    otherparams: '',
                    fq: 'dataset_type:' + $rootScope.dataTypeCtrl.selectedDatasetTypes.join(' OR '),
                    q: createQuery($rootScope.query),
                    fl: $rootScope.dspFieldCtrl.fields.join(','),
                    rows: parseInt($rootScope.maxResults, 10)
                };

            $http.jsonp(url, {params: params})
                .then(function(data) {
                    $rootScope.queryResultsCount = data.data.response.numFound;
                    $rootScope.queryResults = data.data.response;
                    $rootScope.downloadLink = data.config.url + '?' + $.param($.extend({}, data.config.params, {wt: 'csv'}));

                    var fields = data.data.responseHeader.params.fl.split(','),
                        datatable = {
                            data: sanitizeData($rootScope.queryResults.docs, fields),
                            columns: createFieldsMapping(fields),
                            columnDefs: [
                                {
                                    className: 'nowrap right',
                                    targets: [0]
                                }
                            ],
                            pageLength: 100,
                            lengthMenu: [[50, 100, 200, 500, -1], [50, 100, 200, 500, 'All']]
                        };

                    $resultsTable
                        .DataTable().destroy();

                    $resultsTable
                        .empty()
                        .removeClass('wb-tables-inited wb-init')
                        .attr('data-wb-tables', JSON.stringify(datatable))
                        .trigger('wb-init.wb-tables');
                });
        };
    }]);

})(window, angular, wb, jQuery);

/**
 * Checklist-model
 * AngularJS directive for list of checkboxes
 */

angular.module('checklist-model', [])
.directive('checklistModel', ['$parse', '$compile', function($parse, $compile) {
  // contains
  function contains(arr, item, comparator) {
    if (angular.isArray(arr)) {
      for (var i = arr.length; i--;) {
        if (comparator(arr[i], item)) {
          return true;
        }
      }
    }
    return false;
  }

  // add
  function add(arr, item, comparator) {
    arr = angular.isArray(arr) ? arr : [];
      if(!contains(arr, item, comparator)) {
          arr.push(item);
      }
    return arr;
  }  

  // remove
  function remove(arr, item, comparator) {
    if (angular.isArray(arr)) {
      for (var i = arr.length; i--;) {
        if (comparator(arr[i], item)) {
          arr.splice(i, 1);
          break;
        }
      }
    }
    return arr;
  }

  // http://stackoverflow.com/a/19228302/1458162
  function postLinkFn(scope, elem, attrs) {
    // compile with `ng-model` pointing to `checked`
    $compile(elem)(scope);

    // getter / setter for original model
    var getter = $parse(attrs.checklistModel);
    var setter = getter.assign;
    var checklistChange = $parse(attrs.checklistChange);

    // value added to list
    var value = $parse(attrs.checklistValue)(scope.$parent);


  var comparator = angular.equals;

  if (attrs.hasOwnProperty('checklistComparator')){
    comparator = $parse(attrs.checklistComparator)(scope.$parent);
  }

    // watch UI checked change
    scope.$watch('checked', function(newValue, oldValue) {
      if (newValue === oldValue) { 
        return;
      } 
      var current = getter(scope.$parent);
      if (newValue === true) {
        setter(scope.$parent, add(current, value, comparator));
      } else {
        setter(scope.$parent, remove(current, value, comparator));
      }

      if (checklistChange) {
        checklistChange(scope);
      }
    });
    
    // declare one function to be used for both $watch functions
    function setChecked(newArr, oldArr) {
        scope.checked = contains(newArr, value, comparator);
    }

    // watch original model change
    // use the faster $watchCollection method if it's available
    if (angular.isFunction(scope.$parent.$watchCollection)) {
        scope.$parent.$watchCollection(attrs.checklistModel, setChecked);
    } else {
        scope.$parent.$watch(attrs.checklistModel, setChecked, true);
    }
  }

  return {
    restrict: 'A',
    priority: 1000,
    terminal: true,
    scope: true,
    compile: function(tElement, tAttrs) {
      if (tElement[0].tagName !== 'INPUT' || tAttrs.type !== 'checkbox') {
        throw 'checklist-model should be applied to `input[type="checkbox"]`.';
      }

      if (!tAttrs.checklistValue) {
        throw 'You should provide `checklist-value`.';
      }

      // exclude recursion
      tElement.removeAttr('checklist-model');
      
      // local scope var storing individual checkbox model
      tElement.attr('ng-model', 'checked');

      return postLinkFn;
    }
  };
}]);

(function(window, angular) {'use strict';
    var app = angular.module('advanced-search', ['fields']);

    app.controller('AdvancedSearchController', ['$rootScope', function($rootScope) {
        this.emptyKey = false;
        this.operator = 'AND';
        this.keyword = '';

        this.addField = function() {
            var actualOperator = '',
                expr;

            if (this.field && (this.keyword || this.emptyKey)) {
                expr = this.emptyKey ?
                    '-' + this.field + ':' + '["" TO *]' :
                    this.field + ':(*' + this.keyword + '*)';

                if ($rootScope.query && $rootScope.query.trim() !== '') {
                    actualOperator = ' ' + (this.emptyKey ? 'AND' : this.operator) + ' ';
                }

                $rootScope.query += actualOperator + expr;

                this.keyword = '';
            }
        };
    }]);

    app.directive('advancedSearch', function() {
        return {
            restrict: 'E',
            templateUrl: 'templates/advanced-search.html',
            controller: 'AdvancedSearchController',
            controllerAs: 'advSrchCtrl'
        };
    });

    /* Trim Poyfill:
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
     */
    if (!String.prototype.trim) {
        (function() {
            // Make sure we trim BOM and NBSP
            var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
            String.prototype.trim = function() {
                return this.replace(rtrim, '');
            };
        })();
    }

})(window, angular);

(function(window, angular, wb) {'use strict';
    var app = angular.module('dataset-types', ['checklist-model', 'services.config']);

    app.controller('DatasetTypesController', ['$http', '$rootScope', 'configuration', function($http, $rootScope, configuration) {
        var typesRequest = configuration.solrCore + '/select?q=*:*&rows=0&wt=json&json.wrf=JSON_CALLBACK&facet=true&facet.field=dataset_type',
            _this = this;

        function fromDefault(types) {
            var notSelected = [
                'codeset',
                'geodescriptor',
                'subject',
                'survey'
            ];

            return types.filter(function(type) {
                if (notSelected.indexOf(type) === -1) {
                    return true;
                }

                return false;
            });
        }

        function fromURL() {
            var datasetTypes = wb.pageUrlParts.params.fq,
                orgs = [];

            if (datasetTypes) {
                decodeURI(datasetTypes).split(',').forEach(function(o) {
                    if (_this.datasetTypes.indexOf(o) !== -1) {
                        orgs.push(o);
                    }
                });

                if (orgs.length > 0) {
                    return orgs;
                }
            }

            return null;
        }

        this.changed = function() {
            $rootScope.$emit('datasetType.selected', this.selectedDatasetTypes);
        };

        $http.jsonp(typesRequest)
            .then(function(data) {
                var types = data.data.facet_counts.facet_fields.dataset_type.filter(function(value) {
                    if (typeof value == 'string') {
                        return true;
                    }

                    return false;
                });

                _this.datasetTypes = types;
                _this.selectedDatasetTypes = fromURL() || fromDefault(types);
                _this.changed();
            });
    }]);

    app.directive('datasetTypes', function() {
        return {
            restrict: 'E',
            templateUrl: 'templates/dataset-types.html',
            controller: 'DatasetTypesController',
            controllerAs: 'dataTypeCtrl'
        };
    });
})(window, angular, wb);

(function(window, angular, wb) {'use strict';
    var app = angular.module('display-fields', ['fields']);

    app.controller('DisplayFieldsController', ['$rootScope', '$scope', function($rootScope, $scope) {
        var _this = this;

        function fromUrl() {
            var displayFields = wb.pageUrlParts.params.fl,
                fields;

            if (displayFields) {

                fields = [].concat(_this.mandatoryFields);
                decodeURI(displayFields).split(',').forEach(function(field) {
                    if (fields.indexOf(field) === -1) {
                        fields.push(field);
                    }
                });

                // Remove fields that are not recognized;
                /*$rootScope.$on('datasetType.selected', function(event) {
                    var fields = $('#displayfield').scope().fieldsCtrl.fields,
                        fieldsIndex;

                    _this.fields = _this.fields.filter(function(f) {
                        if (fields.indexOf(f) === -1) {
                            return false;
                        }

                        return true;
                    });

                    $rootScope.$apply();
                });*/

                return fields;
            }

            return null;
        }

        this.field = '';
        this.mandatoryFields = [
            'name'
        ];

        this.fields = fromUrl() || [
            'name',
            'content_type_codes',
            'subject_codes',
            'title_en',
            'admin_notes_en'
        ];

        this.getVisible = function() {
            return this.fields.length !== 0;
        };

        this.getMandatory = function(field) {
            return this.mandatoryFields.indexOf(field) !== -1;
        };

        this.addField = function() {
            if (this.field && this.fields.indexOf(this.field) === -1) {
                this.fields.push(this.field);
                this.field = '';
            }
        };

        this.removeField = function(field) {
            this.fields.splice(this.fields.indexOf(field), 1);
        };
    }]);

    app.directive('displayFields', function() {
        return {
            restrict: 'E',
            templateUrl: 'templates/display-fields.html',
            controller: 'DisplayFieldsController',
            controllerAs: 'dspFieldCtrl'
        };
    });

})(window, angular, wb);

(function(window, angular) {'use strict';
    var app = angular.module('fields', ['services.config']);

    app.controller('FieldsController', ['$http', '$q', '$rootScope', 'configuration', function($http, $q, $rootScope, configuration) {
        var _this = this;

        this.datasetTypesFields = {};
        this.fields = [];

        $rootScope.$on('datasetType.selected', function(event, selectedDatasetType) {
            var fieldsRequest = configuration.ckanInstance + '/api/3/action/scheming_dataset_schema_show?callback=JSON_CALLBACK&type=',
                fieldsCallback = function(data) {
                    var type = data.result.dataset_type,
                        fields = data.result.dataset_fields,
                        fieldsLength = fields.length,
                        result = [],
                        languages = data.result.form_languages,
                        languagesLength = languages.length,
                        f, field, l;

                    for (f = 0; f < fieldsLength; f += 1) {
                        field = fields[f];

                        if (field.schema_field_type === 'fluent' || (field.preset && field.preset.indexOf('fluent') !== -1)) {
                            for (l = 0; l < languagesLength; l += 1) {
                                result.push(field.field_name + '_' + languages[l]);
                            }
                        } else {
                            result.push(field.field_name);
                        }
                    }

                    _this.datasetTypesFields[type] = result;
                    addFields(type);
                },
                addFields = function(type) {
                    newFields = newFields.concat(_this.datasetTypesFields[type]);
                },
                promises = [],
                newFields = [],
                o, type, p;

            for (o = 0; o < selectedDatasetType.length; o += 1) {
                type = selectedDatasetType[o];

                if (!_this.datasetTypesFields[type]) {
                    p = $http.jsonp(fieldsRequest + type, {cache: true});
                    p.success(fieldsCallback);
                    promises.push(p);
                } else {
                    addFields(type);
                }
            }

            $q.all(promises)
                .then(function() {
                    _this.fields = [];

                    newFields.forEach(function(val, index, array) {
                        if (_this.fields.indexOf(val) === -1) {
                            _this.fields.push(val);
                        }
                    });

                    _this.fields.sort();
                });
        });
    }]);
})(window, angular);
