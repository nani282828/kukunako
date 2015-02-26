'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:SettingsCtrl
 * @description
 * # SettingsCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.controller('SettingsCtrl', function($route, $location, $scope, $auth, Restangular, InfinitePosts, $alert, $http, CurrentUser, UserService, fileUpload) {
		$scope.UserService = UserService;
		$http.get('/api/me', {
			headers: {
				'Content-Type': 'application/json',
                'Authorization':$auth.getToken()
			}
		}).success(function(user_id) {
			var passReq = Restangular.one("people", JSON.parse(user_id)).get({seed:Math.random()}).then(function(result) {
              $scope.user = result;

            });

            $scope.updateUsername = function() {
                $scope.user.patch({
                    'username':$scope.u_username
                }).then(function(response){
                    $route.reload();
                })
			};

			$scope.updateFirstLastName = function() {

                $scope.user.patch({
                    'name':{
                        'first':$scope.edit_first_name,
                        'last':$scope.edit_last_name
                    }
                }).then(function(response){
                    $route.reload();
                })
			};


			$scope.uploadFile = function(){
				var file = $scope.myFile;
				console.log('file is ' + JSON.stringify(file));
				var uploadUrl = "/fileUpload";
				fileUpload.uploadFileToUrl(file, uploadUrl,$scope.user);
                $route.reload();
			};

			$scope.updateEmail = function() {
                $scope.user.patch({
                    'email':$scope.u_email
                }).then(function(response){
                    $route.reload();
                });
			};

			$scope.updatePassword = function() {
                $scope.user.patch({
                    'password_test':$scope.u_password
                }).then(function(response){
                    $route.reload();
                });
			};

            $scope.updateInterests = function() {
                var data = ($scope.interests.toString()).split(",");

                for(var k in data){
                    $scope.user.interests.push(data[k]);
                }

                $scope.user.patch({
                    'interests':$scope.user.interests
                }).then(function(response){
                    $route.reload();
                });
			};

		});
	})
	.directive('settingschangepassword', function ($compile, CurrentUser, Restangular, $routeParams, friendsActivity) {
        return {
            restrict: 'E',
            replace: true,
            link: function (scope, element, attrs) {
                console.log("=====call settingschangepassword======")
            },
            controller:function($scope, $http, $route, $element, $attrs, $transclude){

                $scope.updatechangepassword = function(){
                    var html ='<image src="/static/app/images/pleasewait.gif" style="width:;">';
                    $element.html(html);
                    $compile($element.contents())($scope);

                    $http.post('/settingschangepassword',
                        {
                            user_name:$scope.user.username,
                            old_password:$scope.old_password,
                            new_password:$scope.pw1
                        }).
                        success(function(data, status, headers, config) {
                            // this callback will be called asynchronously
                            // when the response is available
                            console.log("====return data====")
                            console.log(data)
                            $scope.get_hash_new_password = data;
                            //html = '<b>Successfully updated your password</b>'
                            //var e =$compile(html)($scope);
                            //$element.replaceWith(e);
                        }).
                        error(function(error) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            html = '<b>Sorry!! please try again</b>'
                            var e =$compile(html)($scope);
                            $element.replaceWith(e);
                        });

                        console.log("=======get hashed password====")
                        console.log($scope.get_hash_new_password)

                        var Update_Password = Restangular.one('people', $scope.user.username).get({seed:Math.random()});

                        Update_Password.then(function(response){
                            $scope.user = response;

                            console.log("=====user details===");
                            console.log($scope.user);
                            $scope.user.patch({
                                'password':$scope.get_hash_new_password,
                                'password_test':$scope.pw1
                            }).then(function(response){
                                // this callback will be called asynchronously
                                // when the response is available

                                console.log("===after patch=====");
                                console.log(response);
                                html = '<h6><b>your password has been changed</b></h6>'
                                var e =$compile(html)($scope);
                                $element.replaceWith(e);

                            });
                        });


                }
            }
        };
    })
	.directive('pwCheck', [function () {
        return {
            require: 'ngModel',
            link: function (scope, elem, attrs, ctrl) {
                var firstPassword = '#' + attrs.pwCheck;
                elem.add(firstPassword).on('keyup', function () {
                    scope.$apply(function () {
                        // console.info(elem.val() === $(firstPassword).val());
                        ctrl.$setValidity('pwmatch', elem.val() === $(firstPassword).val());
                    });
                });
            }
        }
    }]);