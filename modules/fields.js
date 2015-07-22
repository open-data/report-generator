(function(window, angular) {'use strict';
    var app = angular.module('fields', []);

    app.controller('FieldsController', ['$http', '$q', '$rootScope', function($http, $q, $rootScope) {
        var _this = this;

        this.organizationFields = {};
        this.fields = [];

        $rootScope.$on('organization.selected', function(event, selectedOrganizations) {
            var fieldsRequest = $rootScope.solrCore + '/select?q=*&rows=1&fl=extras_*,name&wt=json&json.wrf=JSON_CALLBACK&fq=extras_zckownerorg_bi_strs:',
                fieldsCallback = function(data) {
                    var fq = data.responseHeader.params.fq,
                        org = fq.substr(fq.indexOf(':') + 1);

                    _this.organizationFields[org] = Object.keys(data.response.docs[0]);
                    newFields = newFields.concat(_this.organizationFields[org]);
                },
                promises = [],
                newFields = [],
                o, org, p;

            for (o = 0; o < selectedOrganizations.length; o += 1) {
                org = selectedOrganizations[o];

                if (!_this.organizationFields[org]) {
                    p = $http.jsonp(fieldsRequest + org, {cache: true});
                    p.success(fieldsCallback);
                    promises.push(p);
                } else {
                    newFields = newFields.concat(_this.organizationFields[org]);
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
