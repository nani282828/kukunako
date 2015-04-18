'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:InstantsearchCtrl
 * @description
 * # InstantsearchCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
.directive('instancesearch', function ($compile, CurrentUser, Restangular, $routeParams, friendsActivity,$route, InstanceSearch) {
    return {
        restrict: 'A',
        replace: true,
        link: function ($scope, element, attrs) {},
        controller:function($scope, $element, $attrs, $transclude){
            $scope.instancesearch = new InstanceSearch();
            $scope.InstanceSearchPeoples = function() {

                $scope.instancesearch.getInstancePeoples($scope.InstanceSearchQuery)
                console.log($scope.instancesearch)
                $scope.testing = 'dddddddddddcccccccccccddd'

            }
        }

    };
});