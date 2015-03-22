'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.controller('LoginCtrl', function($scope, $auth, $alert,$location, $routeParams,$rootScope) {


		$scope.submitLogin = function() {
            //alert($routeParams.query)
			$auth.login({
				email: $scope.formData.email,
				password: $scope.formData.password
			}).then(function(response) {
				$auth.setToken(response.data.token);
				$rootScope.isloggin = true;

				if($routeParams.query){
				    $location.path('search')
				}
				//$location.path('/home');
			}, function(error) {
				$scope.error = error.data.error;
				/*$alert({
					title: 'Login Failed: ',
					content: error.data.error,
					placement: 'top',
					type: 'danger',
					show: true
				});*/
			});
		};
	});