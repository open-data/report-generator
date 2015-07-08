(function(window, angular){'use strict';
    var app = angular.module('organizations', ['checklist-model']);
    
    app.controller('OrganizationsController', ['$http', '$rootScope', function($http, $rootScope) {
        var orgRequest = 'http://ndmckanq1.stcpaz.statcan.gc.ca/zj/api/3/action/organization_list?callback=JSON_CALLBACK',
            _this = this;
        
        this.changed = function() {
            $rootScope.$emit('organization.selected', this.selectedOrganizations);
        }
        
        $http.jsonp(orgRequest)
            .then(function(data) {
                _this.organizations = data.data.result;
                _this.selectedOrganizations = [
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
        }
    });
})(window, window.angular);