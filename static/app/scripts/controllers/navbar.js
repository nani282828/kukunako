'use strict';

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
    .controller('navbarcontroller',function($scope, $auth, CurrentUser, $alert,$rootScope,$timeout,InstanceSearch,
                                            InstanceSearchHistory, PostService, Friends,
                                            $location, $http, Restangular,ChatActivity, $window,UserService,
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

    $scope.instancesearch = new InstanceSearch();

    $scope.testingsearch = function(){
       $scope.instancesearch.getInstancePeoples(this.InstanceSearchQuery);
    }

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
});
