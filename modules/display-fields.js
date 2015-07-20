(function(window, angular, wb) {'use strict';
    var app = angular.module('display-fields', ['fields']);

    app.controller('DisplayFieldsController', ['$rootScope', '$scope', function($rootScope, $scope) {
        var _this = this;

        function fromUrl() {
            var displayFields = decodeURI(wb.pageUrlParts.params.fl),
                fields;

            if (displayFields) {
                fields = [].concat(_this.mandatoryFields);
                displayFields.split(',').forEach(function(field) {
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