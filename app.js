(function(window, angular, wb, $) {'use strict';
    var app = angular.module('reportGenerator', ['organizations', 'advanced-search', 'display-fields']),
        $resultsTable = $('#results');

    app.run(['$http', '$rootScope', function($http, $rootScope) {

        function createQuery(keywords) {
            var regexp = /(.*?)((?: (?:OR|AND) )|$)/g;

            if (keywords.length === 0) {
                return '*';
            }

            keywords = keywords.replace(regexp, function(match, key, sep) {
                if (key.length !== 0 && !key.match(/:[\(\[].*?[\)\]]/)) {
                    key = 'entext:(' + key + ')';
                }
                return key + sep;
            });
            return keywords;
        }

        function sanitizeData(rows, fields) {
            var row, r, field, f, cell;

            for (r = 0; r < rows.length; r += 1) {
                row = rows[r];

                for (f = 0; f < fields.length; f += 1) {
                    field = fields[f];
                    cell = row[field];

                    row[field] = cell || '';

                    if (field === 'name') {
                        row[field] = '<a target="_blank" href="' + $rootScope.ckanInstance + '/zj/dataset/' + cell + '">' + cell + '</a><br>' +
                            '<a target="_blank" href="' + $rootScope.ckanInstance + '/zj/dataset/edit/' + cell + '#field-extras-1-key" class="btn btn-default">' +
                                '<span class="glyphicon glyphicon-pencil"><span class="wb-inv">Edit ' + cell + '</span></a>';
                    } else if (typeof cell === 'object') {
                        row[field] = cell.join(',');
                    }
                }
            }

            return rows;
        }

        function createFieldsMapping(fields) {
            var fieldsMapping = [],
                f;

            for (f = 0; f < fields.length; f += 1) {
                fieldsMapping.push({
                    data: fields[f],
                    title: fields[f],
                });
            }

            return fieldsMapping;
        }

        function maxResultsFromUrl() {
            var maxResults = wb.pageUrlParts.params.rows;

            if ($rootScope.maxResultsOptions[maxResults]) {
                return maxResults;
            }
        }

        $rootScope.ckanInstance = 'http://ndmckanq1.stcpaz.statcan.gc.ca';
        $rootScope.solrCore =  $rootScope.ckanInstance + '/so04';
        $rootScope.query = wb.pageUrlParts.params.q ? decodeURI(wb.pageUrlParts.params.q) : '';
        $rootScope.maxResultsOptions = {
            20: 20,
            50: 50,
            100: 100,
            1000: '1000 (default)',
            2000: 2000
        };
        $rootScope.maxResults = maxResultsFromUrl() || '1000';

        $rootScope.saveUrl = function() {
            var urlParts = wb.pageUrlParts,
                url = urlParts.absolute.replace(urlParts.search, '').replace(urlParts.hash, '');

            $rootScope.savedUrl = url +
                '?fq=' + $rootScope.orgCtrl.selectedOrganizations.join(',') +
                '&q=' + $rootScope.query +
                '&fl=' + $rootScope.dspFieldCtrl.fields.join(',') +
                '&rows=' + $rootScope.maxResults;
        };

        $rootScope.sendQuery = function() {
            var url = $rootScope.solrCore + '/select',
                params = {
                    wt: 'json',
                    'json.wrf': 'JSON_CALLBACK',
                    otherparams: '',
                    fq: 'zckownerorg_bi_strs:' + $rootScope.orgCtrl.selectedOrganizations.join(' OR '),
                    q: createQuery($rootScope.query),
                    fl: $rootScope.dspFieldCtrl.fields.join(','),
                    rows: parseInt($rootScope.maxResults, 10)
                };

            $http.jsonp(url, {params: params})
                .then(function(data) {
                    $rootScope.queryResultsCount = data.data.response.numFound;
                    $rootScope.queryResults = data.data.response;
                    $rootScope.downloadLink = data.config.url + '?' + $.param($.extend({}, data.config.params, {wt: 'csv'}));

                    var fields = data.data.responseHeader.params.fl.split(','),
                        datatable = {
                            data: sanitizeData($rootScope.queryResults.docs, fields),
                            columns: createFieldsMapping(fields),
                            pageLength: 100,
                            lengthMenu: [[50, 100, 200, 500, -1], [50, 100, 200, 500, 'All']]
                        };

                    $resultsTable
                        .DataTable().destroy();

                    $resultsTable
                        .empty()
                        .removeClass('wb-tables-inited wb-init')
                        .attr('data-wb-tables', JSON.stringify(datatable))
                        .trigger('wb-init.wb-tables');
                });
        };
    }]);

})(window, angular, wb, jQuery);
