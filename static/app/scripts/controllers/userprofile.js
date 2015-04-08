'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:UserprofileCtrl
 * @description
 * # UserprofileCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.controller('UserprofileCtrl', function($scope, $routeParams,$templateCache,
	                                        Restangular, InfinitePosts, UserService,
	                                        CurrentUser, FriendsNotific, friendsActivity) {

		$scope.UserService = UserService;
        var currentuserobj = new CurrentUser();
         currentuserobj.getUserId()
            .then(function(){
                currentuserobj.getCUserDetails(currentuserobj.userId).then(function(user){
                    var user_obj = Restangular.one('people', $routeParams.username);
		            user_obj.get({ seed : Math.random() }).then(function(profileuser) {
		                $scope.profileuser = profileuser;
                        $scope.currentuser = user;

                        var loadPostIds = []
                        loadPostIds.push(profileuser._id)
                        loadPostIds = "[\"" + loadPostIds.join("\",\"") + "\"]";
                        $scope.infinitePosts = new InfinitePosts(user_obj, loadPostIds);
                        $scope.infinitePosts.getEarlyPosts();

			            if ( $scope.profileuser.friends.length !== 0) {
                            var params = '{"_id": {"$in":["'+($scope.profileuser.friends).join('", "') + '"'+']}}'
                            Restangular.all('people').getList({
                                where:params,
                                seed:Math.random()
                            }).then(function(friends) {
                                $scope.friends = friends;
                            });
			            }

                        if($scope.currentuser._id !== $scope.profileuser._id){
                            var friendsactivity = new friendsActivity($scope.currentuser, $scope.profileuser)
                            console.log(friendsactivity)
                            $scope.check_relation = function(){
                                $scope.relation = friendsactivity.getRelation();
                                return $scope.relation;
                            }
                        }
                    });
                });
           });
	});
