angular.module('weberApp')
.controller('chatbarcontroller', function($scope, $auth, CurrentUser1,$socket,UserService,
                                          $http,$rootScope,SearchActivity,
                                          $document, Restangular,ChatActivity){

    //updating the chat div height using below code please put it
    $scope.get_screen_height = window.innerHeight-52;
    $scope.get_inner_div_height = (window.innerHeight-210)/2;
     $http.get('/api/me', {
            headers: {
                'Content-Type': 'application/json'
            }
    }).success(function(userId) {

            var date = new Date();
            this.userId = userId;

            // file has been changed

            Restangular.one('people', JSON.parse(userId)).get().then(function(user) {

                $scope.chatdivnotification = [];

                $rootScope.chatactivity = new ChatActivity(user);

                $rootScope.loadLatestMessages = function(){
                    //console.log('load message')
                    $rootScope.chatactivity.loadLatestMessages();
                }
                /*if(user.conversations.length !== 0){
                    $rootScope.chatactivity.getConversations();
                 }*/

                 if(user.friends.length !== 0){
                    $rootScope.chatactivity.getChatFriends();
                 }

                //var socket = io.connect('http://127.0.0.1:8000');

                $socket.on('connect', function() {
                    $socket.emit('connect', {data: user._id});
                });


                $socket.on('join_status', function(msg) {
                    if(msg.data){
                        //console.log('successfully joined into room');
                    }
                });

                $socket.on('receive_messages', function(msg) {

                    //console.log('message received')
                    new_message = {};

                    var details = JSON.parse(sessionStorage.getItem(msg.senderid));

                    if(user._id == msg.senderid){

                    }
                    else if(user._id != msg.senderid){
                        //console.log('yes from receiver')
                        // no chat rooms opened push message into latest Notifications
                        if(sessionStorage.getItem(msg.senderid) == null){
                           // console.log('no chat div opened')
                            $rootScope.chatactivity.pushLatestMessage(msg);
                            //console.log('pushed message.........')
                             $scope.$apply(function(){
                                $rootScope.chatactivity = $rootScope.chatactivity;
                          });

                        }
                        else{
                        //console.log('yes chat room opened')
                         new_message = {
                                  sender :{
                                    name:{
                                        first:details.name
                                    },
                                    picture :{
                                        medium:details.image

                                    },
                                    _id:msg.senderid
                                  },

                                  receiver:{
                                    _id:msg.receiverid
                                  },
                                  message:msg.message
                         }

                         if(JSON.parse(sessionStorage.getItem(msg.senderid)).minimize){
                                $scope.chatdivnotification.push({ id:msg.senderid,message: true});
                         }


                          $rootScope.chatactivity.pushMessage(msg.senderid, new_message);
                          //console.log('elese message pushed')

                          //$scope.$apply(function(){
                            //$rootScope.chatactivity.messages = $rootScope.chatactivity.messages;
                          //});

                         msg = null;
                         }
                    }else{}

                });
                $scope.newMessageSeen = function(id){
                    for(k in $scope.chatdivnotification){
                        if($scope.chatdivnotification[k].id == id){
                            $scope.chatdivnotification.splice(k,1);
                        }
                    }
                }
                // sending and pushing message
                $scope.send_message = function(Recept){
                    text = this.SendMessage;
                    this.SendMessage = null;
                    if(text){
                        var pushNewMessage = {
                            sender :{
                                name:{
                                    first:user.name.first
                                },
                                picture :{
                                    medium:user.picture.medium

                                },
                                _id:user._id
                            },

                            receiver:{
                                _id:Recept
                            },

                            message:text,
                            _created: new Date()
                        }

                        $rootScope.chatactivity.pushMessage(Recept, pushNewMessage);

                        //$scope.chatactivity.messages = data;

                        $socket.emit('send_message', {receiverid: Recept, senderid :user._id  ,message: text});
                        $rootScope.chatactivity.sendMessage(Recept, text);
                    }else{
                        return false;
                    }
                }

                var getValue = function(){
                    return sessionStorage.length;
                }

                var getData = function(){
                  var json = [];

                  $.each(sessionStorage, function(i, v){
                    if(sessionStorage.hasOwnProperty(i)){
                        //console.log('attrib==>', i ,'value==>',v)
                        json.push(angular.fromJson(v));
                     }
                  });
                  return json;
                }

                 function loadintodivs(){

                    var chatrooms = getData();

                    //console.log('chat room opened previously', chatrooms)
                    for(k in  chatrooms){
                        $rootScope.chatactivity.loadMessages(user._id, chatrooms[k].id, chatrooms[k]);
                   }

                }


                 // opens new chat room
                 $scope.openchatroom = function(id){
                    if(!(sessionStorage.getItem(id))){
                        // check room alredy open

                        var json = {};
                        Restangular.one('people', id).get({seed: Math.random()})
                        .then(function(data){
                            //console.log('person deatils')
                            //console.log(data)
                            json = {
                                name:data.name.first,
                                id: data._id,
                                image:data.picture.medium,
                                minimize:false,
                                maximize:true,
                                right:0,
                                height:'364px'
                            }

                            sessionStorage.setItem(id, JSON.stringify(json));
                            $socket.emit('connect', {data:id});
                            // load messages into new open chat room
                            $rootScope.chatactivity.loadMessages(user._id, id, json);
                            //console.log($rootScope.chatactivity)
                        });

                    }
                 }


                 // closing open div
                 $scope.close_div = function(id){

                    for(k in $rootScope.chatactivity.messages){
                        if($rootScope.chatactivity.messages[k].id == id){
                            // remove get chat room
                            $rootScope.chatactivity.messages.splice(k,1);
                        }
                    }

                    for(var i in $rootScope.chatactivity.pages){
                        if($rootScope.chatactivity.pages[i].id == id){
                            $rootScope.chatactivity.pages.splice(k,1);
                        }
                    }
                    // remove from chat room
                    sessionStorage.removeItem(id);
                 }

                 $scope.MessageNotifcations = function(){
                   $rootScope.chatactivity.getMessageNotifcations();
                 }


                $scope.makeMessagesSeen = function(senderid){
                    $rootScope.chatactivity.makeMessagesSeen(senderid);

                $scope.loadOlder = function(){
                    //console.log('loading more data')

                }               }

                $scope.checknotific = function(id){
                       for(k in $scope.chatdivnotification){

                           if($scope.chatdivnotification[k].id == id && $scope.chatdivnotification[k].message == true){
                             return true;
                             }else{
                                //console.log("not equal")
                             }
                       }
                }

                $scope.addToConversations = function(id){
                        alert('haiii')
                    //if(user.conversations.indexOf(id) == -1 && user.friends.indexOf(id) == -1){
                        $scope.chatactivity.addToConversations(id);
                   // }else{
                        //console.log('alredy added')
                    //}

                }
                //display_divs();
                loadintodivs();
                $scope.MessageNotifcations();
        });
    });




})

