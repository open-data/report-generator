(function(window, angular) {'use strict';
    var app = angular.module('advanced-search', ['fields']);

    app.controller('AdvancedSearchController', ['$rootScope', function($rootScope) {
        this.emptyKey = false;
        this.operator = 'AND';
        this.keyword = '';

        this.onEmptyChanged = function() {
            if (this.emptyKey) {
                this.operator = 'AND';
            }
        };

        this.addField = function() {
            var getExpression = function() {
                    var escapeKeyword = function(keyword) {
                            return keyword.replace(/:/g, '\\:');
                        },
                        prefix = this.field + ':',
                        keyword = this.keyword,
                        type;

                    if (this.emptyKey) {
                        return '-' + prefix + '[* TO *]';
                    } else {
                        type = $rootScope.fieldsCtrl.fieldsDef[this.field].type;
                        switch (type) {
                            case 'date': {
                                try {
                                    keyword = new Date(keyword).toISOString();
                                } catch (e) {}
                                return prefix + '(' + escapeKeyword(keyword) + ')';
                            }
                        }
                    }

                    return prefix + '(*' + escapeKeyword(keyword) + '*)';
                },
                operatorStr = '',
                expr;

            if (this.field && (this.keyword || this.emptyKey)) {
                expr = getExpression.apply(this);

                if ($rootScope.query && $rootScope.query.trim() !== '') {
                    operatorStr = ' ' + (this.operator) + ' ';
                }

                $rootScope.query += operatorStr + expr;

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
