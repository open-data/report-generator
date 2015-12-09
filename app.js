
(function(window, angular, wb, $) {'use strict';
    var app = angular.module('reportGenerator', ['dataset-types', 'advanced-search', 'display-fields', 'services.config']),
        $resultsTable = $('#results'),
        maxFieldItems = 100,
        queryDefaults = {
            wt: 'json'
        },
        datatableDefaults = {
            columnDefs: [
                {
                    className: 'nowrap right',
                    targets: [0]
                }
            ],
            pageLength: 100,
            lengthMenu: [[50, 100, 200, 500, -1], [50, 100, 200, 500, 'All']]
        };

    app.run(['$http', '$rootScope', 'configuration', function($http, $rootScope, configuration) {

        function createQuery(keywords) {
            var regexp = /(.*?)((?: (?:OR|AND) )|$)/g;

            if (keywords.length === 0) {
                return '*';
            }

            keywords = keywords.replace(regexp, function(match, key, sep) {
                if (key.length !== 0 && !key.match(/:[\(\[].*?[\)\]]/)) {
                    key = 'text:(*' + key + '*)';
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
                        row[field] = '' + cell + ' ' +
                            '<a target="_blank" href="' + configuration.ckanInstance + '/dataset/' + cell + '" class="btn btn-default">' +
                                '<span class="glyphicon glyphicon-eye-open"><span class="wb-inv">View ' + cell + '</span></a>' +
                            '<a target="_blank" href="' + configuration.ckanInstance + '/dataset/edit/' + cell + '" class="btn btn-default">' +
                                '<span class="glyphicon glyphicon-pencil"><span class="wb-inv">Edit ' + cell + '</span></a>';
                    } else if (typeof cell === 'object') {
                        row[field] = cell.splice(0, maxFieldItems).join(',');
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

        $rootScope.query = wb.pageUrlParts.params.q ? decodeURI(wb.pageUrlParts.params.q) : '';
        $rootScope.maxResultsOptions = {
            20: 20,
            50: 50,
            100: 100,
            1000: '1000 (default)',
            2000: 2000
        };
        $rootScope.maxResults = maxResultsFromUrl() || '1000';

        $rootScope.clearKeywords = function() {
            $rootScope.query = '';
        };

        $rootScope.saveUrl = function() {
            var urlParts = wb.pageUrlParts,
                url = urlParts.absolute.replace(urlParts.search, '').replace(urlParts.hash, '');

            $rootScope.savedUrl = url +
                '?fq=' + $rootScope.dataTypeCtrl.selectedDatasetTypes.join(',') +
                '&q=' + $rootScope.query +
                '&fl=' + $rootScope.dspFieldCtrl.fields.join(',') +
                '&rows=' + $rootScope.maxResults;
        };

        $rootScope.sendQuery = function() {
            var url = configuration.solrCore + '/select',
                params = $.extend(queryDefaults, {
                    fq: 'site_id:' + configuration.siteID + ' AND state:active AND dataset_type:(' + $rootScope.dataTypeCtrl.selectedDatasetTypes.join(' OR ') + ')',
                    q: createQuery($rootScope.query),
                    fl: $rootScope.dspFieldCtrl.fields.join(','),
                    rows: parseInt($rootScope.maxResults, 10)
                }),
                httpMethod = $http.get;

            if (configuration.solrCore.indexOf(configuration.ckanInstance) === -1) {
                httpMethod = $http.jsonp;
                params['json.wrf'] = 'JSON_CALLBACK';
            }

            httpMethod(url, {params: params})
                .then(function(data) {
                    $rootScope.queryError = false;
                    $rootScope.queryResultsCount = data.data.response.numFound;
                    $rootScope.queryResults = data.data.response;
                    $rootScope.downloadLink = data.config.url + '?' + $.param($.extend({}, data.config.params, {wt: 'csv', rows: 999999999}));

                    var fields = data.data.responseHeader.params.fl.split(','),
                        datatable = $.extend(datatableDefaults, {
                            data: sanitizeData($rootScope.queryResults.docs, fields),
                            columns: createFieldsMapping(fields),
                        });

                    $resultsTable
                        .DataTable().destroy();

                    $resultsTable
                        .empty()
                        .removeClass('wb-tables-inited wb-init')
                        .attr('data-wb-tables', JSON.stringify(datatable))
                        .trigger('wb-init.wb-tables');
                }, function(response) {
                    delete $rootScope.queryResults;
                    $rootScope.queryError = true;

                    if (response && response.data && response.data.error && response.data.error.msg) {
                        $rootScope.queryErrorMessage = response.data.error.msg;
                    }
                });
        };
    }]);

})(window, angular, wb, jQuery);