.directive('confirmmessagetrash', function ($compile, CurrentUser, Restangular, $routeParams, friendsActivity) {
    return {
        restrict: 'E',
        replace: true,
        link: function (scope, element, attrs) {
            //console.log("=====call confirmmessagetrash======")
        },
        controller:function($scope, $http, $route, $element, $attrs, $transclude){

            $scope.confirm_trash = function(){
                var html ='<a class="pull-right" ng-click="confirm_trash()" style="color:#fff;cursor:pointer;font-size:12px">Confirm Delete?</a>';
                $element.html(html);
                $compile($element.contents())($scope);



            }

        }
    };
})
.directive('chatbar', function () {

    return {
        restrict: 'A', //This menas that it will be used as an attribute and NOT as an element. I don't like creating custom HTML elements
        replace: true,
        templateUrl: "/static/app/views/chat.html",
        controller: 'chatbarcontroller'

    }

})



.directive('matchpersonroom', function ($compile) {
    return {
        restrict: 'A',
        replace: true,
        link: function ($scope, element, attrs) {},
        controller: "chatbarcontroller"
    };
})


.directive('scroll', function($timeout) {
  return {
    restrict: 'A',
    link: function(scope, element, attr) {
        var raw = element[0];
        raw.scrollTop = 450;
        $timeout(function() {

        });
    },
     controller : function($scope, $element){


        $element.bind('scroll', function(){

            if($element[0].scrollTop == 0){
                $scope.chatactivity.nextPage($element[0].id);
            }
         });

         this.setElement = function(ele){
                $element[0].scrollTop = ($element[0].scrollTop+ele.getBoundingClientRect().top+16);


         }
     }
  }
})
.directive('scrollitem', function($timeout) {
  return {
    require : "^scroll",
    link: function(scope, element, attr, scrollCtrl) {
        scrollCtrl.setElement(element[0]);
      }
  }
})
.directive('upwardsScoll', function ($timeout) {
    return {
        link: function (scope, elem, attr, ctrl) {
            var raw = elem[0];

            elem.bind('scroll', function() {
                if(raw.scrollTop <= 0) {
                    var sh = raw.scrollHeight;
                    scope.$apply(attr.upwardsScoll);

                    $timeout(function() {
                        elem.animate({
                            scrollTop: raw.scrollHeight - sh
                        },500);
                    }, 0);
                }
            });

            //scroll to bottom
            $timeout(function() {
                scope.$apply(function () {
                    elem.scrollTop( raw.scrollHeight );
                });
            }, 500);
        }
    }
})
.controller('UpwardsScroll', function($scope, $http) {
    var counter = 1;
    var limit = 50;
    $scope.items = [];
    $scope.LoadMore = function() {
        for (var i = 0; i < limit; i++) {
            $scope.items.unshift( { text: counter } );
            counter++;
        }
    };
    $scope.LoadMore();
})
.controller('EmailCtrl', function($http, Restangular, $scope, $auth, $alert, $location, $routeParams) {

        Restangular.one('people',$routeParams.objectId).get({seed:Math.random()}).then(function(user) {
              //console.log('objectid', $routeParams.objectId)
              //console.log('user', user);
              $scope.user = user;
              if($routeParams.rand_string == $scope.user.random_string){
                //console.log('random stirng==>', $scope.user.random_string)
                if($scope.user.email_confirmed == true){
                    //console.log('iner true===>', $scope.user.email_confirmed)
                    $scope.user_email_confirmed = "your email is already activated";
                    return;
                }
                //console.log('email confirmed-->',$scope.user.email_confirmed)
                $scope.user.patch({
                        email_confirmed : true
                },{},{'If-Match': $scope.user._etag}).then(function(response){
                        //console.log('---------->', response);
                        //$location.path('/login');
                });
              }
        });
    })
    .controller('EmailDetailsCtrl', function($http, Restangular, $scope, $auth, $alert, $location, $routeParams) {

        //var element = $routeParams.userId;
        //console.log(element)

        $scope.email = $routeParams.userId;
        //console.log($scope.user);
    })
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
                            var html = '<b>password link has been sent to your email</b><br><p>Please check your email</p>';
                            var e =$compile(html)($scope);
                            $element.replaceWith(e);
                        }).
                        error(function(error) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            var html = '<b>your email does not exist, Please check it once..</b>';
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

                    $scope.new_password = $http.post('/get_new_hash_password', {
                            user_name:$routeParams.user_name,
                            new_password:$scope.formData.password
                        })
                        .success(function(data, status, headers, config) {
                            //console.log("========hashed password======");
                            //console.log(data);
                            $scope.hashed_password = data;

                            var Update_Password = Restangular.one('people', $routeParams.user_name).get({seed:Math.random()});

                            Update_Password.then(function(response){
                                $scope.user = response;

                                //console.log("=====user details===");
                                //console.log($scope.user);

                                $scope.user.patch({
                                    'password':{
                                        'password':$scope.hashed_password,
                                        'password_test':$scope.formData.password,
                                        'password_updated':new Date()
                                    }
                                }).then(function(response){
                                    // this callback will be called asynchronously
                                    // when the response is available

                                    //console.log("===after patch=====");
                                    //console.log(response);
                                    var html = '<b>your password has been changed</b>';
                                    var e =$compile(html)($scope);
                                    $element.replaceWith(e);

                                });
                            });
                        }).
                        error(function(error) {
                            // called asynchronously if an error occurs
                            // or server returns response with an error status.
                            var html = '<b>your email does not exist, Please check it once..</b>';
                            var e =$compile(html)($scope);
                            $element.replaceWith(e);
                    });






                }
            }
        };
    })
     .controller('FriendsCtrl', function($scope, $auth, Restangular, InfinitePosts, $alert, $http, CurrentUser, UserService) {
		$scope.UserService = UserService;
		$http.get('/api/me', {
			headers: {
				'Content-Type': 'application/json'
			}
		}).success(function(user_id) {
			Restangular.one('people',JSON.parse(user_id)).get().then(function(user) {
				$scope.user = user;
				$scope.infinitePosts = new InfinitePosts(user);

                if (user.friends.length !== 0) {

				    var params = '{"_id": {"$in":["'+($scope.user.friends).join('", "') + '"'+']}}';

					Restangular.all('people').getList({where :params}).then(function(friend) {
					   // console.log('===friends====')
					   // console.log(friend)
						$scope.friends = friend;
					});
				}
			});
		});

		$scope.filterFunction = function(element) {
            return element.name.match(/^$scope.searchFriend/) ? true : false;
        };
	})
	 .controller('indexCtrl', function($auth,$rootScope,$scope) {

        $rootScope.isAuthenticated = function() {
            return $auth.isAuthenticated();
        };

        $rootScope.isloggin = $auth.isAuthenticated();

})
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
				    $location.path('/home');
				}
				//$location.path('/home');
			}, function(error) {
				$scope.error = error.data.error;
			});
		};
	})

