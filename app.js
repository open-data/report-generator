(function(window, angular, wb, $){'use strict';
    var app = angular.module('reportGenerator', ['organizations', 'advanced-search', 'display-fields']);
    
    var $resultsTable = $('#results');
    
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
    
    app.run(['$http', '$rootScope', function($http, $rootScope) {
        $rootScope.sendQuery = function() {
            var url = 'http://ndmckanq1.stcpaz.statcan.gc.ca/so04/select',
                params = {
                    'solr-inst': '/so04',
                    'ckan-inst': '/zj',
                    otherparams: '',
                    org: 'maformat+OR+maindb+OR+maprimary',
                    q: 'entext:(iron)',
                    fl: 'extras_10uid_bi_strs,extras_conttype_en_txtm,extras_title_en_txts,extras_subjnew_en_txtm,extras_pkuniqueidcode_bi_strs,extras_zckstatus_bi_txtm',
                    rows: 1000,
                    'wt': 'json',
                    'json.wrf': 'JSON_CALLBACK'
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