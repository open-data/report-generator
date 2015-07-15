(function(window, angular){'use strict';
    var app = angular.module('advanced-search', ['fields']);
    
    app.controller('AdvancedSearchController', ['$rootScope', function($rootScope) {
        this.emptyKey = false;
        this.operator = 'AND'
        this.keyword = ''
        
        this.addField = function() {
            var actualOperator = '',
                expr;
            
            if (this.field && (this.keyword || this.emptyKey) ) {
                expr = this.emptyKey ? 
                    '-' + this.field + ":" + '["" TO *]' : 
                    this.field +':(*' + this.keyword + '*)';
                
                if ($rootScope.query && $rootScope.query.trim() !== '') {
                    actualOperator = " " + (this.emptyKey ? 'AND' : this.operator) + " ";
                }
                
                $rootScope.query += actualOperator + expr;
                
                this.keyword = '';
                this.field = '';
            }
        };
    }]);
    
    app.directive('advancedSearch', function() {
        return {
            restrict: 'E',
            templateUrl: 'templates/advanced-search.html',
            controller: 'AdvancedSearchController',
            controllerAs: 'advSrchCtrl'
        }
    });

/*
    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
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

})(window, window.angular);