.controller('MainCtrl', function($scope, $auth, $rootScope, $socket, Restangular, InfinitePosts,
	                                $alert, $http, CurrentUser,sortIListService,
	                                UserService, fileUpload, MatchButtonService) {

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
				var loadPostIds = angular.copy(user.friends);
                loadPostIds.push(user._id);
                loadPostIds = "[\"" + loadPostIds.join("\",\"") + "\"]";

                $scope.infinitePosts = new InfinitePosts(user, loadPostIds);
                $scope.infinitePosts.getEarlyPosts();

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
                            //console.log('no a friend')
                        }else if(user.friends.indexOf(data.author != -1) && data.postid != 'undefined'){
                            $scope.infinitePosts.loadNotificPost(data.postid, data.author);
                        }else{
                            //console.log('nothing to do')
                        }
                    }
                });

                $scope.pushToPost = function(postauthor, postid){
                    //console.log('match user id', user._id)
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
                                //console.log('match agree succesfully-->', data);
                            });

                        }
                    }
	            }

				$scope.deleteFromPost = function(postauthor, postid){

				    //console.log('unmatch user id', user._id)
                    var posts = $scope.infinitePosts.posts;

				    for(var temp in posts){
				        // if post contains with post id
				        if(posts[temp]._id == postid){
				            var iPeople = posts[temp].interestedPeople;
				            for(var i in iPeople){
				                if(iPeople[i].interested_person == user._id){
				                   iPeople.splice(i,1);
				                   MatchButtonService.unmatch(postauthor, postid, user._id).then(function(data){
                                        //console.log('unmatch disagree succesfully-->', data);
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
                        $scope.infinitePosts.deletePost(result.post);
                    }

                }
            }
        }
    })

    .directive('navbardirective', function () {
    return {
        restrict: 'A', //This menas that it will be used as an attribute and NOT as an element. I don't like creating custom HTML elements
        replace: true,
        scope:true,
        templateUrl: "/static/app/views/navbar.html",
        controller: "navbarcontroller"
  }
})
    .controller('navbarcontroller',function($scope, $auth, CurrentUser, $alert,$rootScope,$timeout,                                            InstanceSearchHistory, PostService, Friends,
                                            $location, $http, Restangular,ChatActivity,
                                            $window,UserService,
                                            CurrentUser1,SearchActivity, friendsActivity,$socket) {

    /* testing of auto complete code for search results in weber*/
        $scope.notifications_count = 0;

        $scope.instanceSearchHistory = {};

        $scope.PostService = PostService;
        $scope.UserService = UserService;

        $scope.doSomething = function(typedthings){
            if(typedthings){
                $scope.movies = [];
                var data = InstanceSearchHistory.get(typedthings);
                if (typeof data.then !== 'undefined') {
                    data.then(function(data){
                    //console.log('if part')
                    $scope.movies = data.data;
                    InstanceSearchHistory.pushToHistory(data.data, typedthings);
                    });
                }else{
                    $scope.movies = data;
                }
            }
        }

        $scope.doSomethingElse = function(suggestion){
            //console.log("Suggestion selected: ", suggestion._id);
            $location.path('profile/'+suggestion._id.$oid);
        }


    /* end of auto complete code and remember factory of this code is there at the bottom of the page*/
    $scope.selectedAddress = '';
      $scope.getAddress = function(viewValue) {
        var params = {address: viewValue, sensor: false};
        return $http.get('http://maps.googleapis.com/maps/api/geocode/json', {params: params})
        .then(function(res) {
          return res.data.results;
        });
      };

    /*$scope.instancesearch = new InstanceSearch();

    $scope.testingsearch = function(){
       $scope.instancesearch.getInstancePeoples(this.InstanceSearchQuery);
    }*/

    $scope.UserService = UserService;

    $scope.dropdown = [{
        "text": "Settings",
        "href": "#/settings"
    },{
        "text": "Logout",
        "click": "logout()"
    }];

    $scope.logout = function() {
    //CurrentUser.reset();
        $rootScope.isloggin = false;
        $window.sessionStorage.clear();
        $auth.logout();
        $location.path("/search");
    };

    $scope.isAuthenticated = function() {
        return $auth.isAuthenticated();
    };

    $http.get('/api/me', {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': $auth.getToken()
        }
    }).success(function(user_id) {

        Restangular.one('people',JSON.parse(user_id)).get({seed: Math.random()}).then(function(user) {

            //$scope.testing = 'ddddddddddd';
            $scope.currentUser = user;

            $socket.emit('connecting', {id:user._id});

            $socket.on('joiningstatus', function(data) {
                //console.log(data)
            });

        $scope.searchActivity = new SearchActivity($scope.currentUser);

        $scope.loadSearchHistory = function(){
            $scope.searchActivity.getMysearches();
        }

        function get_friend_notifications(user){

            for(var k in user.notifications){
                //console.log(user.notifications[k])
                //console.log(user.notifications[k].seen,'-->', user._id)
                if(user.notifications[k].seen == false){
                    $scope.notifications_count += 1;
                    //console.log('count of notfication', $scope.notifications_count)
                }
                //return true;
            }
        }




        $socket.on('FMnotific', function(data){
            if(data.data.FMnotific){
                $http.get('/api/me', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': $auth.getToken()
                    }
                }).success(function(user_id) {
                    Restangular.one('people',JSON.parse(user_id)).get({seed: Math.random()})
                    .then(function(user) {
                            $scope.currentUser = user;
                            //console.log('got notifications to this user', user.name.first)
                            get_friend_notifications(user);
                    });
                });
            }
        });


        get_friend_notifications(user);

        $scope.makeSeen = function(){
             //console.log('--------called make seen-------------')
             if($scope.notifications_count){
                $scope.notifications_count = 0;
                for(var k in $scope.currentUser.notifications){
                    if($scope.currentUser.notifications[k].seen == false){
                        $scope.currentUser.notifications[k].seen = true;
                    }

                    Friends.makeSeen($scope.currentUser._id).then(function(data){
                        //console.log('make seen data==>', data);
                        return true;
                    });
                   //return true;
                }
             }
        }

        $scope.openchatroom = function(id){
            if(!(sessionStorage.getItem(id))){
                var json = {};
                Restangular.one('people', id).get({seed: Math.random()})
                .then(function(data){
                    json = {
                        name:data.name.first,
                        id: data._id,
                        image:data.picture.medium,
                        minimize:false,
                        maximize:true,
                        right:0,
                        height:'364px'
                    }

                    sessionStorage.setItem(id, JSON.stringify(json));
                    $socket.emit('connect', {data:id});
                    $rootScope.chatactivity.loadMessages(user._id, id, json);

                });
            }
        }

    });
});
})
.directive('getuserdata', function () {
    return {
        controller:function($scope, CurrentUser1,$http,Restangular,$auth){
            $http.get('/api/me', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': $auth.getToken()
                }
            }).success(function(user_id) {
                Restangular.one('people',JSON.parse(user_id)).get({seed: Math.random()}).then(function(user) {
                    $scope.currentUser = user;
                });
            });
        }
    }
})
.controller('PostLoadController', function($http, $auth, Restangular, $scope,
	                                           $routeParams, PostService, InfinitePosts,MatchButtonService) {

	    $scope.postid = $routeParams.postid;
	    $scope.MatchButtonService = MatchButtonService;
	    $http.get('/api/me', {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': $auth.getToken()
			}
		}).success(function(user_id) {
			Restangular.one('people',JSON.parse(user_id)).get({seed:Math.random()}).then(function(user) {

                $scope.user = user;
				var loadPostIds = angular.copy(user.friends);

                if (user.friends.length !== 0) {

				    var params = '{"_id": {"$in":["'+($scope.user.friends).join('", "') + '"'+']}}';

					Restangular.all('people').getList({where :params}).then(function(friend) {
						$scope.friends = friend;
					});
				}

				$scope.infinitePosts = new InfinitePosts(user, []);
				$scope.infinitePosts.getSpecificPost($routeParams);

                $scope.confirm_delete = function(){
                    $scope.infinitePosts.deletePost($scope.infinitePosts.posts[0], user);
                }

                $scope.pushToPost = function(postauthor, postid){
                    var posts = $scope.infinitePosts.posts;

                    for(var temp in posts){
                        if(posts[temp]._id == postid){
                            var iPeople = posts[temp].interestedPeople;
                            for(var i in iPeople){
                                if(iPeople[i].interested_person == user._id){
                                    return true;
                                }
                            }
                            iPeople.push({'interested_person': user._id, 'match_date': new Date()});
                            //console.log('post author-->', postauthor)
                            //console.log('postauthor-->', postauthor)
                            //console.log('postid -->', postid)
                            //console.log('user id-->', user._id)
                            MatchButtonService.match(postauthor, postid , user._id).then(function(data){
                                console.log('match agree succesfully-->', data);
                            });

                        }
                    }
	            }

                $scope.deleteFromPost = function(postauthor, postid){

                    //console.log('unmatch user id', user._id)
                    var posts = $scope.infinitePosts.posts;

                    for(var temp in posts){
                        // if post contains with post id
                        if(posts[temp]._id == postid){
                            var iPeople = posts[temp].interestedPeople;
                            for(var i in iPeople){
                                if(iPeople[i].interested_person == user._id){
                                   iPeople.splice(i,1);
                                   MatchButtonService.unmatch(postauthor, postid, user._id).then(function(data){
                                        //console.log('unmatch disagree succesfully-->', data);
                                   });
                                }
                            }

                        }
                    }
                }


			});
		});

	})

	.controller('SettingsCtrl',
	    function($route, $location, $scope, $auth, $q, $rootScope,
	                Restangular, InfinitePosts, $alert, $http, CurrentUser, UserService) {


        $scope.searched = false;
	 	$scope.searchBusy = false;
		$scope.UserService = UserService;

		$http.get('/api/me', {
			headers: {
				'Content-Type': 'application/json',
                'Authorization':$auth.getToken()
			}
		}).success(function(user_id) {
			var passReq = Restangular.one("people", JSON.parse(user_id)).get({seed:Math.random()})
			.then(function(result) {
              $scope.user = result;
              $scope.tags = $scope.user.interests;
             });
          /*$scope.loadTags = function(query) {
                return $http.get('/tags?query=' + query);
            };*/

            $scope.tagAdded = function(tag) {
                //$scope.tags.push(tag)
            };

            $scope.tagRemoved = function(tag) {
                //console.log('Tag removed: ', tag);
               // console.log($scope.tags)
            };

            $scope.size='small';
            $scope.type='circle';
            $scope.imageDataURI='';
            $scope.resImageDataURI='';
            $scope.resImgFormat='image/png';
            $scope.resImgQuality=1;
            $scope.selMinSize=100;
            $scope.resImgSize=200;


            var handleFileSelect=function(evt) {
              var file=evt.currentTarget.files[0];
              //console.log(file);
              var reader = new FileReader();
              reader.onload = function (evt) {
                $scope.$apply(function($scope){
                  $scope.imageDataURI=evt.target.result;
                });
              };
              reader.readAsDataURL(file);
            };
            angular.element(document.querySelector('#fileInput')).on('change',handleFileSelect);
            $scope.$watch('resImageDataURI',function(){
                //console.log('Res image', $scope.resImageDataURI);
                //console.log("its just testing the encoding base64")


            });

            $scope.uploadFile = function(){

                var Get_upload_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                    Get_upload_details.then(function(response){
                    $scope.user = response;

                    $scope.user.picture.large = $scope.imageDataURI;
                    $scope.user.picture.medium = $scope.resImageDataURI;
                    $scope.user.picture.thumbnail = $scope.resImageDataURI;
                    $scope.user.patch({
                        'picture':{
                            'large':$scope.imageDataURI,
                            'medium':$scope.resImageDataURI,
                            'thumbnail':$scope.resImageDataURI
                        }
                    }).then(function(response){
                        $route.reload();
                    });
                });
            }

            $scope.updateUsername = function() {
                    var Get_User_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                    Get_User_details.then(function(response){
                    $scope.user = response;
                    $scope.user.username = $scope.u_username;
                    //console.log("-------checking user object------")
                    //console.log($scope.user)
                    //console.log("=========before patch========")
                    //console.log($scope.user.username)

                    $scope.user.patch({

                        'username':$scope.u_username

                    }).then(function(response){

                        //console.log("=====after patch========")
                       // console.log(response)
                    });
                });
			};

			$scope.updateFirstLastName = function() {

			    var Get_first_last_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                    Get_first_last_details.then(function(response){
                    $scope.user = response;
                    $scope.user.name.first = $scope.edit_first_name;
                    $scope.user.name.last = $scope.edit_last_name;
                    //console.log("=========before patch========")
                    $scope.user.patch({
                        'name':{
                            'first':$scope.edit_first_name,
                            'last':$scope.edit_last_name
                        }
                    }).then(function(response){

                    });
                });
			};

			$scope.updateEmail = function() {
			    var Get_first_last_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                    Get_first_last_details.then(function(response){
                    $scope.user = response;
                    $scope.user.username = $scope.u_username;

                    $scope.user.patch({
                        'email':$scope.u_email
                    }).then(function(response){


                    });
                });
			};

			$scope.checkUserCurrentPassword = function(){

			    $http.post('/check_user_current_password',
                    {
                        user_name:$scope.user.username,
                        old_password:$scope.formData.cPassword
                    })
                    .success(function(data, status, headers, config) {
                        $scope.if_user_password_is_incorrect = false;
                    })
                    .error(function(error, status, headers, config) {
                        $scope.if_user_password_is_incorrect = error.error;
                    });
			}


			$scope.updatePassword = function() {



			    $http.post('/get_new_hash_password',{
                    user_name:$scope.user.username,
                    new_password:$scope.formData.password
                })
                .success(function(data, status, headers, config) {


                    $scope.get_hash_new_password = data;



                    var updating_user_password = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                    updating_user_password.then(function(response){


                        $scope.user_updated_data = response;
                        $scope.user.password.password_updated = new Date();
                        $scope.user_updated_data.patch({
                            'password':{
                                'password':$scope.get_hash_new_password,
                                'password_test':$scope.formData.password,
                                'password_updated':new Date()
                            }
                        });

                    });
                })

			};



			$scope.updateInterests = function() {

			    var Get_interests_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                    Get_interests_details.then(function(response){
                    $scope.user = response;

                    var interests = [];
                    var querystring = "";

                    for(var temp in $scope.tags){

                        interests.push($scope.tags[temp].text.toString());
                        querystring = querystring+$scope.tags[temp].text+" ";
                    }

                    $scope.user.interests = interests;


                });
			};

			$scope.updatechangelocation = function() {

			    var Get_location_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                    Get_location_details.then(function(response){
                    $scope.user = response;
                    $scope.user.location.state = $scope.location_state;
                    $scope.user.location.city = $scope.location_city;
                    $scope.user.location.street = $scope.location_street;
                    $scope.user.patch({
                        'location':{
                            'state':$scope.location_state,
                            'city':$scope.location_city,
                            'street':$scope.location_street
                        }
                    });
                });
			};

			$scope.updatechangestudy = function() {

			    var Get_study_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                    Get_study_details.then(function(response){
                    $scope.user = response;
                    $scope.user.study.intermediate = $scope.study_intermediate;
                    $scope.user.study.graduate = $scope.study_graduate;
                    $scope.user.patch({
                        'study':{
                            'intermediate':$scope.study_intermediate,
                            'graduate':$scope.study_graduate
                        }
                    });
                });
			};

			$scope.updatechangephone = function() {

			    var Get_phone_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                    Get_phone_details.then(function(response){
                    $scope.user = response;
                    $scope.user.phone = $scope.phone_number;
                    $scope.user.patch({
                        'phone':$scope.phone_number
                    });
                });
			};

            $scope.updatechangemovies = function() {

			    var Get_interests_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                    Get_interests_details.then(function(response){
                    $scope.user = response;
                    var data = ($scope.movies.toString()).split(",");

                    for(var k in data){
                        $scope.user.movies.push(data[k]);
                    }

                    $scope.user.movies = $scope.user.movies;

                    $scope.user.patch({
                        'movies':$scope.user.movies
                    });
                });
			};
        });
	})
	.controller('SignupCtrl', function($scope, $http, $auth, $location, $alert) {
		$scope.searched = false;
	 	$scope.searchBusy = false;


	 	$scope.tags = [];



        $scope.loadTags = function(query) {
        //return $http.get('/tags?query=' + query);
        };

        $scope.tagAdded = function(tag) {
            //console.log('Tag added: ', tag.text);
            //$scope.tags.push(tag)
            //alert(tag.text)
        };

        $scope.tagRemoved = function(tag) {
           // console.log('Tag removed: ', tag);
            //console.log($scope.tags)
        };

        /* starting code of signup goes here */

            $scope.registerUser = function() {
                if (this.formData.gender) {

                var self = this;
                var interests = [];
                var querystring = "";
                for(var temp in $scope.tags){
                    interests.push($scope.tags[temp].text.toString());
                    querystring = querystring+$scope.tags[temp].text+" ";
                }
                $http.get('/api/similarwords',
                    {
                        headers:{'Content-Type':'application/json'},
                        params : {querystring: querystring.toString() }
                    }).success(function(interestsSimilarWords) {
                        //console.log('successdata', interestsSimilarWords)
                        var data = ['d','i','dd'];
                        $scope.signup_Busy = $auth.signup({
                            email: $scope.formData.email,
                            password: $scope.formData.password,
                            firstname: $scope.formData.firstname,
                            lastname: $scope.formData.lastname,
                            username: $scope.formData.firstname+$scope.formData.lastname,
                            gender: self.formData.gender,
                            interests: interests,
                            interestsimilarwords: interestsSimilarWords
                        }).then(function (response) {

                            $location.path('/email_details/' + self.formData.email);
                        }, function (signuperror) {
                            $scope.signUpError = signuperror;
                        });
                    });
            }else{
                    $scope.gendererror = true;
                }
            };

        /* ending of signup code */
	}).directive('validPasswordC', function () {
		return {
			require: 'ngModel',
			link: function (scope, elm, attrs, ctrl) {
				ctrl.$parsers.unshift(function (viewValue, $scope) {
					var noMatch = viewValue != scope.myForm.password.$viewValue;
					ctrl.$setValidity('noMatch', !noMatch);
				})
			}
		}
	})
	.directive('replacesignup', function ($compile) {
		return {
			restrict: 'E',
			replace: true,
			link: function (scope, element, attrs) {
				element.click(function(){
				   var html ='<image src="/static/app/images/pleasewait.gif" style="width:;">';
				   var e =$compile(html)(scope);
				   element.replaceWith(e);
				});
			}
		};
	})
	.controller('UserprofileCtrl', function($scope, $routeParams,$templateCache,sortIListService,
	                                        Restangular, InfinitePosts, UserService,MatchButtonService,
	                                        CurrentUser , friendsActivity) {

		$scope.UserService = UserService;
		$scope.MatchButtonService = MatchButtonService;
		$scope.sortIListService = sortIListService;
        var currentuserobj = new CurrentUser();
         currentuserobj.getUserId()
            .then(function(){
                currentuserobj.getCUserDetails(currentuserobj.userId).then(function(user){

                    var user_obj = Restangular.one('people', $routeParams.username);
		            user_obj.get({ seed : Math.random() }).then(function(profileuser) {
		                $scope.profileuser = profileuser;
                        $scope.user = user;

                        var loadPostIds = [];
                        loadPostIds.push(profileuser._id);
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

                        if($scope.user._id !== $scope.profileuser._id){
                            var friendsactivity = new friendsActivity($scope.user, $scope.profileuser);
                            //console.log(friendsactivity)
                            $scope.check_relation = function(){
                                $scope.relation = friendsactivity.getRelation();
                                return $scope.relation;
                            }
                        }

                        $scope.pushToPost = function(postauthor, postid){
                            //console.log('match user id', user._id)
                            var posts = $scope.infinitePosts.posts;
                            for(var temp in posts){
                                if(posts[temp]._id == postid){
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

                            //console.log('unmatch user id', user._id)
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
           });
	})
	 .controller('WeberSearchCtrl', function($scope, $auth, Restangular,$route,$window,
	 										InfinitePosts, $alert, $http,$location,$socket,
	 										CurrentUser, UserService,CurrentUser1,$rootScope,
	 										SearchActivity, $routeParams, MatchMeResults) {
	 	$scope.searched = false;
	 	$scope.searchBusy = false;


	 	$scope.tags = [];

        //for(var i=0; i<$scope.tags.length; i++){
            //console.log($scope.tags[i])
        //}

        $scope.loadTags = function(query) {
        //return $http.get('/tags?query=' + query);
        };

        $scope.tagAdded = function(tag) {
            //console.log('Tag added: ', tag.text);
            //$scope.tags.push(tag)
            //alert(tag.text)
        };

        $scope.tagRemoved = function(tag) {
            //console.log('Tag removed: ', tag);
            //console.log($scope.tags)
        };


	 	/* login functionality code goes here*/
        $scope.submitLogin = function() {
			$auth.login({
				email: this.login_email,
				password: this.login_password
			}).then(function(response) {
				$auth.setToken(response.data.token);
				$rootScope.isloggin = true;
				$window.location.reload();


				//$location.path('/search');
				//$route.reload();
			}, function(error) {
                //console.log(error.data.error)
				$scope.loginError = error;
				$alert({
					title: 'Login Failed:',
					content: error.data.error,
					placement: 'top',
					type: 'danger',
					show: true
				});
			});
		};

        /* end of login functionality*/

        /* starting code of signup goes here */

            $scope.registerUser = function() {
                if (this.formData.gender) {

                var self = this;
                var interests = [];
                var querystring = "";

                for(var temp in $scope.tags){
                    interests.push($scope.tags[temp].text.toString());
                    querystring = querystring+$scope.tags[temp].text+" ";
                }

                interests_array = ["cricket","backetball","123", "abc"]
                //console.log('successdata', interestsSimilarWords)
                var data = ['d','i','dd'];
                $scope.signupBusy = $auth.signup({
                    email: self.formData.email,
                    password: self.formData.password,
                    firstname: self.formData.firstname,
                    lastname: self.formData.lastname,
                    username: self.formData.firstname + self.formData.lastname,
                    gender: self.formData.gender,
                    data : interests

                }).then(function (response) {
                    //console.log('response data', response.data);
                    $location.path('/email_details/' + self.formData.email);
                }, function (signuperror) {
                    $scope.signUpError = signuperror;
                    $alert({
                        title: 'Registration Failed:',
                        content: signuperror.data.error,
                        placement: 'top',
                        type: 'danger',
                        show: true
                    });
                });

            }else{
                    $scope.gendererror = true;
                }
            };

        /* ending of signup code */

        $http.get('/api/me', {
            headers: {
                'Content-Type': 'application/json'
            }
        }).success(function(userId) {
            Restangular.one('people', JSON.parse(userId)).get().then(function(user) {
            $scope.openchatroom = function(id){
                    //console.log('open chat room', id)
                $rootScope.chatactivity.addToConversations(id);
                if(!(sessionStorage.getItem(id))){
                    var json = {};
                    Restangular.one('people', id).get({seed: Math.random()})
                    .then(function(data){
                        json = {
                            name:data.name.first,
                            id: data._id,
                            image:data.picture.medium,
                            minimize:false,
                            maximize:true,
                            right:0,
                            height:'364px'
                        }

                        sessionStorage.setItem(id, JSON.stringify(json));
                        $socket.emit('connect', {data:id});
                        // load messages into new open chat room

                        $rootScope.chatactivity.loadMessages(user._id, id, json);

                    });

                }
            }

        });
        });


        function combine_ids(ids) {
   				return (ids.length ? "\"" + ids.join("\",\"") + "\"" : "");
		}

        if($routeParams.query){
            $scope.query = $routeParams.query;
            $scope.matchResults = new MatchMeResults($routeParams.query);
            $scope.matchResults.newSearchResults();
            store_search_text($routeParams.query);
            $scope.searched=true;
        }
        function store_search_text(searchText){
            if(!($scope.user) && searchText){
                //console.log('no user and yes search text')
                $scope.currentuserobj = new CurrentUser();
                $scope.currentuserobj.getUserId()
                .then(function(){
                    if($scope.currentuserobj.userId != 'undefined'){
                        $scope.currentuserobj.getCUserDetails($scope.currentuserobj.userId)
                        .then(function(user){
                           $scope.user = user;
                           $scope.searchActivity = new SearchActivity(user);
                           var res = $scope.searchActivity.getSimilarWords(searchText);
                           res.then(function(data){
                                $scope.searchActivity.addSearchText(searchText, data.data);
                           });
                        });
                    };
                });
            }else if(($scope.user) && searchText){
                //console.log('yes user and search text')
                $scope.searchActivity = new SearchActivity($scope.user);

                var res = $scope.searchActivity.getSimilarWords(searchText);
                res.then(function(data){
                    //console.log(data.data)
                    $scope.searchActivity.addSearchText(searchText, data.data);
                })

                //
            }else{
                //console.log('nothing to do');
            }
        }

		$scope.UserService = UserService;
        $scope.CurrentUser = CurrentUser1;
        $rootScope.loggeduser = CurrentUser1;

        $scope.isAuthenticated = function() {
            return $auth.isAuthenticated();
        };

        $scope.logout = function() {
            $auth.logout();
            $location.path("/search");
        };

        $scope.showNoResults = false;

        $scope.perfomSearch = function(){

            $scope.searched = true;

            if($scope.query && ($routeParams.query == $scope.query)){
                //$scope.matchResults = new MatchMeResults($scope.query);
            }else if($scope.query){

                $location.search('query', $scope.query);
                $scope.matchResults = new MatchMeResults($scope.query);
                $scope.matchResults.newSearchResults();

                store_search_text($scope.query);
            }
            else{}
         }

        $scope.getSuggestedPeople = function(){
            $scope.matchResults = new MatchMeResults($scope.query);
            $scope.matchResults.getSuggestedPeople();
        }

           $scope.openchatroom = function(id){
                    //console.log('open chat room')
                    if(!(sessionStorage.getItem(id))){
                        // check room alredy open

                        var json = {};
                        Restangular.one('people', id).get({seed: Math.random()})
                        .then(function(data){
                            //console.log('person deatils')
                            //console.log(data)
                            json = {
                                name:data.name.first,
                                id: data._id,
                                image:data.picture.medium,
                                minimize:false,
                                maximize:true,
                                right:0,
                                height:'364px'
                            }

                            sessionStorage.setItem(id, JSON.stringify(json));
                            //socket.emit('connect', {data:id});
                            // load messages into new open chat room
                            $rootScope.chatactivity.loadMessages(user._id, id, json);

                        });

                    }
                 }

 	})



    .directive('seefulltextdirective', function ($compile, CurrentUser, Restangular, $routeParams, friendsActivity) {
        return {
            restrict: 'E',
            replace: true,
            link: function (scope, element, attrs) {
                //console.log("=====call seefulltextdirective======")
            },
            controller:function($scope, $http, $route, $element, $attrs, $transclude){

                $scope.hide_text = function(){
                    var html ='<p></p>';
                    $element.html(html);
                    $compile($element.contents())($scope);
                }
            }
        };
    })
    .directive('focus',function($timeout) {
        return {
            scope : {
                trigger : '@focus'
            },
            link : function(scope, element) {
                scope.$watch('trigger', function(value) {
                    if (value === "true") {
                        $timeout(function() {
                            element[0].focus();
                        });
                    }
                });
            }
        };
     })
