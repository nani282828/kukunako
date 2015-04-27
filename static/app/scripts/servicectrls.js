'use strict';
/**
 * @ngdoc function
 * @name weberApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.controller('MainCtrl', function($scope, $auth, $rootScope, $socket, Restangular, InfinitePosts,questions,
	                                $alert, $http, CurrentUser,sortIListService, InterestsService,
	                                UserService, fileUpload, MatchButtonService) {
		$scope.UserService = UserService;
        $scope.MatchButtonService = MatchButtonService;
        $scope.sortIListService = sortIListService;
        $scope.InterestsService = InterestsService;
        console.log("====interests service", $scope.InterestsService)
		$http.get('/api/me', {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': $auth.getToken()
			}
		}).success(function(user_id) {
		    console.log('authorize token', $auth.getToken())
			Restangular.one('people',JSON.parse(user_id)).get({seed:Math.random()},{'Authorization': $auth.getToken()}).then(function(user) {
                console.log('user==>', user)
                $scope.user = user;
                //delete the post from infinite posts of the current user
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
                $scope.confirm_delete = function(get_post_id){
                    var result = checkdeletepost(get_post_id);
                    if(result.status){
                        $scope.infinitePosts.deletePost(result.post);
                    }
                }
                // questions section functions
                $scope.questions = new questions(user);
                $scope.questions.getallquestions();


                $scope.answered = function(question, ans){
                    $scope.questions.updateAnswer(question, ans);
                    console.log(question, ans)
                }

                $scope.checkAnswer = function(question_id){
                    data = $scope.questions.checkAnswer(question_id);
                    return data;
                }
                // end of questions section
				var loadPostIds = angular.copy(user.friends);
                loadPostIds.push(user._id);
                loadPostIds = "[\"" + loadPostIds.join("\",\"") + "\"]";

                $scope.infinitePosts = new InfinitePosts(user, loadPostIds);
                $scope.infinitePosts.getEarlyPosts();

				$scope.submit_post = function(){
                     if($scope.new_post) {
                        $scope.new_submit_busy_post = $http({
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
	});
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

	});angular.module('weberApp')
    .controller('indexCtrl', function($auth,$rootScope,$scope, $window) {

        $rootScope.isAuthenticated = function() {
            return $auth.isAuthenticated();
        };
        $rootScope.isloggin = $auth.isAuthenticated();

        /* login functionality code goes here*/
        $scope.submitLogin = function() {

			$auth.login({
				email: this.login_email,
				password: this.login_password
			}).then(function(response) {
				$auth.setToken(response.data.token);
				$rootScope.isloggin = true;
				$window.location.reload();
			}, function(error) {
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
});'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:SignupCtrl
 * @description
 * # SignupCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
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
	});'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:WeberSearchCtrl
 * @description
 * # WeberSearchCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
    .controller('WeberSearchCtrl', function($scope, $q, $auth, Restangular,$route,$window,
	 										InfinitePosts, $alert, $http,$location,$socket,
	 										CurrentUser, UserService,CurrentUser1,$rootScope,
	 										SearchActivity, $routeParams, MatchMeResults) {
	 	$scope.searched = false;
	 	$scope.searchBusy = false;
	 	$scope.tags = [];
	 	$scope.interests_filter = [];
        $scope.loadTags = function(query) {
            $scope.getting_interests = [];
            var param1 = '{"interest_string":{"$regex":".*'+query+'.*"}}';
            return Restangular.all('interests').getList({
                where : param1,
                seed: Math.random(),
                max_results: 5
            })
            .then(function(data){
                for(var i=0;i<data.length;i++){
                    console.log(data[i].interest_string);
                    $scope.getting_interests.push(data[i].interest_string);
                }
                console.log("getting interests from server",$scope.getting_interests);
                console.log("getting details",$scope.getting_interests);
                var deferred = $q.defer();
                deferred.resolve($scope.getting_interests);
                return deferred.promise;
            });
        }
        $scope.tagAdded = function(tag) {
            console.log('Tag added: ', tag.text, $scope.tags);
            $scope.interests_filter.push(tag.text);
            console.log("------->>>>", $scope.interests_filter);
        };
        $scope.tagRemoved = function(tag) {
            var index = $scope.interests_filter.indexOf(tag.text);
            if(index > -1){
                $scope.interests_filter.splice(index, 1);
            }
            console.log("----->>>>>>>", $scope.interests_filter);
        };

        $scope.storequestion = function(){

            var question = $scope.enterquestion;
            $scope.enterquestion = null;
            Restangular.all('questions').post({
                'question':question
            }).then(function(data){
                console.log('questions posted',data)
            });
        }
        /* starting code of signup goes here */
            $scope.registerUser = function() {
                if (this.formData.gender) {
                var self = this;
                var data = ['d','i','dd'];
                $scope.signupBusy = $auth.signup({
                    email: self.formData.email,
                    password: self.formData.password,
                    firstname: self.formData.firstname,
                    lastname: self.formData.lastname,
                    username: self.formData.firstname + self.formData.lastname,
                    gender: self.formData.gender,
                    interests: $scope.interests_filter
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
     });
'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:SettingsCtrl
 * @description
 * # SettingsCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.controller('SettingsCtrl',
	    function($route, $location, $scope, $auth, $q, $rootScope,InterestsService,
	                Restangular, InfinitePosts, $alert, $http, CurrentUser, UserService) {


        $scope.searched = false;
	 	$scope.searchBusy = false;
		$scope.UserService = UserService;
        $scope.InterestsService = InterestsService;
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
                console.log("==inside tags", $scope.tags)

                $scope.interests_filter = [];
                console.log("=====tags", $scope.tags, "interests_filter", $scope.interests_filter);
                $scope.loadTags = function(query) {
                    $scope.getting_interests = [];
                    var param1 = '{"interest_string":{"$regex":".*'+query+'.*"}}';
                    return Restangular.all('interests').getList({
                        where : param1,
                        seed: Math.random(),
                        max_results: 5
                    })
                    .then(function(data){
                        console.log("getting length", data.length)
                        for(var i=0;i<data.length;i++){
                            console.log(data[i].interest_string);
                            $scope.getting_interests.push(data[i].interest_string);
                        }
                        console.log("getting interests from server",$scope.getting_interests);
                        console.log("getting details",$scope.getting_interests);
                        var deferred = $q.defer();
                        deferred.resolve($scope.getting_interests);
                        return deferred.promise;
                    });
                }
                $scope.tagAdded = function(tag) {
                    console.log('Tag added: ', tag.text, $scope.tags);
                    $scope.interests_filter.push(tag.text);
                    console.log("------->>>>", $scope.interests_filter);
                };
                $scope.tagRemoved = function(tag) {
                    var index = $scope.interests_filter.indexOf(tag.text);
                    if(index > -1){
                        $scope.interests_filter.splice(index, 1);
                    }
                    console.log("----->>>>>>>", $scope.interests_filter);
                };

                //uploading the profile image to crop the image with required size
                $scope.uploadPile = function(files) {
                    $scope.enableCrop = true;
                    $scope.showUploadButton = true;
                    var file=files[0];
                      console.log(file);
                      var reader = new FileReader();
                      reader.onload = function (evt) {
                        $scope.$apply(function($scope){
                          $scope.imageDataURI=evt.target.result;
                        });
                      };
                    reader.readAsDataURL(file);

                };
                $scope.size='small';
                $scope.type='square';
                $scope.imageDataURI='';
                $scope.resImageDataURI='';
                $scope.resImgFormat='image/png';
                $scope.resImgQuality=1;
                $scope.selMinSize=100;
                $scope.resImgSize=200;
                //$scope.aspectRatio=1.2;
                $scope.onChange=function($dataURI) {
                    $scope.resImageDataURI = $dataURI;
                };
                $scope.uploadFile = function(){
                    console.log("uploading the image")
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
                            //$route.reload();
                            console.log("====success", response)
                        });
                    });
                }

                $scope.updateUsername = function() {
                        var Get_User_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                        Get_User_details.then(function(response){
                        $scope.user = response;
                        $scope.user.username = $scope.u_username;
                        $scope.user.patch({
                            'username':$scope.u_username
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
                    $http.post('/get_interested_ids',
                        {
                            interests: $scope.interests_filter,
                            username: $scope.user.username
                        })
                    .success(function(data, status, headers, config) {
                            console.log("======return success of interests of ids",data.data,status)
                        }).
                    error(function(data, status, headers, config) {
                        console.log("====error of interests", data.data)
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
                        $scope.user.study.intermediate = $scope.study_school;
                        $scope.user.study.graduate = $scope.study_graduate;
                        $scope.user.patch({
                            'study':{
                                'school':$scope.study_school,
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
        });
	});angular.module('weberApp')
.controller('chatbarcontroller', function($scope, $auth, CurrentUser1,$socket,UserService,
                                          $http,$rootScope,SearchActivity,
                                          $document, Restangular,ChatActivity){

    //updating the chat div height using below code please put it

    $scope.get_screen_height = window.innerHeight-52;
    $scope.get_inner_div_height = (window.innerHeight-210)/2;
    $scope.UserService = UserService;

    $http.get('/api/me', {
            headers: {
                'Content-Type': 'application/json'
            }
    }).success(function(userId) {

            var date = new Date();
            var userId = userId;

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
                        $scope.chatactivity.addToConversations(id);
                }
                $scope.deleteConversation = function(id){
                    $scope.chatactivity.deleteConversation(id);
                     sessionStorage.removeItem(id);
                }

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
});'use strict';

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
				    $location.path('/home');
				}
				//$location.path('/home');
			}, function(error) {
				$scope.error = error.data.error;
			});
		};
	});'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:EmailCtrl
 * @description
 * # EmailCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
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
    });'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:UserprofileCtrl
 * @description
 * # UserprofileCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.controller('UserprofileCtrl', function($scope, $routeParams,$templateCache,sortIListService,questions,
	                                        Restangular, InfinitePosts, UserService,MatchButtonService,
	                                        CurrentUser , friendsActivity) {

		$scope.UserService = UserService;
		$scope.MatchButtonService = MatchButtonService;
		$scope.sortIListService = sortIListService;

		$scope.show_only_profile_pic = false;
        $scope.show_only_p_user_pic = true;
        $scope.show_c_user_info = false;
        $scope.show_p_user_info = true;

        var user_obj = Restangular.one('people', $routeParams.username);
		user_obj.get({ seed : Math.random() }).then(function(profileuser) {

		// profile user information
		$scope.profileuser = profileuser;
        $scope.tooltip = {
            "title": "<h5>"+$scope.profileuser.name.first+"&nbsp;"+
                        $scope.profileuser.name.last+"</h5>"+
                        "<h5>Lives In "+$scope.profileuser.location.state+"&nbsp;"+
                        $scope.profileuser.location.city+"</h5>"
        }

        // questions section functions
        $scope.questions = new questions(profileuser);
        //$scope.questions.getcquestions();
        $scope.questions.getUserQuestions();

        if ( $scope.profileuser.friends.length !== 0) {

            var params = '{"_id": {"$in":["'+($scope.profileuser.friends).join('", "') + '"'+']}}'
            Restangular.all('people').getList({
                where:params,
                seed:Math.random()
            }).then(function(friends) {
                $scope.friends = friends;
            });
        }

        var loadPostIds = [];
        loadPostIds.push(profileuser._id);
        loadPostIds = "[\"" + loadPostIds.join("\",\"") + "\"]";
        $scope.infinitePosts = new InfinitePosts(user_obj, loadPostIds);
        $scope.infinitePosts.getEarlyPosts();

        $scope.checkAnswer = function(question_id){
            data = $scope.questions.checkAnswer(question_id);
            return data;
        }

         $scope.answered = function(question, ans){
             $scope.questions.updateAnswer(question, ans);
             console.log(question, ans)
         }

        // end of profile user information
        var currentuserobj = new CurrentUser();
        currentuserobj.getUserId()
            .then(function(){
                currentuserobj.getCUserDetails(currentuserobj.userId).then(function(user){

                        $scope.checkYouAnswered = function(question_id){
                            data = $scope.questions.checkYouAnswered(question_id, user);
                            return data;
                        }

                        $scope.youAnswered = function(question, ans){
                            $scope.questions.updateUser2(question, ans);
                            console.log(question, ans)
                        }
                         // end of questions section
                        $scope.user = user;

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


                    //
                });
           });
	});
});'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:EmailDetailsCtrl
 * @description
 * # EmailDetailsCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.controller('EmailDetailsCtrl', function($http, Restangular, $scope, $auth, $alert, $location, $routeParams) {

        //var element = $routeParams.userId;
        //console.log(element)

        $scope.email = $routeParams.userId;
        //console.log($scope.user);
    });'use strict';

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
    });'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:FriendsCtrl
 * @description
 * # FriendsCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
  .controller('FriendsCtrl', function($scope, $auth, Restangular, InfinitePosts, $alert, $http, CurrentUser, UserService) {
		$scope.UserService = UserService;
		$http.get('/api/me', {
			headers: {
				'Content-Type': 'application/json'
			}
		}).success(function(user_id) {
			Restangular.one('people',JSON.parse(user_id)).get().then(function(user) {
				$scope.user = user;
				$scope.show_only_profile_pic = true;
                $scope.show_only_p_user_pic = false;

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
	});'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:NavbarCtrl
 * @description
 * # NavbarCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
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

        $scope.popover = {
          "title": "Title",
          "content": "Hello Popover<br />This is a multiline message!",
          "saved": true
        };


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
                            console.log('got notifications to this user', user.name.first)
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
});
angular.module('weberApp')
.factory('friendsActivity', function($http, Restangular, $alert, $timeout,CurrentUser) {

        var friendsActivity = function(currentuser, profileuser){
            //console.log(profileuser)
            this.currentuser = currentuser;
            this.profileuser = profileuser;
            this.status = null;
            this.status_method = null;

            if (typeof this.profileuser.notifications === "undefined"){
                profileuser.patch({
                    "notifications": []
                })
            }

            if(typeof this.currentuser.notifications === "undefined"){
                currentuser.patch({
                    "notifications": []
                })
            }
        }



        friendsActivity.prototype.getRelation = function(){

                if(this.status === null){
                    if(this.profileuser.friends.indexOf(this.currentuser._id) > -1){
                        this.status = 'unfriend';
                    }
                }

                if(this.status === null){
                    var k = '';
                    for (k in this.profileuser.notifications){
                        if((this.profileuser.notifications[k].friendid == (this.currentuser._id)) &&
                          (this.profileuser.notifications[k].notific_type == 1)){
                            this.status = 'cancelrequest';
                        }
                    }
                }

                if(this.status === null){
                    var k = ''
                    for (k in this.currentuser.notifications){
                        if((this.currentuser.notifications[k].friendid == (this.profileuser._id)) &&
                           (this.currentuser.notifications[k].notific_type == 1))
                        {
                            this.status = 'reject_accept';
                        }
                    }
                }

                if(this.status === null){
                    this.status = 'addfriend';
                }
            return (this.status);
        }

         return friendsActivity;
	})
	.service('Friends', function($http, Restangular) {

		this.addFriend = function(cuserid, puserid) {
		    return Restangular.one('addfriend').get({
		        cuserid : cuserid,
		        puserid : puserid,
		        seed:Math.random()
		    });
		}

		this.cancelRequest = function(cuserid, puserid){
		    return Restangular.one('cancelfriend').get({
		        cuserid : cuserid,
		        puserid : puserid,
		        seed:Math.random()
		    });

		}

		this.acceptRequest = function(cuserid, puserid){
		    return Restangular.one('acceptfriend').get({
		        cuserid : cuserid,
		        puserid : puserid,
		        seed:Math.random()
		    });

		}

		this.rejectRequest = function(cuserid, puserid){
		    return Restangular.one('rejectfriend').get({
		        cuserid : cuserid,
		        puserid : puserid,
		        seed : Math.random()
		    });
		}

		this.unFreind = function(cuserid, puserid){
		    return Restangular.one('unfriend').get({
		        cuserid : cuserid,
		        puserid : puserid,
		        seed : Math.random()
		    });
		}

		this.makeSeen = function(cuserid){
		    return Restangular.one('makeseen').get({
		        cuserid : cuserid,
		        seed : Math.random()
		    });
		}
	});'use strict';

/**
 * @ngdoc service
 * @name weberApp.weberService
 * @description
 * # weberService
 * Service in the weberApp.
 */
angular.module('weberApp')
.factory('SettingsService', function($http, Restangular, $alert, $timeout,$auth, fileUpload) {

		var SettingsService = function(fieldvalue, fieldname) {

			this.fieldname = fieldname;
			this.fieldvalue = fieldvalue;
			this.userobj = [];

			var data = $http.get('/api/me', {
				headers: {
					'Content-Type': 'application/json',
					'Authorization':$auth.getToken()
				}
			}).success(function(userId) {
				this.userId = userId;
				var promise = Restangular.one('people',JSON.parse(userId)).get().then(function(user) {
					this.userobj = user;
					//console.log(this.userobj);
				}.bind(this));
				return promise;
			}.bind(this));
			return data;
		};

		SettingsService.prototype.updatefieldvalue = function(){

		};

		return SettingsService;
	})/* ========= file upload services ========*/
	.directive('fileModel', ['$parse', function ($parse) {
		return {
			restrict: 'A',
			link: function(scope, element, attrs) {
				var model = $parse(attrs.fileModel);
				var modelSetter = model.assign;

				element.bind('change', function(){
					scope.$apply(function(){
						modelSetter(scope, element[0].files[0]);
					});
				});
			}
		};
	}])
	.service('fileUpload', ['$http', function ($http,$auth, $scope, Restangular) {
		this.uploadFileToUrl = function(file, uploadUrl){
			var fd = new FormData();
			fd.append('file', file);
			this.path_name = "";
			return $http.post(uploadUrl, fd, {
				transformRequest: angular.identity,
				headers: {'Content-Type': undefined}
			});
		}
	}]);/*====== end of file upload services ======*/angular.module('weberApp')

    .factory('ChatActivity', function($http, Restangular,$auth) {

        var ChatActivity = function(currentuser){
            this.currentuser = currentuser;
            this.chatfriends = [];
            this._etag = currentuser._etag;
            this.messages = [];
            this.messageNotifc = [];
            this.latestMessages = [];
            this.conversations = [];

            // for infinity scroll parameters
            this.pages =[];
            this.busy = false;
            this.end = false;
            this.query = null;
            this.embedded_param = null;
            this.main_params = null;
            this.updateseenmessages = [];
        }

        ChatActivity.prototype.getChatFriends = function(){
            if (this.currentuser.friends.length !== 0) {

                var params = '{"_id": {"$in":["'+(this.currentuser.friends).join('", "') + '"'+']}}';
                Restangular.all('people').getList({where :params, seed: Math.random()})
                    .then(function(data){
                        this.chatfriends.push.apply(this.chatfriends, data);
                    }.bind(this));
            }
        };

        /*ChatActivity.prototype.getConversations = function(){
                if (this.currentuser.conversations.length !== 0) {
                    var params = '{"_id": {"$in":["'+(this.currentuser.conversations).join('", "') + '"'+']}}';

                Restangular.all('people').getList({where :params})
                    .then(function(data){
                        this.conversations.push.apply(this.conversations, data)

                    }.bind(this));
            }

        };*/


        ChatActivity.prototype.addToConversations = function(id){
            if(this.currentuser.conversations.indexOf(id) == -1 &&
               this.currentuser.friends.indexOf(id) == -1){
                   this.currentuser.conversations.push(id);

                   Restangular.one('addconversation').get({
                    cuserid : this.currentuser._id,
                    conversationid : id,
                    seed:Math.random()
                  }).then(function(data){
                      console.log('add conversation-->', data)
                  }.bind(this));
            }
        }


         ChatActivity.prototype.deleteConversation = function(id){
            if(this.currentuser.conversations.indexOf(id) !== -1){
               this.currentuser.conversations.splice(this.currentuser.conversations.indexOf(id),1);
               for(var k in this.messages){
                   if(this.messages[k].id == id){
                        this.messages.splice(k, 1);
                        break;
                   }
               }
              Restangular.one('deleteconversation').get({
		        cuserid : this.currentuser._id,
		        conversationid : id,
		        seed:Math.random()
		      }).then(function(data){
		          console.log('delete conversation-->', data)
		      }.bind(this));

            }
        }

        // sending message
        ChatActivity.prototype.sendMessage = function( receiverid, text){

            this.receiverid = receiverid;
            self = this;
            Restangular.all('chat/sendmessage').post({
                'sender':this.currentuser._id,
                'receiver': this.receiverid,
                'message': text,
                'seen': false
            }).then(function(data){
                //console.log(data)
            });
        }

        // return specific user page count and key
        function getKey_Pages(pages, recept){

             var temp_pages = null;
             var key = null;
             var found = false;

             if(pages.length){
                for(var k in pages){
                    if(pages[k].id == recept){
                        temp_pages = pages[k];
                        key = k;
                        found = true;
                        return ({'pageinfo':temp_pages, 'key':key});
                    }
                }

                if(!(found)){
                    // if person not found push into array
                    pages.push({
                        id:recept,
                        page:1,
                        end: false
                    });
                   temp_pages = pages[pages.length-1];
                   //console.log('pushed when not found', pages)
                   return ({'pageinfo':pages[pages.length-1], 'key': pages.length-1});

                }
            }
            // no chat room open push first page
            else{
                //console.log('first page')
                pages.push({
                    id:recept,
                    page:1,
                    end: false
                });
                return ({'pageinfo': pages[0], 'key':0});
            }
        }

        ChatActivity.prototype.loadMessages = function(user1, user2, roomdetails){
            var self = this;
            this.busy = true;
            var page = null;
            var key = null;

            self.main_params =  '{ "$or" : ['+
                    '{ "$and" : [ { "sender" : "'+user1+'" }, { "receiver" : "'+user2+'" } ] },'+
                    '{ "$and" : [ { "sender" : "'+user2+'" }, { "receiver": "'+user1+'" }  ] }'+
                ']}';

            self.embedded_param = '{"sender":1,"receiver":1}';
            var data = getKey_Pages(self.pages, user2);
            page = data.pageinfo;
            key = data.key;
            Restangular.all('messages').getList({
                where:self.main_params,
                embedded:self.embedded_param,
                seed:Math.random(),
                max_results: 10,
                page:page.page,
                sort: '[("message_created",-1)]',
            }).then(function(response){
				if (response.length < 10) {
					page.end = true;
				}
				self.messages.push.apply(self.messages,[{id:user2,details:roomdetails,messages:response}]);
				self.busy = false;
				page.page = page.page+1;
				self.pages[key] = page;
            }.bind(self));
        }

        // push message in messages array after next page called
        function PushMessages(allMessages, newMessages, recept){
            for(k in allMessages){
                if(allMessages[k].id == recept){
                   //console.log('all one messages', allMessages[k].messages)
                   allMessages[k].messages.push.apply(allMessages[k].messages, newMessages);
                   //console.log('after all one messages', allMessages[k].messages)
                   return allMessages;

                }
            }

        }

        ChatActivity.prototype.nextPage = function(user2) {
			if (this.busy | this.end) return;
			var self = this;
			self.busy = true;
            var page = null;
            var key = null;
            var data = getKey_Pages(self.pages, user2);
            page = data.pageinfo;
            key = data.key;
            var user1 = self.currentuser._id;
			self.main_params =  '{ "$or" : ['+
                    '{ "$and" : [ { "sender" : "'+user1+'" }, { "receiver" : "'+user2+'" } ] },'+
                    '{ "$and" : [ { "sender" : "'+user2+'" }, { "receiver": "'+user1+'" }  ] }'+
                ']}';

            self.embedded_param = '{"sender":1,"receiver":1}';
			Restangular.all('messages').getList({
			    where:self.main_params,
                embedded:self.embedded_param,
                seed:Math.random(),
                max_results: 10,
                page:page.page,
                sort: '[("message_created",-1)]'
			}).then(function(posts) {
				if (posts.length === 0) {
					page.end = true;
				}
                self.messages = PushMessages(self.messages, posts, user2)
                page.page = page.page + 1;
				self.pages[key] = page;
				self.busy = false;
			}.bind(self));
		};

        ChatActivity.prototype.pushMessage = function(receiverid, message){
            for(k in this.messages){

                if(this.messages[k].id == receiverid){
                   this.messages[k].messages.unshift(message);
                }
            }
        }

        ChatActivity.prototype.pushLatestMessage = function(msg){
            this.messageNotifc.push.apply(this.messageNotifc,[msg]);
           // console.log(this.messageNotifc)
        }

        ChatActivity.prototype.getMessageNotifcations= function(){
            var where_param = '{"$and":[{"receiver":"'+this.currentuser._id+'"},{"seen":false}]}';
            //var sort_param = '[("_created",-1)]';
            var embedded_param = '{"sender":1,"receiver":1}';
            var self = this;
            Restangular.all('messages').getList({
                where: where_param,
                embedded: embedded_param,
                seed:Math.random()
            }).then(function(data){
                self.messageNotifc.push.apply(self.messageNotifc, data);
            }.bind(self))
        }



        ChatActivity.prototype.loadLatestMessages = function(){

            var params = null;
            var getResults = false;
           // console.log(getResults)

            params =  '{ "$and" : [ { "timestamp":{"$gte": '+this.currentuser.lastmessageseen +' }},'+
                                       '{ "receiver" : "'+this.currentuser._id+'" }] }';

            if(this.messageNotifc.length){
                params = '{ "$and" : [ { "timestamp":{"$gte": '+this.currentuser.lastmessageseen +' }},'+
                                       '{ "receiver" : "'+this.currentuser._id+'" }, { "seen" : '+false+' } ] }';
                getResults = true;

            }else if(!(this.latestMessages.length)){
                getResults = true;
            }else{}

            var sort_param = '[("message_created",-1)]';
            var embedded_param = '{"sender":1,"receiver":1}';
            var self = this;

            if(getResults){

                Restangular.all('updatetimestamp').post({
                    timestamp:this.currentuser.lastmessageseen,
                    userid:this.currentuser._id
                }).then(function(data){
                    //console.log(data)
                });

                Restangular.all('messages').getList({
                    where: params,
                    embedded: embedded_param,
                    sort:sort_param,
                    max_results: 10,
                    seed:Math.random()
                }).then(function(data){

                    // getting distinct message notifications
                    var data2 = [];
                    data2.push.apply(data2,data);
                    var distinctMessages = [];

                    for(temp in data2){

                        // update seen true messages
                        this.updateseenmessages.push.apply(this.updateseenmessages, data);
                        // distinct arry empty then push
                        if(distinctMessages.length == 0){
                            distinctMessages.push(data2[temp]);
                        }
                        // else check in array then push
                        else{
                            for(var k in distinctMessages){
                                if(data2[temp].receiver._id == distinctMessages[k].receiver._id){
                                    //console.log('alredy pushed')
                                }
                                else{
                                    distinctMessages.push(data2[temp]);
                                }
                            }

                        }

                    }


                    self.latestMessages.push.apply(self.latestMessages, distinctMessages);

                    if(self.messageNotifc.length){
                        self.makeMessagesSeen(self.latestMessages);
                        self.messageNotifc = [];
                    }

                }.bind(self));
            }

        }

        ChatActivity.prototype.makeMessagesSeen = function(latestMessages){
            var messageids = [];
            for(x in this.updateseenmessages){
                messageids.push(this.updateseenmessages[x]._id);
            }
            if(messageids.length){
                Restangular.all('updateMessageSeen').post({
                    messageids: messageids
                }).then(function(data){
                    //console.log('--------updated messages seen status----------')
                    //console.log(data)
                    this.updateseenmessages = [];
                });

            }
        }

        ChatActivity.prototype.makeRoomMessagesSeen = function(senderid){
            var self = this;
            for(k in self.latestMessages){
                if(self.latestMessages[k].sender._id == senderid  &&
                   self.latestMessages[k].receiver._id == self.currentuser._id &&
                   self.latestMessages[k].seen == false
                ){
                    Restangular.one("messages",self.latestMessages[k]._id).patch(
                        {seen:true},{},
                        {
                            'Content-Type': 'application/json',
                            'If-Match': self.latestMessages[k]._etag,
                            'Authorization': $auth.getToken()
                        }).then(function(data){
                            self.latestMessages.splice(k,1);
                        });
                }
            }
        }
    return ChatActivity;
    });'use strict';
/**
 * @ngdoc service
 * @name weberApp.weberService
 * @description
 * # weberService
 * Service in the weberApp.
 */
angular.module('weberApp')

       .factory('questions', function($http, Restangular,$auth) {

        var questions = function(currentuser){
            this.currentuser = currentuser;
            this.allquestions = [];
            this.cuserquestions = [];
            this.user2 = {},
            this.canswers = this.currentuser.questions;
            console.log(this.currentuser.username)
        }

        questions.prototype.getallquestions = function(){
          Restangular.all('questions').getList().then(function(data){
            this.allquestions.push.apply(this.allquestions, data);

          }.bind(this));
        }

        function combine_ids(ids) {
   			return (ids.length ? "\"" + ids.join("\",\"") + "\"" : "");
		}

        questions.prototype.getUserQuestions = function(){
            var cuserquestionids = []

            for(var temp in this.currentuser.questions){
                cuserquestionids.push((this.currentuser.questions[temp].questionid).toString())
            }
            console.log('cuser question ids', cuserquestionids)

            var params = '{"_id": {"$in":['+combine_ids(cuserquestionids)+']}}';

            console.log(params)
            Restangular.all('questions').getList({where:params, seed: Math.random()}).then(function(data){
            this.cuserquestions.push.apply(this.cuserquestions, data);
          }.bind(this));

        }

        questions.prototype.updateAnswer = function(question, answer){
            console.log('----------------service------------')
            Restangular.one('updateAnswer').get({
		        question : question,
		        answer : answer,
		        cuserid : this.currentuser._id,
		        seed:Math.random()
		    }).then(function(data){
		        console.log('updated answer', data);
		        for(var temp in this.canswers){
                    if(this.canswers[temp].questionid == question){
                        this.canswers[temp].answer = answer;
                        return true
                    }
		        }

		        this.canswers.push({'questionid':question, 'answer':answer});
		    }.bind(this));
        }

        questions.prototype.checkAnswer = function(questionid){
            console.log('check answer', questionid)
            for(var temp in this.canswers){
                if(this.canswers[temp].questionid == questionid){
                    return this.canswers[temp].answer;
                }
            }
            return 3;
        }

         questions.prototype.checkYouAnswered = function(questionid, cuser){
            this.user2 = cuser;
            for(var temp in this.user2.questions){
                if(this.user2.questions[temp].questionid == questionid){
                    return true;
                }
            }
            return false;
         }

         questions.prototype.updateUser2 = function(question, answer){
            console.log('----------------service------------')
            Restangular.one('updateAnswer').get({
		        question : question,
		        answer : answer,
		        cuserid : this.user2._id,
		        seed:Math.random()
		    }).then(function(data){
		        console.log('updated answer', data);
		        for(var temp in this.user2.questions){
                    if(this.user2.questions[temp].questionid == question){
                        this.user2.questions[temp].answer = answer;
                        return true
                    }
		        }
		       this.user2.questions.push({'questionid':question, 'answer':answer});
		    }.bind(this));
         }


        return questions;
    })

	.factory('InstanceSearch', function($http, Restangular, $alert, $timeout) {

		var InstanceSearch = function() {

			this.InstancesearchResult = [];
			this.busy = false;
			this.end = false;
			this.page = 1;
			this.query = null;
		};

		InstanceSearch.prototype.getInstancePeoples = function(query){

            var self = this;
            this.query = query;
            if((query)) {
                var req = {
                    method: 'POST',
                    url: '/api/getpeoplenames',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        page: this.page,
                        query: query.toLowerCase()
                    }
                }

                $http(req).success(function (peoples) {
                    self.InstancesearchResult = peoples;
                    //console.log(self.InstancesearchResult)
                }.bind(self));
            }else{
                self.InstancesearchResult = [];
            }

        };

        InstanceSearch.prototype.nextPage = function() {
            //console.log('next page')
            //console.log(this.busy, this.end)
            if (this.busy | this.end) return;
			this.busy = true;
			var self = this;
            var req = {
                 method: 'POST',
                 url: '/api/getpeoplenames',
                 headers: {
                   'Content-Type': 'application/json'
                 },
                 data: {
                    page: self.page,
                    query: self.query
                 },
            }

            $http(req).success(function(peoples){

                if (peoples.length === 0) {
					self.end = true;
				}
				self.InstancesearchResult.push.apply(self.InstancesearchResult, peoples);
				self.page = self.page + 1;
				self.busy = false;
				//console.log(self.InstancesearchResult)
            }.bind(self));

		};
       return InstanceSearch;
    })

	.service('UserService', function($http, Restangular) {
		this.users = [];

		this.get = function(userId) {
            for (var i in this.users) {
				if (this.users[i]._id == userId) {
				    return this.users[i];
				}
			}
			var promise = Restangular.one('people',userId).get().$object;
			promise._id = userId;
			this.users.push(promise);
			return promise;
		};
	})
		.service('InterestsService', function($http, Restangular) {
		this.interests = [];

		this.get = function(interestid) {
		    if(interestid){
                console.log('------------interest id----------', interestid)
                for (var i in this.interests) {
                    if (this.interests[i]._id == interestid) {
                        return this.interests[i];
                    }
                }
                var promise = Restangular.one('interests',interestid).get().$object;
                promise._id = interestid;
                this.interests.push(promise);
                console.log('interests---->', interests)
                return promise;
            }
		};
	})

    .service('InstanceSearchHistory', function($http, Restangular) {
        this.history = [];
        this.get = function(query) {
            for (var i in this.history) {
                if (this.history[i].query == query) {
                    return this.history[i].result;
                }
            }
            return $http.get('/api/getpeoplenames/'+query);
        };

        this.pushToHistory = function(historyObject, query){
            this.history.push({
                'query':query,
                'result':historyObject
            })
        }
    })

	.service('MatchButtonService', function($http, Restangular, CurrentUser1) {

		this.checkMatchUnMatch = function(post, user) {
             //console.log('weber service post', post.interestedPeople)
             for(var i in post.interestedPeople){
		        if(post.interestedPeople[i].interested_person == user._id){
		            return true;
		        }
		     }
		     return false;
		};

		this.match = function(authorid, postid, cuserid){
		    return Restangular.one('match').get({
		        cuserid : cuserid,
		        authorid : authorid,
		        postid: postid,
		        seed:Math.random()
		    });
		};

		this.unmatch = function(authorid, postid, cuserid){
                return Restangular.one('unmatch').get({
		        cuserid : cuserid,
		        authorid : authorid,
		        postid: postid,
		        seed:Math.random()
		    });
		};

	})
    	.factory('InfinitePosts', function($http, Restangular, $alert, $timeout) {

		var InfinitePosts = function(user_obj,authorIds) {
			this.posts = [];
			this.SpecificPost = {},
			this.user_obj = user_obj;
			this.busy = true;
			this.page = 1;
			this.loadPostIds = authorIds;
			this.end = false;
            this.params = '{"author": {"$in":'+this.loadPostIds+'}}';
            //console.log('author params===>', this.params)
        }

        InfinitePosts.prototype.getEarlyPosts = function(){
                Restangular.all('posts').getList({
                    where : this.params,
                    max_results: 10,
                    page: this.page,
                    sort: '[("_created",-1)]',
                    seed:Math.random()
                }).then(function(posts) {
                    //console.log('loadposts')
                    if (posts.length < 10) {
                        this.end = true;
                    }
                    this.posts.push.apply(this.posts, posts);
                    this.page = this.page + 1;
                    this.busy = false;

                }.bind(this));
		};

        InfinitePosts.prototype.getSpecificPost = function(postid){
            var embedded = '{"author":1}';
            Restangular.one('posts', postid.postid).get({embedded:embedded, seed:Math.random()})
            .then(function(data){
                this.posts.push({
                    '_id':data._id,
                    'author':data.author,
                    'content':data.content,
                    '_created': data._created,
                    '_etag': data._etag,
                    'interestedPeople': data.interestedPeople,
                });
                //console.log('posts--------->', this.posts);
               // console.log('ddata--------->', data);
            }.bind(this));

        }

		InfinitePosts.prototype.nextPage = function() {
		    //console.log('nextpage')
			if (this.busy | this.end) return;
			this.busy = true;

			Restangular.all('posts').getList({
			    where : this.params,
				max_results: 10,
				page: this.page,
				sort: '[("_created",-1)]',
				seed:Math.random()
			}).then(function(posts) {
				if (posts.length === 0) {
					this.end = true;
				}
				this.posts.push.apply(this.posts, posts);
				this.page = this.page + 1;
				this.busy = false;
			}.bind(this));
		};

		InfinitePosts.prototype.loadNotificPost = function(postid, author){
            //console.log(postid, author)
            if(this.user_obj._id !== author){
                Restangular.one('posts', postid).get().then(function(post) {
                    //console.log(post)
                    this.posts.unshift({
                        author: post.author,
                        content: post.content,
                        _created: post._created,
                        _id: post._id,
                        _etag: post._etag,
                         interestedPeople : post.interestedPeople
                    });
                    //console.log(this.posts)
                }.bind(this));
            }
		}

		InfinitePosts.prototype.addPost = function(content, similar_keywords, imagePath) {

			this.user_obj.all('posts').post({
				author: this.user_obj._id,
				content: content,
				keywords: similar_keywords,
				post_image_path : imagePath,
				interestedPeople: []
			}).then(function(data) {

                this.posts.unshift({
                    author: this.user_obj._id,
                    content: content,
                    post_image_path : imagePath,
                    _created: new Date(),
                    _id:data._id,
                    _etag: data._etag,
                    interestedPeople : []

				});

				var myAlert = $alert({
					title: 'Successfully Posted! :)',
					placement: 'top',
					type: 'success',
					show: true
				});
				$timeout(function() {
					myAlert.hide();
				}, 5000);

			}.bind(this));
		};

		InfinitePosts.prototype.deletePost = function(post, user) {
            //console.log('delete post details', post.author)
			Restangular.one('posts', post._id).remove({},{
			    'If-Match': (post._etag).toString()
			}).then(function(data) {
			    for(var k in this.posts){
			        if(this.posts[k]._id == post._id){
			            this.posts.splice(k,1);
			            this.SpecificPost = {};
			            //console.log("successfully deleted")
			        }
			    }
			}.bind(this));

			for(var i in post.author.matchnotifications){
			    if(post.author.matchnotifications[i].postid == post._id){
    		       post.author.matchnotifications.splice(i,1);

    		       user.patch({'matchnotifications':post.author.matchnotifications})
    		       .then(function(data){
    		           /// console.log('delete notification==>', data)
    		       })
			    }
			}
		};
		return InfinitePosts;
	})
	.service('PostService', function($http, Restangular) {
		this.posts = [];
        var param1 = '{"author":1}';

		this.get = function(postid) {
		    //console.log('postid==>', postid)

			for (var i in this.posts) {
				if (this.posts[i]._id == postid) {
					return this.posts[i];
				}
			}

			var promise = Restangular.one('posts', postid).get({embedded: param1, seed: Math.random() }).$object;
			promise._id = postid;
			this.posts.push(promise);
			return promise;
		};

	    this.resetPost = function(postid){
	        var promise = Restangular.one('posts', postid).get({embedded: param1, seed: Math.random() }).$object;
			promise._id = postid;
			this.posts.push(promise);
			return promise;
	    }


	})

	.service('sortIListService', function($http, Restangular,CurrentUser1) {
		this.sendList = function(list, cuserid){
		    if(list && list.length){
		        for(var temp in list){
    		       if(list[temp] == cuserid){
                        list.push(list.splice( temp, 1 )[0]);
	               }
		        }
    		    return list.reverse();
		    }else
		        return list;
		}

	}).service('CurrentUser1', function($http, Restangular) {
		this.userId = null;
		this.user = null;
		this.reset = function() {
			this.userId = null;
		};

		if (this.userId === null) {
			$http.get('/api/me', {
				headers: {
					'Content-Type': 'application/json'
				}
			}).success(function(userId) {
				this.userId = userId;
				Restangular.one('people', JSON.parse(userId)).get().then(function(user) {
					this.user = user;
				}.bind(this));
			}.bind(this));
		}

	})
	.factory('CurrentUser', function($http,$auth,$q, Restangular) {
            var CurrentUser = function() {
			    this.userId = null;
			    this.user = null;
            }

            CurrentUser.prototype.getUserId = function(){

                    return $http.get('/api/me', {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': $auth.getToken()
                        }
                    }).success(function(userId) {
                        this.userId = userId;
                    }.bind(this));
            };

			CurrentUser.prototype.getCUserDetails = function(userid){

                return Restangular.one('people',JSON.parse(userid)).get({seed:Math.random()});
            };

            return CurrentUser;
    })



    .service('ESClient', function(esFactory) {
		return esFactory({
			host: 'http://127.0.0.1:8000',
			apiVersion: '1.2',
			log: 'trace'
		});
	})
    .factory('SearchActivity', function($http, Restangular, $alert, $timeout) {

		var SearchActivity = function(user_obj) {
			this.searchResult = [];
			this.user_obj = user_obj;
			this.busy = false;
			this.end = false;
			this.page = 1;
		};

		SearchActivity.prototype.getMysearches = function(){

                this.user_obj.all('searchActivity').getList({
                    max_results: 10,
                    page: this.page,
                    sort: '[("_created",-1)]',
                    seed: Math.random()
                }).then(function(data) {
                    //console.log('my search')
                    //console.log(data)
                    if (data.length < 10) {
					    this.end = true;
				    }

				    this.searchResult.push.apply(this.searchResult,data);
				    this.page = this.page + 1;
				    this.busy = false;
                }.bind(this));

		}

       SearchActivity.prototype.nextPage = function() {
			if (this.busy | this.end) return;
			this.busy = true;
            this.user_obj.all('searchActivity').getList({
                    max_results: 2,
                    page: this.page,
                    sort: '[("_created",-1)]',
                    seed: Math.random()
            }).then(function(data) {
                    if(data.length === 0){
                        this.end = true;
                    }
                    this.searchResult.push.apply(this.searchResult,data);
                    //console.log(this.searchResult)
                    this.page = this.page + 1;
				    this.busy = false;
            }.bind(this));
		};

		SearchActivity.prototype.addSearchText = function(content, similarwords) {
			this.user_obj.all('searchActivity').post({
				author: this.user_obj._id,
				content: content,
				keywords: similarwords
			}).then(function(data) {
                this.searchResult.unshift({
                    author: this.user_obj._id,
                    content: content,
                    _id: data._id
                });
			}.bind(this));
		};

		SearchActivity.prototype.getSimilarWords = function(sentence){
            return $http({
                       url: '/api/similarwords',
                       method: "GET",
                       params: {querystring: sentence }
            });
		}

		function combine_ids(ids) {
   			return (ids.length ? "\"" + ids.join("\",\"") + "\"" : "");
		}

    return SearchActivity;

	})
	.factory('MatchMeResults', function($http, Restangular, $alert, $timeout,CurrentUser,$auth,CurrentUser1) {

        function combine_ids(ids) {
   				return (ids.length ? "\"" + ids.join("\",\"") + "\"" : "");
		}

        // remove duplicate results
        function removeDuplicateResults(inputarry){

            var temparray = [];
            var authorIds = [];

            for(var i in inputarry){
                //console.log(i)
                if(authorIds.indexOf(inputarry[i].author._id) === -1){
                    authorIds.push(inputarry[i].author._id);
                    temparray.push(inputarry[i]);
                }
            }

            return temparray;
        }

		var  MatchMeResults = function(query) {

			this.total_matches = 0;

			this.mResultsNotFound = false;
			this.saResultsNotFound = false;

			this.mresults = [];
			this.matchedids = [];
			this.totalNames = '';
			this.searchNames =[];
			this.busy = true;
			this.page = 1;
			this.end = false;
            var keywords;
            this.param1 = null;
            this.param2 = null;
            this.query = query
            this.sPage = 1;
            this.sEnd = false;
            this.sBusy = true;
            this.suggestpeople = false;
        };

        MatchMeResults.prototype.newSearchResults = function(){


            if(this.query){
                var keywords = combine_ids(this.query.split(" "));
                var self = this;
                this.param1 = '{"$or":[{"keywords": {"$in":['+keywords+']}},{"content":{"$regex":".*'+this.query+'.*"}}]}';
			    this.param2 = '{"author":1}';

                Restangular.all('posts').getList({
				where : self.param1,
				seed: Math.random(),
				max_results: 70,
				page: self.page,
				embedded : self.param2
				}).then(function(data) {

                   if (data.length < 70) {
                        self.end = true;
    			   }
    			   if(data.length == 0){
    			        self.mResultsNotFound = true;

    			   }
                   self.mresults.push.apply(self.mresults,data);

                   self.mresults = removeDuplicateResults(self.mresults);
                   self.total_matches = data.length;
                   self.page = self.page + 1;
                   self.busy = false;
				}.bind(this));

				// also find in search activity
				this.param1 = '{"$or":[{"keywords": {"$in":['+keywords+']}},{"content":{"$regex":".*'+this.query+'.*"}}]}';
			    this.param2 = '{"author":1}';

                Restangular.all('searchActivity').getList({
				where : this.param1,
				seed: Math.random(),
				max_results: 70,
				page: this.sPage,
				embedded : this.param2
				}).then(function(data) {
                   if (data.length < 70) {
                        this.sEnd = true;
    			   }

    			   if(data.length == 0){
    			       self.saResultsNotFound = true;

    			   }

                   this.mresults.push.apply(this.mresults,data);
                   self.mresults = removeDuplicateResults(self.mresults);
                   this.total_matches = this.total_matches+data.length;
                   this.sPage = this.sPage + 1;
                   this.sBusy = false;
				}.bind(this));
            }
 		};



		MatchMeResults.prototype.getMatchedNewResults = function(searchPostId) {

			var params = '{"_id":"'+searchPostId+'"}';

			var data = Restangular.one("people",JSON.parse(CurrentUser1.userId)).all('searchActivity').getList({
				where :params,
				sort: '[("_created",-1)]',
				seed : Math.random()
			}).then(function(sResult) {

				var param = '{"_id":{"$in":['+combine_ids(sResult[0].matchedPosts)+']}}';
				var param2 = '{"author":1}';

				var data2 = Restangular.all("posts").getList({
					where: param,
					embedded: param2,
					seed : Math.random()
				}).then(function(data){
					this.total_matches = data.length;
					this.mresults.push.apply(this.mresults,data);
				}.bind(this));

				Restangular.one("searchActivity",searchPostId).patch(
					{newResults:0},{},
					{
						'Content-Type': 'application/json',
						'If-Match': sResult[0]._etag,
						'Authorization': $auth.getToken()
					}
				);

				return data2
            }.bind(this));
            return data;
		};

        MatchMeResults.prototype.nextPage = function() {

            if ((this.busy | this.end) && this.query) return;
			this.busy = true;
            var self = this;

			Restangular.all('posts').getList({
			    where : self.param1,
				max_results: 70,
				page: self.page,
				embedded : self.param2
			}).then(function(data) {

                if (data.length === 0) {
					self.end = true;
				}
				//console.log('called infinity scroll')
				self.mresults.push.apply(self.mresults, data);
                self.mresults = removeDuplicateResults(self.mresults);
				self.page = self.page + 1;
				self.busy = false;

			}.bind(self));


		};


		MatchMeResults.prototype.nextPageSearchResults = function() {
            //console.log("nextpage search resutls")
			if ((this.sBusy | this.sEnd) && this.query) return;
			this.sBusy = true;
            var self = this;

			Restangular.all('searchActivity').getList({
			    where : self.param1,
				max_results: 70,
				page: self.sPage,
				embedded : self.param2
			}).then(function(data) {

                if (data.length === 0) {
					self.sEnd = true;
				}

				self.mresults.push.apply(self.mresults, data);
                self.mresults = removeDuplicateResults(self.mresults);

				self.sPage = self.sPage + 1;
				self.sBusy = false;

			}.bind(self));
		};

		MatchMeResults.prototype.getMatchPeoples = function(searchText) {

			var params = '{"$or":[{"name.first":{"$regex":".*'+searchText+'.*"}},{"name.last":{"$regex":".*'+searchText+'.*"}},'+
			             '{"username":{"$regex":".*'+searchText+'.*"}}]}';
			Restangular.all('people').getList({
				where :params
				}).then(function(data) {
					this.totalNames = data.length;
					this.searchNames.push.apply(this.searchNames,data);
				}.bind(this));

		};

		MatchMeResults.prototype.getSuggestedPeople = function(){

            function combine_ids(ids) {
   			    return (ids.length ? "\"" + ids.join("\",\"") + "\"" : "");
		    }

            var param = '{"interestsimilarwords":{"$in":['+combine_ids(this.query.split(" "))+']}}';
            Restangular.all("people").getList({
					where: param,
					seed : Math.random()
			}).then(function(data){
                   if(data.length >= 1){
                     this.suggestpeople = true;
			       }
					var tempresutls = [];
					this.mresults.push.apply(this.mresults,data);
					for(var temp in this.mresults){
					    var author = {
					        author:{
                                name:{
                                    first:this.mresults[temp].name.first,
                                    last: this.mresults[temp].name.last,
                                },
                                _id:this.mresults[temp]._id,
                                picture:{
                                    medium:this.mresults[temp].picture.medium
                                }
                            }
					    }
					    tempresutls.push(author);
					}

					this.mresults = tempresutls;
			}.bind(this));
		}
		return MatchMeResults;
	});angular.module('weberApp')
