'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:EmailCtrl
 * @description
 * # EmailCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.controller('EmailCtrl', function($http, Restangular, $scope, $auth, $alert, $location, $routeParams) {

        Restangular.one('people',$routeParams.objectId).get().then(function(user) {
              $scope.user = user;

              if($routeParams.random_string == $scope.user.random_string){
                if($scope.user.email_confirmed==true){
                    $scope.user_email_confirmed = "your email is already activated"
                    return;
                }
                console.log('email confirmed-->',$scope.user.email_confirmed)
                $scope.user.patch({
                        'email_confirmed':true
                }).then(function(response){
                        console.log('---------->', response);
                        //$location.path('/login');
                });
              }
        });
    });