'use strict';
/**
 * @ngdoc function
 * @name weberApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.controller('MainCtrl', function($scope, $auth, $rootScope, $socket, Restangular, InfinitePosts,
	                                $alert, $http, CurrentUser,sortIListService,
	                                UserService, fileUpload, MatchButtonService, $upload) {

		$scope.UserService = UserService;
        $scope.MatchButtonService = MatchButtonService;
        $scope.sortIListService = sortIListService;

		$http.get('/api/me', {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': $auth.getToken()
			}
		}).success(function(user_id) {
			Restangular.one('people',JSON.parse(user_id)).get({seed:Math.random()}).then(function(user) {

                $scope.user = user;
				var loadPostIds = angular.copy(user.friends)
                loadPostIds.push(user._id)
                loadPostIds = "[\"" + loadPostIds.join("\",\"") + "\"]";

                $scope.infinitePosts = new InfinitePosts(user, loadPostIds);
                $scope.infinitePosts.getEarlyPosts();

                /*if (user.friends.length !== 0) {

				    var params = '{"_id": {"$in":["'+($scope.user.friends).join('", "') + '"'+']}}';

					Restangular.all('people').getList({where :params}).then(function(friend) {
						$scope.friends = friend;
					});
				}*/

				$scope.submit_post = function(){
                     if($scope.new_post) {
                        $http({
                            url: '/api/similarwords',
                            method: "GET",
                            params: {querystring: $scope.new_post}
                        })
                            .success(function (similarwords) {

                                $scope.infinitePosts.addPost($scope.new_post, similarwords, $rootScope.server_file_path);
                                $scope.new_post = '';
                            });

                    }else{
                        return false;
                    }
				};
                $socket.on('postNotifications', function(data){

                    if(data.data.postnotific){
                        if(user.friends.indexOf(data.author) == -1){
                            console.log('no a friend')
                        }else if(user.friends.indexOf(data.author != -1) && data.postid != 'undefined'){
                            $scope.infinitePosts.loadNotificPost(data.postid, data.author)
                        }else{
                            //console.log('nothing to do')
                        }
                    }
                });

                $scope.pushToPost = function(postauthor, postid){
                    console.log('match user id', user._id)
                    var index = null;
                    var posts = $scope.infinitePosts.posts;
				    for(var temp in posts){
				        if(posts[temp]._id == postid){
                            index = temp;
				            postauthor = posts[temp].author;
				            postid = posts[temp]._id;

				            var iPeople = posts[temp].interestedPeople;
				            for(var i in iPeople){
				                if(iPeople[i].interested_person == user._id){
				                    return true;
				                }
                            }
                            iPeople.push({'interested_person': user._id, 'match_date': new Date()});
                            //console.log('post author-->', postauthor)
                            MatchButtonService.match(postauthor, postid , user._id).then(function(data){
                                console.log('match agree succesfully-->', data);
                            });

                        }
                    }
	            }

				$scope.deleteFromPost = function(postauthor, postid){

				    console.log('unmatch user id', user._id)
                    var posts = $scope.infinitePosts.posts;

				    for(var temp in posts){
				        // if post contains with post id
				        if(posts[temp]._id == postid){
				            var iPeople = posts[temp].interestedPeople;
				            for(var i in iPeople){
				                if(iPeople[i].interested_person == user._id){
				                   iPeople.splice(i,1);
				                   MatchButtonService.unmatch(postauthor, postid, user._id).then(function(data){
                                        console.log('unmatch disagree succesfully-->', data);
                                   });
				                }
                            }

                        }
                    }
				}


			});
		});
	})

	.directive('confirmdelete', function ($compile, CurrentUser, Restangular, $routeParams, friendsActivity) {
        return {
            restrict: 'E',
            replace: true,
            link: function (scope, element, attrs) {},
            controller:function($scope, $http, $route, $element, $attrs, $transclude){

                function checkdeletepost(post_id){
                    var status = false;
                    var post = null;

                    for(var k in $scope.infinitePosts.posts){
                        if($scope.infinitePosts.posts[k]._id == post_id &&
                            $scope.infinitePosts.posts[k].author == $scope.user._id){
                                status = true;
                                post =  $scope.infinitePosts.posts[k];
                            }

                    }
                    return ({status:status, post:post});
                }

                $scope.deletediv = function(get_post_id){
                    var html ='<a class="pull-right" ng-click="confirm_delete(\''+get_post_id+'\')" style="cursor:pointer;font-size:12px">Confirm Delete?</a>';
                    $element.html(html);
                    $compile($element.contents())($scope);


                }

                $scope.confirm_delete = function(get_post_id){
                    var result = checkdeletepost(get_post_id);

                    if(result.status){
                        $scope.infinitePosts.deletePost(result.post)
                    }
                    else{
                        //console.log(" failed in check post id with author")
                    }
                }
            }
        }
    })
    /*.directive('match', function ($compile, CurrentUser, Restangular, $routeParams, Friends, friendsActivity,$route) {
    return {
        restrict: 'E',
        replace: true,
        link: function ($scope, element, attrs) {},
        controller:function($scope, $element, $attrs, $transclude){

        $scope.friendunfriend = function(id){

                var html = '<image src="/static/app/images/pleasewait.gif" alt="no image found" style="position:absolute">';
                $element.html(html);
                $compile($element.contents())($scope);

                var data = Friends.unFreind($scope.currentuser._id, $scope.profileuser._id);
                console.log('data----------->', data)
                data.then(function(data){
                    console.log('data123--------->', data)
                    if(data.data){
                         html ='<cancelrequest><button ng-click="frndaddrequest(\''+id+'\')" class="btn btn-primary">AddFriend</button></cancelrequest>';
                         e =$compile(html)($scope);
                         $element.replaceWith(e);
                         $route.reload();
                    }else{
                         html ='<b>unable to process</b>';
                         e =$compile(html)($scope);
                         $element.replaceWith(e);
                         $route.reload();
                    }
                });
               }
            }
    };
});*/
    /*.directive('matchdirective', function ($compile, CurrentUser, Restangular,
     $routeParams,MatchButton, friendsActivity) {
        return {
            restrict: 'A',
            replace: true,
            link: function (scope, element, attrs) {},
            controller:function($scope, $http, $route, $element, $attrs, $transclude){
                $scope.matchbuttonbusy = false;

                $scope.match = function(postid, authorid, cuserid){
                    if(!($scope.matchbuttonbusy)){
                       $scope.matchbuttonbusy = true;
                       for(var k in $scope.infinitePosts.posts){
                            if($scope.infinitePosts.posts[k].author === authorid &&
                               $scope.infinitePosts.posts[k]._id === postid){
                               $scope.matchbutton = new MatchButton(user, authorid, postid);
                               //console.log('credentials==>', $scope.user, authorid, postid)
                               $scope.matchbutton.addToInterested().then(function(){
                                  $scope.matchbuttonbusy = false;
                               })
                               
                            }
                        }
                    }
				}

				$scope.MatchDisAgreeDirective = function(postid, authorid, user ){
                    if(!($scope.matchbuttonbusy)){
                        $scope.matchbuttonbusy = true;
                        $scope.matchbutton = new MatchButton(user, authorid, postid)
                        $scope.matchbutton.DeleteFromInterested()
                        .then(function(){
                            $scope.matchbuttonbusy = false;
                        })
                    }
				}

				$scope.pushToPost = function(postauthor, postid, user){
                    console.log('push user id', user._id)
				    for(var temp in $scope.infinitePosts.posts){
				        if($scope.infinitePosts.posts[temp]._id == postid){
				            if($scope.infinitePosts.posts[temp].interestedPeople.hasOwnProperty('interestedlist')){
				                $scope.infinitePosts.posts[temp].interestedPeople.interestedlist.push(user._id)
    			                console.log($scope.infinitePosts.posts[temp].interestedPeople.interestedlist)
				            }else{
				                $scope.infinitePosts.posts[temp].interestedPeople = { 'interestedlist' : [user._id] }
				                console.log($scope.infinitePosts.posts[temp].interestedPeople.interestedlist)
				            }
				        }
				    }

				}

				$scope.deleteFromPost = function(postauthor, postid, user){
                    console.log('delete user id', user._id)
				    for(var temp in $scope.infinitePosts.posts){
				        if($scope.infinitePosts.posts[temp]._id == postid){
				            console.log(user._id)
				            var ilist = $scope.infinitePosts.posts[temp].interestedPeople.interestedlist;
				            console.log(ilist)
				            if(ilist.indexOf(user._id) != -1){
				                ilist.splice(ilist.indexOf(user._id), 1)
				                console.log('deleted from list==>', ilist)
				            }
				        }
				    }
				}
            }
        }
    });*/