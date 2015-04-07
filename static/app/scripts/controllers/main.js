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
	                                UserService, fileUpload, MatchButton, MatchButtonService) {

		$scope.UserService = UserService;
        $scope.MatchButtonService = MatchButtonService;
        $scope.sortIListService = sortIListService;

        //here is the code of selecting the file for uploading an image with post
            var handleFileSelect = function(evt) {
                $rootScope.file = evt.currentTarget.files[0];
            };
            angular.element(document.querySelector('#fileInput')).on('change',handleFileSelect);

        //here is the code of the notifications array of the posts with static implementation
        $scope.MatchedPeopleOfPosts = [
            {name:'John', phone:'555-1276'},
            {name:'Mary', phone:'800-BIG-MARY'},
            {name:'Mike', phone:'555-4321'},
            {name:'Adam', phone:'555-5678'},
            {name:'Mike', phone:'555-4321'},
            {name:'Adam', phone:'555-5678'},
            {name:'Julie', phone:'555-8765'},
            {name:'Juliette', phone:'555-5678'}
        ]

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

                if (user.friends.length !== 0) {

				    var params = '{"_id": {"$in":["'+($scope.user.friends).join('", "') + '"'+']}}';

					Restangular.all('people').getList({where :params}).then(function(friend) {
						$scope.friends = friend;
					});
				}

				$scope.submit_post = function(){

                        //$rootScope.server_file_path = 'hj'
                        //console.log('file is ' + JSON.stringify($rootScope.file));
                        var uploadUrl = "/fileUpload";

                        var get_details = fileUpload.uploadFileToUrl($rootScope.file, uploadUrl)

                        get_details.then(function (response) {
                            //console.log("------getting the url for an image-----")
                            //console.log(response.data)
                            $rootScope.server_file_path = response.data;
                            //console.log("=====get server image path=====")
                            //console.log($rootScope.server_file_path)
                        })

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
    .directive('matchbuttondirective', function ($compile, CurrentUser, Restangular,
     $routeParams,MatchButton, friendsActivity) {
        return {
            restrict: 'A',
            replace: true,
            link: function (scope, element, attrs) {},
            controller:function($scope, $http, $route, $element, $attrs, $transclude){
                $scope.matchbuttonbusy = false;

                $scope.MatchAgreeDirective = function(postid, authorid  ){
                    if(!($scope.matchbuttonbusy)){
                       $scope.matchbuttonbusy = true;
                       var html = '<a ng-click="MatchDisAgreeDirective(\''+postid+'\',\''+authorid+'\');'+
                                    'UserService.deleteFromIList(\''+authorid+'\',\''+postid+'\')"'+
                                    'style="cursor:pointer" matchbuttondirective >UnMatch</a>';
                       var e =$compile(html)($scope);
                       $element.replaceWith(e);

                       for(var k in $scope.infinitePosts.posts){
                            if($scope.infinitePosts.posts[k].author === authorid &&
                               $scope.infinitePosts.posts[k]._id === postid){
                               $scope.matchbutton = new MatchButton($scope.user, authorid, postid);
                               console.log('credentials==>', $scope.user, authorid, postid)
                               $scope.matchbutton.addToInterested().then(function(){
                                  $scope.matchbuttonbusy = false;
                               })
                            }
                        }
                    }
				}

				$scope.MatchDisAgreeDirective = function(postid, authorid ){
                    if(!($scope.matchbuttonbusy)){
                        $scope.matchbuttonbusy = true;

                        var html = '<a ng-click="MatchAgreeDirective(\''+postid+'\',\''+authorid+'\');'+
                                                'UserService.PushToIList(\''+authorid+'\',\''+postid+'\')"'+
                             'style="cursor:pointer" matchbuttondirective >Match</a>';

                        var e =$compile(html)($scope);
                        $element.replaceWith(e);

                        $scope.matchbutton = new MatchButton($scope.user, authorid, postid)
                        $scope.matchbutton.DeleteFromInterested()
                        .then(function(){
                            $scope.matchbuttonbusy = false;
                        })
                    }
				}
            }
        }
    });