'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:WeberSearchCtrl
 * @description
 * # WeberSearchCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
    .controller('WeberSearchCtrl', function($scope, $auth, Restangular,
	 										InfinitePosts, $alert, $http,$location,$socket,
	 										CurrentUser, UserService,CurrentUser1,$rootScope,
	 										SearchActivity, $routeParams, MatchMeResults) {
	 	$scope.searched = false;
	 	$scope.searchBusy = false;


	 	$scope.tags = [];

        for(var i=0; i<$scope.tags.length; i++){
            console.log($scope.tags[i])
        }

        $scope.loadTags = function(query) {
        //return $http.get('/tags?query=' + query);
        };

        $scope.tagAdded = function(tag) {
            console.log('Tag added: ', tag.text);
            console.log($scope.tags)
        };

        $scope.tagRemoved = function(tag) {
            console.log('Tag removed: ', tag);
            console.log($scope.tags)
        };


	 	/* login functionality code goes here*/
        $scope.submitLogin = function() {
			$auth.login({
				email: this.login_email,
				password: this.login_password
			}).then(function(response) {
				$auth.setToken(response.data.token);
				$rootScope.isloggin = true;
				$location.path('/home');
			}, function(error) {
                console.log(error.data.error)
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
                var interests = []
                var querystring = "";
                for(var temp in $scope.tags){
                    interests.push($scope.tags[temp].text.toString())
                    querystring = querystring+$scope.tags[temp].text+" ";
                }
                console.log('querystring==>', querystring)

                 $http.get('/api/similarwords',
                    {
                        headers:{'Content-Type':'application/json'},
                        params : {querystring: querystring.toString() }
                    }).success(function(interestsSimilarWords) {
                        console.log('successdata', interestsSimilarWords)
                        var data = ['d','i','dd']
                        $scope.signupBusy = $auth.signup({
                            email: self.formData.email,
                            password: self.formData.password,
                            firstname: self.formData.firstname,
                            lastname: self.formData.lastname,
                            username: self.formData.firstname + self.formData.lastname,
                            gender: self.formData.gender,
                            interests: interests,
                            interestsimilarwords: interestsSimilarWords
                        }).then(function (response) {
                            console.log('response data', response.data);
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
                    console.log('open chat room', id)
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
                console.log('no user and yes search text')
                $scope.currentuserobj = new CurrentUser();
                $scope.currentuserobj.getUserId()
                .then(function(){
                    if($scope.currentuserobj.userId != 'undefined'){
                        $scope.currentuserobj.getCUserDetails($scope.currentuserobj.userId)
                        .then(function(user){
                           $scope.user = user;
                           $scope.searchActivity = new SearchActivity(user)
                           var res = $scope.searchActivity.getSimilarWords(searchText)
                           res.then(function(data){
                                $scope.searchActivity.addSearchText(searchText, data.data);
                           });
                        });
                    };
                });
            }else if(($scope.user) && searchText){
                console.log('yes user and search text')
                $scope.searchActivity = new SearchActivity($scope.user)

                var res = $scope.searchActivity.getSimilarWords(searchText)
                res.then(function(data){
                    //console.log(data.data)
                    $scope.searchActivity.addSearchText(searchText, data.data);
                })

                //
            }else{
                console.log('nothing to do')
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
                    console.log('open chat room')
                    if(!(sessionStorage.getItem(id))){
                        // check room alredy open

                        var json = {};
                        Restangular.one('people', id).get({seed: Math.random()})
                        .then(function(data){
                            console.log('person deatils')
                            console.log(data)
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

        /*$scope.perfomSearch = function(){

            $scope.showNoResults = !($scope.showNoResults);

            if($scope.query && ($routeParams.query == $scope.query)){
                //$scope.matchResults = new MatchMeResults($scope.query);
            }else if($scope.query){

                if (!($auth.isAuthenticated())) {
                    $routeParams.query = $scope.query;
                    $location.path('search/' + $routeParams.query);

                }
                else {
                    $routeParams.query = $scope.query;
                    $location.search('query',  + $routeParams.query);

                }

                

            }
            else{
                //$scope.query = '';
                //$scope.matchResults.mresults = null;
            }
        }*/

	})



    /*$scope.loadNewResullts = function(searchId){
        var matchResults = new MatchMeResults();
        matchResults.getMatchedNewResults(searchId).then(function() {
                $scope.matchmeresults = matchResults;
        });
    };*/


	/*.directive('myDirective', function(){
            return function(scope, element, attrib){
            element.bind('click', function(){
                //scope.loadNewResullts(element[0].id);
                //$('#notific'+element[0].id).css({"display":"none"});
            });
        };
    })*/

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
