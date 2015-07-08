(function(window, angular){'use strict';
    var app = angular.module('display-fields', ['fields']);
    
    app.controller('DisplayFieldsController',['$rootScope', function($rootScope) {
        this.field = '';
        this.fields = [
            'extras_10uid_bi_strs',
            'extras_conttype_en_txtm',
            'extras_title_en_txts',
            'extras_subjnew_en_txtm',
            'extras_pkuniqueidcode_bi_strs',
            'extras_zckstatus_bi_txtm'   
        ];
        
        this.getVisible = function() {
            return this.fields.length !== 0;
        }
        
        this.addField = function() {
            if (this.field && this.fields.indexOf(this.field) === -1) {
                this.fields.push(this.field);
                this.field = '';
            }
        }
        
        this.removeField = function(field) {
            this.fields.splice(this.fields.indexOf(field), 1);
        }
    }]);
    
    app.directive('displayFields', function() {
        return {
            restrict: 'E',
            templateUrl: 'templates/display-fields.html',
            controller: 'DisplayFieldsController',
            controllerAs: 'dspFieldCtrl'
        }
    });

})(window, window.angular);