.factory('friendsActivity', function($http, Restangular, $alert, $timeout,CurrentUser) {

        var friendsActivity = function(currentuser, profileuser){
            //console.log(profileuser)
            this.currentuser = currentuser;
            this.profileuser = profileuser;
            this.status = null;
            this.status_method = null;

            if (typeof this.profileuser.notifications === "undefined"){
                profileuser.patch({
                    "notifications": []
                })
            }

            if(typeof this.currentuser.notifications === "undefined"){
                currentuser.patch({
                    "notifications": []
                })
            }
        }



        friendsActivity.prototype.getRelation = function(){

                if(this.status === null){
                    if(this.profileuser.friends.indexOf(this.currentuser._id) > -1){
                        this.status = 'unfriend';
                    }
                }

                if(this.status === null){
                    var k = '';
                    for (k in this.profileuser.notifications){
                        if((this.profileuser.notifications[k].friendid == (this.currentuser._id)) &&
                          (this.profileuser.notifications[k].notific_type == 1)){
                            this.status = 'cancelrequest';
                        }
                    }
                }

                if(this.status === null){
                    var k = ''
                    for (k in this.currentuser.notifications){
                        if((this.currentuser.notifications[k].friendid == (this.profileuser._id)) &&
                           (this.currentuser.notifications[k].notific_type == 1))
                        {
                            this.status = 'reject_accept';
                        }
                    }
                }

                if(this.status === null){
                    this.status = 'addfriend';
                }
            return (this.status);
        }

         return friendsActivity;
	})
	.service('Friends', function($http, Restangular) {

		this.addFriend = function(cuserid, puserid) {
		    return Restangular.one('addfriend').get({
		        cuserid : cuserid,
		        puserid : puserid,
		        seed:Math.random()
		    });
		}

		this.cancelRequest = function(cuserid, puserid){
		    return Restangular.one('cancelfriend').get({
		        cuserid : cuserid,
		        puserid : puserid,
		        seed:Math.random()
		    });

		}

		this.acceptRequest = function(cuserid, puserid){
		    return Restangular.one('acceptfriend').get({
		        cuserid : cuserid,
		        puserid : puserid,
		        seed:Math.random()
		    });

		}

		this.rejectRequest = function(cuserid, puserid){
		    return Restangular.one('rejectfriend').get({
		        cuserid : cuserid,
		        puserid : puserid,
		        seed : Math.random()
		    });
		}

		this.unFreind = function(cuserid, puserid){
		    return Restangular.one('unfriend').get({
		        cuserid : cuserid,
		        puserid : puserid,
		        seed : Math.random()
		    });
		}

		this.makeSeen = function(cuserid){
		    return Restangular.one('makeseen').get({
		        cuserid : cuserid,
		        seed : Math.random()
		    });
		}
	});'use strict';

