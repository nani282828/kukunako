'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:EmailDetailsCtrl
 * @description
 * # EmailDetailsCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.controller('EmailDetailsCtrl', function($http, Restangular, $scope, $auth, $alert, $location, $routeParams) {

        //var element = $routeParams.userId;
        //console.log(element)

        $scope.email = $routeParams.userId;
        //console.log($scope.user);
    });