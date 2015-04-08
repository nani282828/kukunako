'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:ForgotPasswordCtrl
 * @description
 * # ForgotPasswordCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.directive('passwordrecovery', function ($compile, CurrentUser, Restangular, $routeParams, friendsActivity) {
        return {
            restrict: 'E',
            replace: true,
            link: function (scope, element, attrs) {},
            controller:function($scope, $http, $element, $attrs, $transclude){

                $scope.sendPassword = function(){

                    $scope.password_recovery_busy = $http.post('/forgotpasswordlink', {email:$scope.email}).
                        success(function(data, status, headers, config) {
                            // this callback will be called asynchronously
                            // when the response is available
                            var html = '<b>password link has been sent to your email</b><br><p>Please check your email</p>'
                            var e =$compile(html)($scope);
                            $element.replaceWith(e);
                        }).
                        error(function(error) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            var html = '<b>your email does not exist, Please check it once..</b>'
                            var e =$compile(html)($scope);
                            $element.replaceWith(e);
                        });


                }
            }
        };
    })
    .directive('changepassworddirective', function ($compile, CurrentUser, Restangular, $routeParams, friendsActivity) {
        return {
            restrict: 'E',
            replace: true,
            link: function (scope, element, attrs) {},
            controller:function($scope, $http, $element, $attrs, $transclude, $routeParams){

                var user_name = $routeParams.user_name;
                var password_random_string = $routeParams.password_random_string;

                console.log(user_name+password_random_string);

                $scope.passwordButton = function(){
                    var html ='<image src="/static/app/images/pleasewait.gif" style="width:;">';
                    $element.html(html);
                    $compile($element.contents())($scope);

                    $http.post('/changepassword', {user_name:$routeParams.user_name, password:$scope.formData.password}).
                        success(function(data, status, headers, config) {
                            console.log("========hashed password======");
                            console.log(data);
                            $scope.hashed_password = data;
                        }).
                        error(function(error) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            html = '<b>your email does not exist, Please check it once..</b>'
                            var e =$compile(html)($scope);
                            $element.replaceWith(e);
                    });

                    var Update_Password = Restangular.one('people', $routeParams.user_name).get({seed:Math.random()});

                    Update_Password.then(function(response){
                        $scope.user = response;

                        console.log("=====user details===");
                        console.log($scope.user);

                        $scope.user.patch({
                            'password':$scope.hashed_password
                        }).then(function(response){
                            // this callback will be called asynchronously
                            // when the response is available

                            console.log("===after patch=====");
                            console.log(response);
                            html = '<b>your password has been changed</b>'
                            var e =$compile(html)($scope);
                            $element.replaceWith(e);

                        });
                    });




                }
            }
        };
    });