/**
 * @ngdoc service
 * @name weberApp.weberService
 * @description
 * # weberService
 * Service in the weberApp.
 */
angular.module('weberApp')
.factory('SettingsService', function($http, Restangular, $alert, $timeout,$auth, fileUpload) {

		var SettingsService = function(fieldvalue, fieldname) {

			this.fieldname = fieldname;
			this.fieldvalue = fieldvalue;
			this.userobj = [];

			var data = $http.get('/api/me', {
				headers: {
					'Content-Type': 'application/json',
					'Authorization':$auth.getToken()
				}
			}).success(function(userId) {
				this.userId = userId;
				var promise = Restangular.one('people',JSON.parse(userId)).get().then(function(user) {
					this.userobj = user;
					//console.log(this.userobj);
				}.bind(this));
				return promise;
			}.bind(this));
			return data;
		};

		SettingsService.prototype.updatefieldvalue = function(){

		};

		return SettingsService;
	})/* ========= file upload services ========*/
	.directive('fileModel', ['$parse', function ($parse) {
		return {
			restrict: 'A',
			link: function(scope, element, attrs) {
				var model = $parse(attrs.fileModel);
				var modelSetter = model.assign;

				element.bind('change', function(){
					scope.$apply(function(){
						modelSetter(scope, element[0].files[0]);
					});
				});
			}
		};
	}])
	.service('fileUpload', ['$http', function ($http,$auth, $scope, Restangular) {
		this.uploadFileToUrl = function(file, uploadUrl){
			var fd = new FormData();
			fd.append('file', file);
			this.path_name = "";
			return $http.post(uploadUrl, fd, {
				transformRequest: angular.identity,
				headers: {'Content-Type': undefined}
			});
		}
	}]);/*====== end of file upload services ======*/angular.module('weberApp')

    .factory('ChatActivity', function($http, Restangular,$auth) {

        var ChatActivity = function(currentuser){
            this.currentuser = currentuser;
            this.chatfriends = [];
            this._etag = currentuser._etag;
            this.messages = [];
            this.messageNotifc = [];
            this.latestMessages = [];
            this.conversations = [];

            // for infinity scroll parameters
            this.pages =[];
            this.busy = false;
            this.end = false;
            this.query = null;
            this.embedded_param = null;
            this.main_params = null;
            this.updateseenmessages = [];
        }

        ChatActivity.prototype.getChatFriends = function(){
            if (this.currentuser.friends.length !== 0) {

                var params = '{"_id": {"$in":["'+(this.currentuser.friends).join('", "') + '"'+']}}';
                Restangular.all('people').getList({where :params})
                    .then(function(data){
                        this.chatfriends.push.apply(this.chatfriends, data);
                    }.bind(this));
            }
        };

        /*ChatActivity.prototype.getConversations = function(){
                if (this.currentuser.conversations.length !== 0) {
                    var params = '{"_id": {"$in":["'+(this.currentuser.conversations).join('", "') + '"'+']}}';

                Restangular.all('people').getList({where :params})
                    .then(function(data){
                        this.conversations.push.apply(this.conversations, data)

                    }.bind(this));
            }

        };*/


        ChatActivity.prototype.addToConversations = function(id){
            if(this.currentuser.conversations.indexOf(id) == -1 &&
               this.currentuser.friends.indexOf(id) == -1){
                   this.currentuser.conversations.push(id);

                   Restangular.one('addconversation').get({
                    cuserid : this.currentuser._id,
                    conversationid : id,
                    seed:Math.random()
                  }).then(function(data){
                      console.log('add conversation-->', data)
                  }.bind(this));
            }
        }


         ChatActivity.prototype.deleteConversation = function(id){
            if(this.currentuser.conversations.indexOf(id) !== -1){
               this.currentuser.conversations.splice(this.currentuser.conversations.indexOf(id),1);
               for(var k in this.messages){
                   if(this.messages[k].id == id){
                        this.messages.splice(k, 1);
                        break;
                   }
               }
              Restangular.one('deleteconversation').get({
		        cuserid : this.currentuser._id,
		        conversationid : id,
		        seed:Math.random()
		      }).then(function(data){
		          console.log('delete conversation-->', data)
		      }.bind(this));

            }
        }

        // sending message
        ChatActivity.prototype.sendMessage = function( receiverid, text){

            this.receiverid = receiverid;
            self = this;
            Restangular.all('chat/sendmessage').post({
                'sender':this.currentuser._id,
                'receiver': this.receiverid,
                'message': text,
                'seen': false
            }).then(function(data){
                //console.log(data)
            });
        }

        // return specific user page count and key
        function getKey_Pages(pages, recept){

             var temp_pages = null;
             var key = null;
             var found = false;

             if(pages.length){
                for(var k in pages){
                    if(pages[k].id == recept){
                        temp_pages = pages[k];
                        key = k;
                        found = true;
                        return ({'pageinfo':temp_pages, 'key':key});
                    }
                }

                if(!(found)){
                    // if person not found push into array
                    pages.push({
                        id:recept,
                        page:1,
                        end: false
                    });
                   temp_pages = pages[pages.length-1];
                   //console.log('pushed when not found', pages)
                   return ({'pageinfo':pages[pages.length-1], 'key': pages.length-1});

                }
            }
            // no chat room open push first page
            else{
                //console.log('first page')
                pages.push({
                    id:recept,
                    page:1,
                    end: false
                });
                return ({'pageinfo': pages[0], 'key':0});
            }
        }

        ChatActivity.prototype.loadMessages = function(user1, user2, roomdetails){
            var self = this;
            this.busy = true;
            var page = null;
            var key = null;

            self.main_params =  '{ "$or" : ['+
                    '{ "$and" : [ { "sender" : "'+user1+'" }, { "receiver" : "'+user2+'" } ] },'+
                    '{ "$and" : [ { "sender" : "'+user2+'" }, { "receiver": "'+user1+'" }  ] }'+
                ']}';

            self.embedded_param = '{"sender":1,"receiver":1}';
            var data = getKey_Pages(self.pages, user2);
            page = data.pageinfo;
            key = data.key;
            Restangular.all('messages').getList({
                where:self.main_params,
                embedded:self.embedded_param,
                seed:Math.random(),
                max_results: 10,
                page:page.page,
                sort: '[("message_created",-1)]',
            }).then(function(response){
				if (response.length < 10) {
					page.end = true;
				}
				self.messages.push.apply(self.messages,[{id:user2,details:roomdetails,messages:response}]);
				self.busy = false;
				page.page = page.page+1;
				self.pages[key] = page;
            }.bind(self));
        }

        // push message in messages array after next page called
        function PushMessages(allMessages, newMessages, recept){
            for(k in allMessages){
                if(allMessages[k].id == recept){
                   //console.log('all one messages', allMessages[k].messages)
                   allMessages[k].messages.push.apply(allMessages[k].messages, newMessages);
                   //console.log('after all one messages', allMessages[k].messages)
                   return allMessages;

                }
            }

        }

        ChatActivity.prototype.nextPage = function(user2) {
			if (this.busy | this.end) return;
			var self = this;
			self.busy = true;
            var page = null;
            var key = null;
            var data = getKey_Pages(self.pages, user2);
            page = data.pageinfo;
            key = data.key;
            var user1 = self.currentuser._id;
			self.main_params =  '{ "$or" : ['+
                    '{ "$and" : [ { "sender" : "'+user1+'" }, { "receiver" : "'+user2+'" } ] },'+
                    '{ "$and" : [ { "sender" : "'+user2+'" }, { "receiver": "'+user1+'" }  ] }'+
                ']}';

            self.embedded_param = '{"sender":1,"receiver":1}';
			Restangular.all('messages').getList({
			    where:self.main_params,
                embedded:self.embedded_param,
                seed:Math.random(),
                max_results: 10,
                page:page.page,
                sort: '[("message_created",-1)]'
			}).then(function(posts) {
				if (posts.length === 0) {
					page.end = true;
				}
                self.messages = PushMessages(self.messages, posts, user2)
                page.page = page.page + 1;
				self.pages[key] = page;
				self.busy = false;
			}.bind(self));
		};

        ChatActivity.prototype.pushMessage = function(receiverid, message){
            for(k in this.messages){

                if(this.messages[k].id == receiverid){
                   this.messages[k].messages.unshift(message);
                }
            }
        }

        ChatActivity.prototype.pushLatestMessage = function(msg){
            this.messageNotifc.push.apply(this.messageNotifc,[msg]);
           // console.log(this.messageNotifc)
        }

        ChatActivity.prototype.getMessageNotifcations= function(){
            var where_param = '{"$and":[{"receiver":"'+this.currentuser._id+'"},{"seen":false}]}';
            //var sort_param = '[("_created",-1)]';
            var embedded_param = '{"sender":1,"receiver":1}';
            var self = this;
            Restangular.all('messages').getList({
                where: where_param,
                embedded: embedded_param,
                seed:Math.random()
            }).then(function(data){
                self.messageNotifc.push.apply(self.messageNotifc, data);
            }.bind(self))
        }



        ChatActivity.prototype.loadLatestMessages = function(){

            var params = null;
            var getResults = false;
           // console.log(getResults)

            params =  '{ "$and" : [ { "timestamp":{"$gte": '+this.currentuser.lastmessageseen +' }},'+
                                       '{ "receiver" : "'+this.currentuser._id+'" }] }';

            if(this.messageNotifc.length){
                params = '{ "$and" : [ { "timestamp":{"$gte": '+this.currentuser.lastmessageseen +' }},'+
                                       '{ "receiver" : "'+this.currentuser._id+'" }, { "seen" : '+false+' } ] }';
                getResults = true;

            }else if(!(this.latestMessages.length)){
                getResults = true;
            }else{}

            var sort_param = '[("message_created",-1)]';
            var embedded_param = '{"sender":1,"receiver":1}';
            var self = this;

            if(getResults){

                Restangular.all('updatetimestamp').post({
                    timestamp:this.currentuser.lastmessageseen,
                    userid:this.currentuser._id
                }).then(function(data){
                    //console.log(data)
                });

                Restangular.all('messages').getList({
                    where: params,
                    embedded: embedded_param,
                    sort:sort_param,
                    max_results: 10,
                    seed:Math.random()
                }).then(function(data){

                    // getting distinct message notifications
                    var data2 = [];
                    data2.push.apply(data2,data);
                    var distinctMessages = [];

                    for(temp in data2){

                        // update seen true messages
                        this.updateseenmessages.push.apply(this.updateseenmessages, data);
                        // distinct arry empty then push
                        if(distinctMessages.length == 0){
                            distinctMessages.push(data2[temp]);
                        }
                        // else check in array then push
                        else{
                            for(var k in distinctMessages){
                                if(data2[temp].receiver._id == distinctMessages[k].receiver._id){
                                    //console.log('alredy pushed')
                                }
                                else{
                                    distinctMessages.push(data2[temp]);
                                }
                            }

                        }

                    }


                    self.latestMessages.push.apply(self.latestMessages, distinctMessages);

                    if(self.messageNotifc.length){
                        self.makeMessagesSeen(self.latestMessages);
                        self.messageNotifc = [];
                    }

                }.bind(self));
            }

        }

        ChatActivity.prototype.makeMessagesSeen = function(latestMessages){
            var messageids = [];
            for(x in this.updateseenmessages){
                messageids.push(this.updateseenmessages[x]._id);
            }
            if(messageids.length){
                Restangular.all('updateMessageSeen').post({
                    messageids: messageids
                }).then(function(data){
                    //console.log('--------updated messages seen status----------')
                    //console.log(data)
                    this.updateseenmessages = [];
                });

            }
        }

        ChatActivity.prototype.makeRoomMessagesSeen = function(senderid){
            var self = this;
            for(k in self.latestMessages){
                if(self.latestMessages[k].sender._id == senderid  &&
                   self.latestMessages[k].receiver._id == self.currentuser._id &&
                   self.latestMessages[k].seen == false
                ){
                    Restangular.one("messages",self.latestMessages[k]._id).patch(
                        {seen:true},{},
                        {
                            'Content-Type': 'application/json',
                            'If-Match': self.latestMessages[k]._etag,
                            'Authorization': $auth.getToken()
                        }).then(function(data){
                            self.latestMessages.splice(k,1);
                        });
                }
            }
        }
    return ChatActivity;
    });'use strict';
