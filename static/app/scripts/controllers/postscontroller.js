'use strict';
/**
 * @ngdoc function
 * @name weberApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.controller('PostLoadController', function($scope, $routeParams, PostService) {
	    $scope.PostService = PostService;
	    $scope.postid = $routeParams.postid;

	});