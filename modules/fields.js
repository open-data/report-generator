

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
                        result = {},
                        languages = data.result.form_languages,
                        languagesLength = languages.length,
                        f, field, l, fieldObj;

                    for (f = 0; f < fieldsLength; f += 1) {
                        field = fields[f];
                        fieldObj = {type: field.schema_field_type};

                        if (field.schema_field_type === 'fluent' || (field.preset && field.preset.indexOf('fluent') !== -1)) {
                            for (l = 0; l < languagesLength; l += 1) {
                                result[field.field_name + '_' + languages[l]] = fieldObj;
                            }
                        } else {
                            result[field.field_name] = fieldObj;
                        }
                    }

                    _this.datasetTypesFields[type] = result;
                    addFields(type);
                },
                addFields = function(type) {
                    newFields = newFields.concat(Object.keys(_this.datasetTypesFields[type]));
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