/**
 * @ngdoc service
 * @name weberApp.weberService
 * @description
 * # weberService
 * Service in the weberApp.
 */
angular.module('weberApp')

       .factory('questions', function($http, Restangular,$auth) {

        var questions = function(currentuser){
            this.currentuser = currentuser;
            this.allquestions = [];
            this.cuserquestions = [];
            this.user2 = {},
            this.canswers = this.currentuser.questions;
            console.log(this.currentuser.username)
        }

        questions.prototype.getallquestions = function(){
          Restangular.all('questions').getList().then(function(data){
            this.allquestions.push.apply(this.allquestions, data);

          }.bind(this));
        }

        function combine_ids(ids) {
   			return (ids.length ? "\"" + ids.join("\",\"") + "\"" : "");
		}

        questions.prototype.getUserQuestions = function(){
            var cuserquestionids = []

            for(var temp in this.currentuser.questions){
                cuserquestionids.push((this.currentuser.questions[temp].questionid).toString())
            }
            console.log('cuser question ids', cuserquestionids)

            var params = '{"_id": {"$in":['+combine_ids(cuserquestionids)+']}}';

            console.log(params)
            Restangular.all('questions').getList({where:params, seed: Math.random()}).then(function(data){
            this.cuserquestions.push.apply(this.cuserquestions, data);
          }.bind(this));

        }

        questions.prototype.updateAnswer = function(question, answer){
            console.log('----------------service------------')
            Restangular.one('updateAnswer').get({
		        question : question,
		        answer : answer,
		        cuserid : this.currentuser._id,
		        seed:Math.random()
		    }).then(function(data){
		        console.log('updated answer', data);
		        for(var temp in this.canswers){
                    if(this.canswers[temp].questionid == question){
                        this.canswers[temp].answer = answer;
                        return true
                    }
		        }

		        this.canswers.push({'questionid':question, 'answer':answer});
		    }.bind(this));
        }

        questions.prototype.checkAnswer = function(questionid){
            console.log('check answer', questionid)
            for(var temp in this.canswers){
                if(this.canswers[temp].questionid == questionid){
                    return this.canswers[temp].answer;
                }
            }
            return 3;
        }

         questions.prototype.checkYouAnswered = function(questionid, cuser){
            this.user2 = cuser;
            for(var temp in this.user2.questions){
                if(this.user2.questions[temp].questionid == questionid){
                    return true;
                }
            }
            return false;
         }

         questions.prototype.updateUser2 = function(question, answer){
            console.log('----------------service------------')
            Restangular.one('updateAnswer').get({
		        question : question,
		        answer : answer,
		        cuserid : this.user2._id,
		        seed:Math.random()
		    }).then(function(data){
		        console.log('updated answer', data);
		        for(var temp in this.user2.questions){
                    if(this.user2.questions[temp].questionid == question){
                        this.user2.questions[temp].answer = answer;
                        return true
                    }
		        }
		       this.user2.questions.push({'questionid':question, 'answer':answer});
		    }.bind(this));
         }


        return questions;
    })

	.factory('InstanceSearch', function($http, Restangular, $alert, $timeout) {

		var InstanceSearch = function() {

			this.InstancesearchResult = [];
			this.busy = false;
			this.end = false;
			this.page = 1;
			this.query = null;
		};

		InstanceSearch.prototype.getInstancePeoples = function(query){

            var self = this;
            this.query = query;
            if((query)) {
                var req = {
                    method: 'POST',
                    url: '/api/getpeoplenames',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        page: this.page,
                        query: query.toLowerCase()
                    }
                }

                $http(req).success(function (peoples) {
                    self.InstancesearchResult = peoples;
                    //console.log(self.InstancesearchResult)
                }.bind(self));
            }else{
                self.InstancesearchResult = [];
            }

        };

        InstanceSearch.prototype.nextPage = function() {
            //console.log('next page')
            //console.log(this.busy, this.end)
            if (this.busy | this.end) return;
			this.busy = true;
			var self = this;
            var req = {
                 method: 'POST',
                 url: '/api/getpeoplenames',
                 headers: {
                   'Content-Type': 'application/json'
                 },
                 data: {
                    page: self.page,
                    query: self.query
                 },
            }

            $http(req).success(function(peoples){

                if (peoples.length === 0) {
					self.end = true;
				}
				self.InstancesearchResult.push.apply(self.InstancesearchResult, peoples);
				self.page = self.page + 1;
				self.busy = false;
				//console.log(self.InstancesearchResult)
            }.bind(self));

		};
       return InstanceSearch;
    })

	.service('UserService', function($http, Restangular) {
		this.users = [];

		this.get = function(userId) {
            for (var i in this.users) {
				if (this.users[i]._id == userId) {
				    return this.users[i];
				}
			}
			var promise = Restangular.one('people',userId).get().$object;
			promise._id = userId;
			this.users.push(promise);
			return promise;
		};
	})
		.service('InterestsService', function($http, Restangular) {
		this.interests = [];

		this.get = function(interestid) {
		    if(interestid){
                console.log('------------interest id----------', interestid)
                for (var i in this.interests) {
                    if (this.interests[i]._id == interestid) {
                        return this.interests[i];
                    }
                }
                var promise = Restangular.one('interests',interestid).get().$object;
                promise._id = interestid;
                this.interests.push(promise);
                console.log('interests---->', interests)
                return promise;
            }
		};
	})

    .service('InstanceSearchHistory', function($http, Restangular) {
        this.history = [];
        this.get = function(query) {
            for (var i in this.history) {
                if (this.history[i].query == query) {
                    return this.history[i].result;
                }
            }
            return $http.get('/api/getpeoplenames/'+query);
        };

        this.pushToHistory = function(historyObject, query){
            this.history.push({
                'query':query,
                'result':historyObject
            })
        }
    })

	.service('MatchButtonService', function($http, Restangular, CurrentUser1) {

		this.checkMatchUnMatch = function(post, user) {
             //console.log('weber service post', post.interestedPeople)
             for(var i in post.interestedPeople){
		        if(post.interestedPeople[i].interested_person == user._id){
		            return true;
		        }
		     }
		     return false;
		};

		this.match = function(authorid, postid, cuserid){
		    return Restangular.one('match').get({
		        cuserid : cuserid,
		        authorid : authorid,
		        postid: postid,
		        seed:Math.random()
		    });
		};

		this.unmatch = function(authorid, postid, cuserid){
                return Restangular.one('unmatch').get({
		        cuserid : cuserid,
		        authorid : authorid,
		        postid: postid,
		        seed:Math.random()
		    });
		};

	})
    	.factory('InfinitePosts', function($http, Restangular, $alert, $timeout) {

		var InfinitePosts = function(user_obj,authorIds) {
			this.posts = [];
			this.SpecificPost = {},
			this.user_obj = user_obj;
			this.busy = true;
			this.page = 1;
			this.loadPostIds = authorIds;
			this.end = false;
            this.params = '{"author": {"$in":'+this.loadPostIds+'}}';
            //console.log('author params===>', this.params)
        }

        InfinitePosts.prototype.getEarlyPosts = function(){
                Restangular.all('posts').getList({
                    where : this.params,
                    max_results: 10,
                    page: this.page,
                    sort: '[("_created",-1)]',
                    seed:Math.random()
                }).then(function(posts) {
                    //console.log('loadposts')
                    if (posts.length < 10) {
                        this.end = true;
                    }
                    this.posts.push.apply(this.posts, posts);
                    this.page = this.page + 1;
                    this.busy = false;

                }.bind(this));
		};

        InfinitePosts.prototype.getSpecificPost = function(postid){
            var embedded = '{"author":1}';
            Restangular.one('posts', postid.postid).get({embedded:embedded, seed:Math.random()})
            .then(function(data){
                this.posts.push({
                    '_id':data._id,
                    'author':data.author,
                    'content':data.content,
                    '_created': data._created,
                    '_etag': data._etag,
                    'interestedPeople': data.interestedPeople,
                });
                //console.log('posts--------->', this.posts);
               // console.log('ddata--------->', data);
            }.bind(this));

        }

		InfinitePosts.prototype.nextPage = function() {
		    //console.log('nextpage')
			if (this.busy | this.end) return;
			this.busy = true;

			Restangular.all('posts').getList({
			    where : this.params,
				max_results: 10,
				page: this.page,
				sort: '[("_created",-1)]',
				seed:Math.random()
			}).then(function(posts) {
				if (posts.length === 0) {
					this.end = true;
				}
				this.posts.push.apply(this.posts, posts);
				this.page = this.page + 1;
				this.busy = false;
			}.bind(this));
		};

		InfinitePosts.prototype.loadNotificPost = function(postid, author){
            //console.log(postid, author)
            if(this.user_obj._id !== author){
                Restangular.one('posts', postid).get().then(function(post) {
                    //console.log(post)
                    this.posts.unshift({
                        author: post.author,
                        content: post.content,
                        _created: post._created,
                        _id: post._id,
                        _etag: post._etag,
                         interestedPeople : post.interestedPeople
                    });
                    //console.log(this.posts)
                }.bind(this));
            }
		}

		InfinitePosts.prototype.addPost = function(content, similar_keywords, imagePath) {

			this.user_obj.all('posts').post({
				author: this.user_obj._id,
				content: content,
				keywords: similar_keywords,
				post_image_path : imagePath,
				interestedPeople: []
			}).then(function(data) {

                this.posts.unshift({
                    author: this.user_obj._id,
                    content: content,
                    post_image_path : imagePath,
                    _created: new Date(),
                    _id:data._id,
                    _etag: data._etag,
                    interestedPeople : []

				});

				var myAlert = $alert({
					title: 'Successfully Posted! :)',
					placement: 'top',
					type: 'success',
					show: true
				});
				$timeout(function() {
					myAlert.hide();
				}, 5000);

			}.bind(this));
		};

		InfinitePosts.prototype.deletePost = function(post, user) {
            //console.log('delete post details', post.author)
			Restangular.one('posts', post._id).remove({},{
			    'If-Match': (post._etag).toString()
			}).then(function(data) {
			    for(var k in this.posts){
			        if(this.posts[k]._id == post._id){
			            this.posts.splice(k,1);
			            this.SpecificPost = {};
			            //console.log("successfully deleted")
			        }
			    }
			}.bind(this));

			for(var i in post.author.matchnotifications){
			    if(post.author.matchnotifications[i].postid == post._id){
    		       post.author.matchnotifications.splice(i,1);

    		       user.patch({'matchnotifications':post.author.matchnotifications})
    		       .then(function(data){
    		           /// console.log('delete notification==>', data)
    		       })
			    }
			}
		};
		return InfinitePosts;
	})
	.service('PostService', function($http, Restangular) {
		this.posts = [];
        var param1 = '{"author":1}';

		this.get = function(postid) {
		    //console.log('postid==>', postid)

			for (var i in this.posts) {
				if (this.posts[i]._id == postid) {
					return this.posts[i];
				}
			}

			var promise = Restangular.one('posts', postid).get({embedded: param1, seed: Math.random() }).$object;
			promise._id = postid;
			this.posts.push(promise);
			return promise;
		};

	    this.resetPost = function(postid){
	        var promise = Restangular.one('posts', postid).get({embedded: param1, seed: Math.random() }).$object;
			promise._id = postid;
			this.posts.push(promise);
			return promise;
	    }


	})

	.service('sortIListService', function($http, Restangular,CurrentUser1) {
		this.sendList = function(list, cuserid){
		    if(list && list.length){
		        for(var temp in list){
    		       if(list[temp] == cuserid){
                        list.push(list.splice( temp, 1 )[0]);
	               }
		        }
    		    return list.reverse();
		    }else
		        return list;
		}

	}).service('CurrentUser1', function($http, Restangular) {
		this.userId = null;
		this.user = null;
		this.reset = function() {
			this.userId = null;
		};

		if (this.userId === null) {
			$http.get('/api/me', {
				headers: {
					'Content-Type': 'application/json'
				}
			}).success(function(userId) {
				this.userId = userId;
				Restangular.one('people', JSON.parse(userId)).get().then(function(user) {
					this.user = user;
				}.bind(this));
			}.bind(this));
		}

	})
	.factory('CurrentUser', function($http,$auth,$q, Restangular) {
            var CurrentUser = function() {
			    this.userId = null;
			    this.user = null;
            }

            CurrentUser.prototype.getUserId = function(){

                    return $http.get('/api/me', {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': $auth.getToken()
                        }
                    }).success(function(userId) {
                        this.userId = userId;
                    }.bind(this));
            };

			CurrentUser.prototype.getCUserDetails = function(userid){

                return Restangular.one('people',JSON.parse(userid)).get({seed:Math.random()});
            };

            return CurrentUser;
    })



    .service('ESClient', function(esFactory) {
		return esFactory({
			host: 'http://127.0.0.1:8000',
			apiVersion: '1.2',
			log: 'trace'
		});
	})
    .factory('SearchActivity', function($http, Restangular, $alert, $timeout) {

		var SearchActivity = function(user_obj) {
			this.searchResult = [];
			this.user_obj = user_obj;
			this.busy = false;
			this.end = false;
			this.page = 1;
		};

		SearchActivity.prototype.getMysearches = function(){

                this.user_obj.all('searchActivity').getList({
                    max_results: 10,
                    page: this.page,
                    sort: '[("_created",-1)]',
                    seed: Math.random()
                }).then(function(data) {
                    //console.log('my search')
                    //console.log(data)
                    if (data.length < 10) {
					    this.end = true;
				    }

				    this.searchResult.push.apply(this.searchResult,data);
				    this.page = this.page + 1;
				    this.busy = false;
                }.bind(this));

		}

       SearchActivity.prototype.nextPage = function() {
			if (this.busy | this.end) return;
			this.busy = true;
            this.user_obj.all('searchActivity').getList({
                    max_results: 2,
                    page: this.page,
                    sort: '[("_created",-1)]',
                    seed: Math.random()
            }).then(function(data) {
                    if(data.length === 0){
                        this.end = true;
                    }
                    this.searchResult.push.apply(this.searchResult,data);
                    //console.log(this.searchResult)
                    this.page = this.page + 1;
				    this.busy = false;
            }.bind(this));
		};

		SearchActivity.prototype.addSearchText = function(content, similarwords) {
			this.user_obj.all('searchActivity').post({
				author: this.user_obj._id,
				content: content,
				keywords: similarwords
			}).then(function(data) {
                this.searchResult.unshift({
                    author: this.user_obj._id,
                    content: content,
                    _id: data._id
                });
			}.bind(this));
		};

		SearchActivity.prototype.getSimilarWords = function(sentence){
            return $http({
                       url: '/api/similarwords',
                       method: "GET",
                       params: {querystring: sentence }
            });
		}

		function combine_ids(ids) {
   			return (ids.length ? "\"" + ids.join("\",\"") + "\"" : "");
		}

    return SearchActivity;

	})
	.factory('MatchMeResults', function($http, Restangular, $alert, $timeout,CurrentUser,$auth,CurrentUser1) {

        function combine_ids(ids) {
   				return (ids.length ? "\"" + ids.join("\",\"") + "\"" : "");
		}

        // remove duplicate results
        function removeDuplicateResults(inputarry){

            var temparray = [];
            var authorIds = [];

            for(var i in inputarry){
                //console.log(i)
                if(authorIds.indexOf(inputarry[i].author._id) === -1){
                    authorIds.push(inputarry[i].author._id);
                    temparray.push(inputarry[i]);
                }
            }

            return temparray;
        }

		var  MatchMeResults = function(query) {

			this.total_matches = 0;

			this.mResultsNotFound = false;
			this.saResultsNotFound = false;

			this.mresults = [];
			this.matchedids = [];
			this.totalNames = '';
			this.searchNames =[];
			this.busy = true;
			this.page = 1;
			this.end = false;
            var keywords;
            this.param1 = null;
            this.param2 = null;
            this.query = query
            this.sPage = 1;
            this.sEnd = false;
            this.sBusy = true;
            this.suggestpeople = false;
        };

        MatchMeResults.prototype.newSearchResults = function(){


            if(this.query){
                var keywords = combine_ids(this.query.split(" "));
                var self = this;
                this.param1 = '{"$or":[{"keywords": {"$in":['+keywords+']}},{"content":{"$regex":".*'+this.query+'.*"}}]}';
			    this.param2 = '{"author":1}';

                Restangular.all('posts').getList({
				where : self.param1,
				seed: Math.random(),
				max_results: 70,
				page: self.page,
				embedded : self.param2
				}).then(function(data) {

                   if (data.length < 70) {
                        self.end = true;
    			   }
    			   if(data.length == 0){
    			        self.mResultsNotFound = true;

    			   }
                   self.mresults.push.apply(self.mresults,data);

                   self.mresults = removeDuplicateResults(self.mresults);
                   self.total_matches = data.length;
                   self.page = self.page + 1;
                   self.busy = false;
				}.bind(this));

				// also find in search activity
				this.param1 = '{"$or":[{"keywords": {"$in":['+keywords+']}},{"content":{"$regex":".*'+this.query+'.*"}}]}';
			    this.param2 = '{"author":1}';

                Restangular.all('searchActivity').getList({
				where : this.param1,
				seed: Math.random(),
				max_results: 70,
				page: this.sPage,
				embedded : this.param2
				}).then(function(data) {
                   if (data.length < 70) {
                        this.sEnd = true;
    			   }

    			   if(data.length == 0){
    			       self.saResultsNotFound = true;

    			   }

                   this.mresults.push.apply(this.mresults,data);
                   self.mresults = removeDuplicateResults(self.mresults);
                   this.total_matches = this.total_matches+data.length;
                   this.sPage = this.sPage + 1;
                   this.sBusy = false;
				}.bind(this));
            }
 		};



		MatchMeResults.prototype.getMatchedNewResults = function(searchPostId) {

			var params = '{"_id":"'+searchPostId+'"}';

			var data = Restangular.one("people",JSON.parse(CurrentUser1.userId)).all('searchActivity').getList({
				where :params,
				sort: '[("_created",-1)]',
				seed : Math.random()
			}).then(function(sResult) {

				var param = '{"_id":{"$in":['+combine_ids(sResult[0].matchedPosts)+']}}';
				var param2 = '{"author":1}';

				var data2 = Restangular.all("posts").getList({
					where: param,
					embedded: param2,
					seed : Math.random()
				}).then(function(data){
					this.total_matches = data.length;
					this.mresults.push.apply(this.mresults,data);
				}.bind(this));

				Restangular.one("searchActivity",searchPostId).patch(
					{newResults:0},{},
					{
						'Content-Type': 'application/json',
						'If-Match': sResult[0]._etag,
						'Authorization': $auth.getToken()
					}
				);

				return data2
            }.bind(this));
            return data;
		};

        MatchMeResults.prototype.nextPage = function() {

            if ((this.busy | this.end) && this.query) return;
			this.busy = true;
            var self = this;

			Restangular.all('posts').getList({
			    where : self.param1,
				max_results: 70,
				page: self.page,
				embedded : self.param2
			}).then(function(data) {

                if (data.length === 0) {
					self.end = true;
				}
				//console.log('called infinity scroll')
				self.mresults.push.apply(self.mresults, data);
                self.mresults = removeDuplicateResults(self.mresults);
				self.page = self.page + 1;
				self.busy = false;

			}.bind(self));


		};


		MatchMeResults.prototype.nextPageSearchResults = function() {
            //console.log("nextpage search resutls")
			if ((this.sBusy | this.sEnd) && this.query) return;
			this.sBusy = true;
            var self = this;

			Restangular.all('searchActivity').getList({
			    where : self.param1,
				max_results: 70,
				page: self.sPage,
				embedded : self.param2
			}).then(function(data) {

                if (data.length === 0) {
					self.sEnd = true;
				}

				self.mresults.push.apply(self.mresults, data);
                self.mresults = removeDuplicateResults(self.mresults);

				self.sPage = self.sPage + 1;
				self.sBusy = false;

			}.bind(self));
		};

		MatchMeResults.prototype.getMatchPeoples = function(searchText) {

			var params = '{"$or":[{"name.first":{"$regex":".*'+searchText+'.*"}},{"name.last":{"$regex":".*'+searchText+'.*"}},'+
			             '{"username":{"$regex":".*'+searchText+'.*"}}]}';
			Restangular.all('people').getList({
				where :params
				}).then(function(data) {
					this.totalNames = data.length;
					this.searchNames.push.apply(this.searchNames,data);
				}.bind(this));

		};

		MatchMeResults.prototype.getSuggestedPeople = function(){

            function combine_ids(ids) {
   			    return (ids.length ? "\"" + ids.join("\",\"") + "\"" : "");
		    }

            var param = '{"interestsimilarwords":{"$in":['+combine_ids(this.query.split(" "))+']}}';
            Restangular.all("people").getList({
					where: param,
					seed : Math.random()
			}).then(function(data){
                   if(data.length >= 1){
                     this.suggestpeople = true;
			       }
					var tempresutls = [];
					this.mresults.push.apply(this.mresults,data);
					for(var temp in this.mresults){
					    var author = {
					        author:{
                                name:{
                                    first:this.mresults[temp].name.first,
                                    last: this.mresults[temp].name.last,
                                },
                                _id:this.mresults[temp]._id,
                                picture:{
                                    medium:this.mresults[temp].picture.medium
                                }
                            }
					    }
					    tempresutls.push(author);
					}

					this.mresults = tempresutls;
			}.bind(this));
		}
		return MatchMeResults;
	});angular.module('weberApp')

