(function(window, angular){'use strict';
    var app = angular.module('reportGenerator', ['organizations', 'advanced-search', 'display-fields']);
    
    app.controller('Search',['$scope', function($scope) {
        $scope.query = ''
    }]);
    
})(window, window.angular);