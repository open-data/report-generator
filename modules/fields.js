(function(window, angular) {'use strict';
    var app = angular.module('fields', ['services.config']);

    app.controller('FieldsController', ['$http', '$q', '$rootScope', 'configuration', function($http, $q, $rootScope, configuration) {
        var _this = this;

        this.datasetTypesFields = {};
        this.fields = [];

        $rootScope.$on('datasetType.selected', function(event, selectedDatasetType) {
            var fieldsRequest = configuration.solrCore + '/select?q=*&rows=1&fl=extras_*,name&wt=json&json.wrf=JSON_CALLBACK&fq=dataset_type:',
                fieldsCallback = function(data) {
                    var fq = data.responseHeader.params.fq,
                        type = fq.substr(fq.indexOf(':') + 1);

                    _this.datasetTypesFields[type] = Object.keys(data.response.docs[0]);
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
                    newFields = newFields.concat(_this.datasetTypesFields[type]);
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
