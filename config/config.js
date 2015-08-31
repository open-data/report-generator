(function(window, angular) {'use strict';

    angular.module('services.config', [])
        .constant('configuration', {
            ckanInstance: 'http://ndmckand1',
            solrCore: 'http://ndmckand1:8000/solr/ndm_core_dev'
        });

})(window, angular);
