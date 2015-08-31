(function(window, angular) {'use strict';

    angular.module('services.config', [])
        .constant('configuration', {
            ckanInstance: 'http://ndmckanq1.stcpaz.statcan.gc.ca/zj',
            solrCore: 'http://ndmckanq1.stcpaz.statcan.gc.ca/so04'
        });

})(window, angular);
