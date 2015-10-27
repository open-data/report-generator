(function(window, angular, wb) {'use strict';
    var app = angular.module('dataset-types', ['checklist-model', 'services.config']);

    app.controller('DatasetTypesController', ['$http', '$rootScope', 'configuration', function($http, $rootScope, configuration) {
        var typesRequest = configuration.solrCore + '/select?fq=site_id:' + configuration.siteID + '&q=*:*&rows=0&wt=json&facet=true&facet.field=dataset_type',
            _this = this,
            httpMethod = $http.get;

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

        function querySuccess(data) {
            var types = data.data.facet_counts.facet_fields.dataset_type.filter(function(value) {
                if (typeof value == 'string') {
                    return true;
                }

                return false;
            });

            _this.datasetTypes = types;
            _this.selectedDatasetTypes = fromURL() || fromDefault(types);
            _this.changed();
        }

        this.changed = function() {
            $rootScope.$emit('datasetType.selected', this.selectedDatasetTypes);
        };

        if (configuration.solrCore.indexOf(configuration.ckanInstance) === -1) {
            typesRequest += '&json.wrf=JSON_CALLBACK';
            httpMethod = $http.jsonp;
        }

        httpMethod(typesRequest)
                .then(querySuccess);
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
