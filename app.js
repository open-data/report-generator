(function(window, angular, wb, $) {'use strict';
    var app = angular.module('reportGenerator', ['organizations', 'advanced-search', 'display-fields']),
        $resultsTable = $('#results');

    app.run(['$http', '$rootScope', function($http, $rootScope) {

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
                        row[field] = '<a target="_blank" href="' + $rootScope.ckanInstance + '/zj/dataset/' + cell + '">' + cell + '</a><br>' +
                            '<a target="_blank" href="' + $rootScope.ckanInstance + '/zj/dataset/edit/' + cell + '#field-extras-1-key" class="btn btn-default">' +
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

        $rootScope.ckanInstance = 'http://ndmckanq1.stcpaz.statcan.gc.ca';
        $rootScope.solrCore =  $rootScope.ckanInstance + '/so04';
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
                '?fq=' + $rootScope.orgCtrl.selectedOrganizations.join(',') +
                '&q=' + $rootScope.query +
                '&fl=' + $rootScope.dspFieldCtrl.fields.join(',') +
                '&rows=' + $rootScope.maxResults;
        };

        $rootScope.sendQuery = function() {
            var url = $rootScope.solrCore + '/select',
                params = {
                    wt: 'json',
                    'json.wrf': 'JSON_CALLBACK',
                    otherparams: '',
                    fq: 'zckownerorg_bi_strs:' + $rootScope.orgCtrl.selectedOrganizations.join(' OR '),
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

                // Remove fields that are not reckognized;
                $rootScope.$on('organization.selected', function(event) {
                    setTimeout(function() {
                        var fields = $('#displayfield').scope().fieldsCtrl.fields,
                            fieldsIndex;

                        _this.fields = _this.fields.filter(function(f) {
                            if (fields.indexOf(f) === -1) {
                                return false;
                            }

                            return true;
                        });

                        $rootScope.$apply();
                    }, 500);
                });

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
            'extras_conttype_en_txtm',
            'extras_title_en_txts',
            'extras_subjnew_en_txtm',
            'extras_pkuniqueidcode_bi_strs',
            'extras_zckstatus_bi_txtm'
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
    var app = angular.module('fields', []);

    app.controller('FieldsController', ['$http', '$q', '$rootScope', function($http, $q, $rootScope) {
        var _this = this;

        this.organizationFields = {};
        this.fields = [];

        $rootScope.$on('organization.selected', function(event, selectedOrganizations) {
            var fieldsRequest = $rootScope.solrCore + '/select?q=*&rows=1&fl=extras_*,name&wt=json&json.wrf=JSON_CALLBACK&fq=extras_zckownerorg_bi_strs:',
                fieldsCallback = function(data) {
                    var fq = data.responseHeader.params.fq,
                        org = fq.substr(fq.indexOf(':') + 1);

                    _this.organizationFields[org] = Object.keys(data.response.docs[0]);
                    newFields = newFields.concat(_this.organizationFields[org]);
                },
                promises = [],
                newFields = [],
                o, org, p;

            for (o = 0; o < selectedOrganizations.length; o += 1) {
                org = selectedOrganizations[o];

                if (!_this.organizationFields[org]) {
                    p = $http.jsonp(fieldsRequest + org, {cache: true});
                    p.success(fieldsCallback);
                    promises.push(p);
                } else {
                    newFields = newFields.concat(_this.organizationFields[org]);
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

(function(window, angular, wb) {'use strict';
    var app = angular.module('organizations', ['checklist-model']);

    app.controller('OrganizationsController', ['$http', '$rootScope', function($http, $rootScope) {
        var orgRequest = $rootScope.ckanInstance + '/zj/api/3/action/organization_list?callback=JSON_CALLBACK',
            _this = this;

        function fromURL() {
            var organizations = wb.pageUrlParts.params.fq,
                orgs = [];

            if (organizations) {
                decodeURI(organizations).split(',').forEach(function(o) {
                    if (_this.organizations.indexOf(o) !== -1) {
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
            $rootScope.$emit('organization.selected', this.selectedOrganizations);
        };

        $http.jsonp(orgRequest)
            .then(function(data) {
                _this.organizations = data.data.result;
                _this.selectedOrganizations = fromURL() || [
                    'maformat',
                    'maimdb',
                    'maprimary'
                ];
                _this.changed();
            });
    }]);

    app.directive('organizations', function() {
        return {
            restrict: 'E',
            templateUrl: 'templates/organizations.html',
            controller: 'OrganizationsController',
            controllerAs: 'orgCtrl'
        };
    });
})(window, angular, wb);
