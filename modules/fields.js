(function(window, angular) {'use strict';
    var app = angular.module('fields', ['services.config']);

    app.controller('FieldsController', ['$http', '$q', '$rootScope', 'configuration', function($http, $q, $rootScope, configuration) {
        var _this = this;

        $rootScope.fieldsCtrl = this;

        this.datasetTypesFields = {};
        this.fields = [];

        $rootScope.$on('datasetType.selected', function(event, selectedDatasetType) {
            var fieldsRequest = configuration.ckanInstance + '/api/3/action/scheming_dataset_schema_show?callback=JSON_CALLBACK&type=',
                fieldsCallback = function(response) {
                    var result = response.data.result,
                        type = result.dataset_type,
                        fields = result.dataset_fields,
                        fieldsLength = fields.length,
                        fieldsResults = {},
                        languages = result.form_languages || [],
                        languagesLength = languages.length,
                        f, field, l, fieldObj;

                    for (f = 0; f < fieldsLength; f += 1) {
                        field = fields[f];
                        fieldObj = {type: field.schema_field_type};

                        if (field.schema_field_type === 'fluent' || (field.preset && field.preset.indexOf('fluent') !== -1)) {
                            for (l = 0; l < languagesLength; l += 1) {
                                fieldsResults[field.field_name + '_' + languages[l]] = fieldObj;
                            }
                        } else {
                            fieldsResults[field.field_name] = fieldObj;

                            if (field.lookup) {
                                for (l = 0; l < languagesLength; l += 1) {
                                    fieldsResults[field.field_name + '_desc_' + languages[l]] = fieldObj;
                                }
                            }
                        }
                    }

                    _this.datasetTypesFields[type] = fieldsResults;
                    addFields(type);
                },
                fieldErrorCallback = function(response) {
                    var type = response.config.url.match(/type=([^&]*)/)[1],
                        types = $rootScope.dataTypeCtrl.datasetTypes;

                    types.splice(types.indexOf(type), 1);
                },
                addFields = function(type) {
                    $.extend(newFields, _this.datasetTypesFields[type]);
                },
                promises = [],
                newFields = {},
                o, type, p;

            for (o = 0; o < selectedDatasetType.length; o += 1) {
                type = selectedDatasetType[o];

                if (!_this.datasetTypesFields[type]) {
                    p = $http.jsonp(fieldsRequest + type, {cache: true})
                        .then(fieldsCallback, fieldErrorCallback);
                    promises.push(p);
                } else {
                    addFields(type);
                }
            }

            $q.all(promises)
                .then(function() {
                    _this.fields = Object.keys(newFields).sort();
                    _this.fieldsDef = newFields;
                });
        });
    }]);
})(window, angular);
