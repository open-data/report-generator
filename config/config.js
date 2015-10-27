(function(window, angular) {'use strict';

    angular.module('services.config', [])
        .constant('configuration', {
            ckanInstance: '@@ckanInstance',
            solrCore: '@@solrCore',
            siteID: '@@siteID'
        });

})(window, angular);
