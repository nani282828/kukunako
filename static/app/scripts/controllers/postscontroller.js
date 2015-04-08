'use strict';
/**
 * @ngdoc function
 * @name weberApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.controller('PostLoadController', function($http, $auth, Restangular, $scope,
	                                           $routeParams, PostService, InfinitePosts) {

	    $scope.postid = $routeParams.postid;
	    $http.get('/api/me', {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': $auth.getToken()
			}
		}).success(function(user_id) {
			Restangular.one('people',JSON.parse(user_id)).get({seed:Math.random()}).then(function(user) {

                $scope.user = user;
				var loadPostIds = angular.copy(user.friends)

                if (user.friends.length !== 0) {

				    var params = '{"_id": {"$in":["'+($scope.user.friends).join('", "') + '"'+']}}';

					Restangular.all('people').getList({where :params}).then(function(friend) {
						$scope.friends = friend;
					});
				}

				$scope.infinitePosts = new InfinitePosts(user, []);
				$scope.infinitePosts.getSpecificPost($routeParams)

                $scope.confirm_delete = function(){
                    $scope.infinitePosts.deletePost($scope.infinitePosts.posts[0], user);
                }

			});
		});

	});