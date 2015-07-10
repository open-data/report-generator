(function(window, angular, wb, $){'use strict';
    var app = angular.module('reportGenerator', ['organizations', 'advanced-search', 'display-fields']);
    
    var $resultsTable = $('#results');
    
    function createOrganizationList(orgs) {
        return orgs.join(' OR ');
    }
    
    function createFieldsList(fields) {
        return fields.join(',');
    }
    
    function createQuery(keywords) {
        keywords = keywords.replace(/(.*?)((?: (?:OR|AND) )|$)/g, function(match, key, sep) {
            if (key.length !== 0 && !key.match(/:[\(\[].*?[\)\]]/)) {
                key = 'entext:(' + key + ')';
            }
            return key + sep;
        });
        return keywords;
    }
    
    function sanitizeData(rows, fields) {
        var row, r, field, f, cell;
        
        for(r = 0; r < rows.length; r += 1) {
            row = rows[r];
            
            for (f = 0; f < fields.length; f+= 1) {
                field = fields[f];
                cell = row[field];
                
                row[field] = cell || '';
                
                if (typeof cell === 'object') {
                    row[field] = cell.join(',');
                }
            }
        }
        
        return rows;
    };
    
    function createFieldsMapping(fields) {
        var fieldsMapping = [],
            f;
        
        for(f = 0; f < fields.length; f += 1) {
            fieldsMapping.push({
                data: fields[f],
                title: fields[f],
            });
        }
        
        return fieldsMapping;
    }
    
    app.run(['$http', '$rootScope', '$controller', function($http, $rootScope, $controller) {
        //var organizationController = $controller('OrganizationsController as orgCtrl');

        $rootScope.sendQuery = function() {
            var url = 'http://ndmckanq1.stcpaz.statcan.gc.ca/so04/select',
                params = {
                    'wt': 'json',
                    'json.wrf': 'JSON_CALLBACK',
                    otherparams: '',
                    fq: 'zckownerorg_bi_strs:' + createOrganizationList($rootScope.orgCtrl.selectedOrganizations),
                    q: createQuery($rootScope.query),
                    fl: createFieldsList($rootScope.dspFieldCtrl.fields),
                    rows: 1000
                    
                };
            
            $http.jsonp(url, {params: params})
                .then(function(data){
                    $rootScope.debug = data;
                    $rootScope.queryResults = data.data.response;
                    
                    var fields = data.data.responseHeader.params.fl.split(','),
                        datatable = {
                            data: sanitizeData($rootScope.queryResults.docs, fields),
                            columns: createFieldsMapping(fields)
                        };
                        
                    $resultsTable
                        .DataTable().destroy();
                    
                    $resultsTable
                        .empty()
                        .removeClass('wb-tables-inited wb-init')
                        .attr('data-wb-tables', JSON.stringify(datatable))
                        .trigger('wb-init.wb-tables');
                })
        }
    }]);

})(window, window.angular, window.wb, jQuery);