.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
})

.directive('chatdivdir', function () {
    return {
        restrict: 'A',
        replace: true,
        controller:function($scope, $element, $attrs){
            $scope.chatroomdiv = function(id){
                if($element[0].offsetHeight == 364){
                    $element.css('height', '40px');

                    var data = JSON.parse(sessionStorage.getItem(id));
                    json = {
                                      name:data.name,
                                      id: data.id,
                                      minimize:true,
                                      maximize:false,
                                      right:0,
                                      height:'40px'
                    }
                    sessionStorage.removeItem(id);
                    sessionStorage.setItem(data.id, JSON.stringify(json));

                }else{

                    $element.css('height', '364px');
                    $scope.chatdivnotification = [];

                    var data = JSON.parse(sessionStorage.getItem(id));
                    json = {
                                      name:data.name,
                                      id: data.id,
                                      minimize:false,
                                      maximize:true,
                                      right:0,
                                      height:'364px'
                          }

                    sessionStorage.removeItem(id);
                    sessionStorage.setItem(data.id, JSON.stringify(json));
                    //console.log('chat div notifications============')
                    // make message notifications on div seen
                    $scope.newMessageSeen(data.id);
                }
            }

        }


    };
})
.directive('cancelrequest', function ($compile, CurrentUser, Restangular, $routeParams, $route,friendsActivity, Friends) {
    return {
        restrict: 'E',
        replace: true,

        link: function ($scope, element, attrs ) {},
         controller:function($scope, $element, $attrs, $transclude){

         $scope.frndaddrequest = function(id){

                var html = '<image src="/static/app/images/pleasewait.gif" alt="no image found" style="position:absolute">';
                $element.html(html);
                $compile($element.contents())($scope);

                var data = Friends.addFriend($scope.user._id, $scope.profileuser._id);

                //console.log('data----------->', data)
                data.then(function(data){
                   // console.log('data123--------->', data)
                    if(data.data){
                         var html ='<addfriend><button ng-click="frndcancelrequest(\''+id+'\')"  class="btn btn-primary">cancel request</button></addfriend>';
                         var e =$compile(html)($scope);
                         $element.replaceWith(e);
                         $route.reload();

                    }else{
                         var html ='<b>unable to process</b>';
                         var e =$compile(html)($scope);
                         $element.replaceWith(e);
                         $route.reload();
                    }
                });
            }
         }

    };
})

