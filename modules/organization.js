(function(window, angular, wb) {'use strict';
    var app = angular.module('organizations', ['checklist-model']);

    app.controller('OrganizationsController', ['$http', '$rootScope', function($http, $rootScope) {
        var orgRequest = $rootScope.ckanInstance + '/zj/api/3/action/organization_list?callback=JSON_CALLBACK',
            _this = this;

        function fromURL() {
            var organizations = wb.pageUrlParts.params.fq,
                orgs = [];

            if (organizations) {
                decodeURI(organizations.split(',')).forEach(function(o) {
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
