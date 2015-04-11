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

        var object_id = $routeParams.objectId;

          var em = Restangular.one('people',object_id).get().then(function(user) {
              $scope.user = user;
              console.log($scope.user.random_string);

              if(element == $scope.user.random_string){
                if($scope.user.email_confirmed==true){
                    $scope.user_email_confirmed = "your email is already activated"
                }
                else{
                    $scope.user.patch({
                        'email_confirmed':true
                    }).then(function(response){
                        console.log(response);
                        //$location.path('/login');
                    });
                }

              }
              else{
                console.log("------------")
                console.log("not valid")
              }

            });





	});