.directive('addfriend', function ($compile, CurrentUser, Restangular,$route, $routeParams, friendsActivity, Friends) {

    return {
        restrict: 'E',
        replace: true,
        link: function ($scope, $element, attrs) {},
         controller:function($scope, $element, $attrs, $transclude){
         $scope.frndcancelrequest = function(id){

                var html = '<image src="/static/app/images/pleasewait.gif" alt="no image found" style="position:absolute">';
                $element.html(html);
                $compile($element.contents())($scope);

                var data = Friends.cancelRequest($scope.user._id, $scope.profileuser._id);
                //console.log('data----------->', data)
                data.then(function(data){
                    //console.log('data123--------->', data)
                    if(data.data){
                         var html ='<cancelrequest><button  ng-click="frndaddrequest(\''+id+'\')"  class="btn btn-primary">AddFriend</button></cancelrequest>';
                         var e =$compile(html)($scope);
                         $element.replaceWith(e);
                         $route.reload();
                    }else{
                         var html ='<b>unable to process</b>';
                         var e =$compile(html)($scope);
                         $element.replaceWith(e);
                         $route.reload();
                    }
                });

               }
         }
    };
})

.directive('acceptreject', function ($compile, CurrentUser, Restangular,$route, $routeParams,Friends, friendsActivity) {
    return {
        restrict: 'E',
        replace: true,
        link: function (scope, element, attrs) {},
        controller:function($scope, $element, $attrs, $transclude){

            $scope.acceptrequest = function(cuserid, puserid){

                var navbar_request = false;
                if(typeof cuserid === 'undefined' || typeof puserid === 'undefined'){
                    cuserid = $scope.user._id;
                    puserid = $scope.profileuser._id;
                }else{
                    navbar_request = true;
                }

                var html = '<image src="/static/app/images/pleasewait.gif" alt="no image found" style="position:absolute">';
                $element.html(html);
                $compile($element.contents())($scope);

                 var data = Friends.acceptRequest(cuserid, puserid);
                //console.log('data----------->', data)
                data.then(function(data){
                    //console.log('data123--------->', data)
                    if(data.data){
                         if(navbar_request){
                            var html = '<b> friends </b>';
                         }else{
                            html ='<unaddfriend><button ng-click="friendunfriend()" class="btn btn-primary">unfriend</button></unaddfriend>';
                         }

                         e =$compile(html)($scope);
                         $element.replaceWith(e);
                         $route.reload();
                    }else{
                         var html ='<b>unable to process</b>';
                         var e =$compile(html)($scope);
                         $element.replaceWith(e);
                         $route.reload();
                    }
                });
            }

            $scope.rejectrequest = function(cuserid, puserid){
                var navbar_request = false;
                if(typeof cuserid === 'undefined' || typeof puserid === 'undefined'){
                    cuserid = $scope.user._id;
                    puserid = $scope.profileuser._id;
                }else{
                    navbar_request = true;
                }
                var html = '<image src="/static/app/images/pleasewait.gif" alt="no image found" style="position:absolute">';
                $element.html(html);
                $compile($element.contents())($scope);
                var data = Friends.rejectRequest(cuserid, puserid);
                //console.log('data----------->', data)
                data.then(function(data){
                   // console.log('data123--------->', data)
                    if(data.data){
                        if(navbar_request){
                            var html = '<b>rejected</b>';
                        }else{
                            var  html ='<cancelrequest><button ng-click="frndaddrequest()" class="btn btn-primary">AddFriend</button></cancelrequest>';
                        }

                         var e =$compile(html)($scope);
                         $element.replaceWith(e);
                         $route.reload();
                    }else{
                         var html ='<b>unable to process</b>';
                         e =$compile(html)($scope);
                         $element.replaceWith(e);
                         $route.reload();
                    }
                });

            }
        }
    };
})
.directive('unaddfriend', function ($compile, CurrentUser, Restangular, $routeParams, Friends, friendsActivity,$route) {
    return {
        restrict: 'E',
        replace: true,
        link: function ($scope, element, attrs) {},
        controller:function($scope, $element, $attrs, $transclude){

        $scope.friendunfriend = function(id){

                var html = '<image src="/static/app/images/pleasewait.gif" alt="no image found" style="position:absolute">';
                $element.html(html);
                $compile($element.contents())($scope);

                var data = Friends.unFreind($scope.user._id, $scope.profileuser._id);
                //console.log('data----------->', data)
                data.then(function(data){
                    //console.log('data123--------->', data)
                    if(data.data){
                         var html ='<cancelrequest><button ng-click="frndaddrequest(\''+id+'\')" class="btn btn-primary">AddFriend</button></cancelrequest>';
                         var e =$compile(html)($scope);
                         $element.replaceWith(e);
                         $route.reload();
                    }else{
                         var html ='<b>unable to process</b>';
                         var e =$compile(html)($scope);
                         $element.replaceWith(e);
                         $route.reload();
                    }
                });
               }
            }
    };
});
