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
                                            $location,$http,Restangular,ChatActivity, $window,UserService,
                                            CurrentUser1,SearchActivity,FriendsNotific,friendsActivity,$socket) {
    //$scope.data = CurrentUser1;
    /*$timeout(function(){
        console.log($scope.data)
    }, 10000);*/

    $scope.selectedState = "Massachusetts";
    $scope.states = ["Alabama","Alaska","Arizona","Arkansas",
                        "California","Colorado","Connecticut","Delaware",
                        "Florida","Georgia","Hawaii","Idaho","Illinois","Indiana",
                        "Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland",
                        "Massachusetts","Michigan","Minnesota","Mississippi","Missouri",
                        "Montana","Nebraska","Nevada","New Hampshire","New Jersey",
                        "New Mexico","New York","North Dakota","North Carolina","Ohio",
                        "Oklahoma","Oregon","Pennsylvania","Rhode Island",
                        "South Carolina","South Dakota","Tennessee","Texas",
                        "Utah","Vermont","Virginia","Washington","West Virginia",
                        "Wisconsin","Wyoming"
                     ];


    $scope.instancesearch = new InstanceSearch();

    $scope.testingsearch = function(){
       $scope.instancesearch.getInstancePeoples(this.InstanceSearchQuery)
        $scope.testing = 'dddddddddddd'
    }

    $scope.UserService = UserService
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

            $socket.emit('connecting', {id:user._id});

             // Listening to an event
            $socket.on('joiningstatus', function(data) {
                console.log(data)
            });

        // popup notifications code
            $scope.menuOpened = false;
            $scope.notificationOpened = false;
            $scope.notificationMenu = function(event) {
                $scope.notificationOpened = !($scope.notificationOpened);
                event.stopPropagation();
            };

            $scope.menuMenu = function(event) {
                $scope.menuOpened = !($scope.menuOpened);
                event.stopPropagation();
            };
            //console.log($window)

            $window.onclick = function() {
                if ($scope.menuOpened) {
                  $scope.menuOpened = false;
                  //console.log("------------------------------------------------")

                // You should let angular know about the update that you have made, so that it can refresh the UI
                  $scope.$apply();
                }

                if ($scope.notificationOpened) {
                  $scope.notificationOpened = false;

                // You should let angular know about the update that you have made, so that it can refresh the UI
                  $scope.$apply();
                }

            };
        // end of popup notifications

        $scope.searchActivity = new SearchActivity($scope.currentUser)
        $scope.loadSearchHistory = function(){
            $scope.searchActivity.getMysearches();
        }

        var requested_peoples = [];
        var accepted_peoples = [];

        function get_friend_notifications(currentUser){

            var notific = new FriendsNotific(currentUser);
            notific.then(function(data){

                    accepted_peoples = [];
                    var currentuser = data
                    var k = null;
                    for (k in currentuser.notifications){
                        if(currentuser.notifications[k].seen == false){
                            requested_peoples.push(currentuser.notifications[k].friend_id)
                        }
                    }

                    k= null;
                    for (k in currentuser.accept_notifications){
                        if(currentuser.accept_notifications[k].seen == false){
                            accepted_peoples.push(currentuser.accept_notifications[k].accepted_id)
                        }
                    }


                    if(requested_peoples.length+accepted_peoples.length > 0){
                        if(!(currentUser.all_seen)){
                            $scope.newnotific = requested_peoples.length+accepted_peoples.length
                        }else{
                            $scope.newnotific = null;
                        }
                    }else{
                        $scope.newnotific = null;
                    }
            });
        }

        function getMatchButtonNotific(currentuser){
            //currentuser.MatchedPeopleNotificCount.length)
            //console.log(currentuser)
            $scope.unseenMnotific = []
            $scope.matchnotifications = currentuser.matchnotifications
            console.log('unseeen')
            for(var temp in currentuser.matchnotifications){
                if(currentuser.matchnotifications[temp].seen == false){
                    $scope.unseenMnotific.push(currentuser.matchnotifications[temp])
                }
            }

            /*$scope.MatchButtonNotific = currentuser.MatchedPeopleNotificCount.length;

            $scope.MatchButtonNotifications = currentuser.MatchedPeopleNotifications;

            //console.log('------------before sort')
            //console.log(currentuser.MatchedPeopleNotifications)

            currentuser.MatchedPeopleNotifications.sort(function(a,b) {
                return new Date(a.updated_one).getTime() - new Date(b.updated_one).getTime()
            });

            //console.log('------------after sort-----')
            //console.log(currentuser.MatchedPeopleNotifications)*/
        }


        get_friend_notifications(user);
        getMatchButtonNotific(user);

          $socket.on('FMnotific', function(data){
            //console.log(data)
            /*if(parseInt(data.searchNotific)){
                $scope.searchActivity = new SearchActivity(user);
            }*/

            if(data.data.FMnotific){

                $http.get('/api/me', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': $auth.getToken()
                    }
                }).success(function(user_id) {
                    Restangular.one('people',JSON.parse(user_id)).get({seed: Math.random()})
                    .then(function(user) {
                            get_friend_notifications(user);
                            getMatchButtonNotific(user);
                    });
                });
            }
        });
        $scope.openchatroom = function(id){
                    //console.log('open chat room', id)
                if(!(sessionStorage.getItem(id))){
                    // check room alredy open

                    var json = {};
                    Restangular.one('people', id).get({seed: Math.random()})
                    .then(function(data){
                        //console.log('person deatils')
                       // console.log(data)
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

        $scope.getNewNotifcations = function(){
            //$scope.MatchButtonNotific = null;
            if($scope.newnotific || $scope.MatchButtonNotific){

                $scope.newnotific = null;
                $scope.MatchButtonNotific = null;

                $http.get('/api/me', {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': $auth.getToken()
                    }
                }).success(function(user_id) {
                    Restangular.one('people',JSON.parse(user_id)).get({seed: Math.random()}).then(function(user) {

                            var anotific = [];
                            var reqnotific = [];
                            var k = null;
                            for(k in user.accept_notifications){
                                user.accept_notifications[k].seen = true
                                anotific.push(user.accept_notifications[k].accepted_id)
                            }
                            k = null;
                            for(k in user.notifications){
                                user.notifications[k].seen = true
                                reqnotific.push(user.notifications[k].friend_id)
                            }

                            user.patch(
                            {	'all_seen':true,
                                'accept_notifications':user.accept_notifications,
                                'notifications': user.notifications,
                                'MatchedPeopleNotificCount':[]
                            }
                            ).then(function(data){
                                //console.log('updated accept notifications')
                            });

                            var params = '{"_id": {"$in":["'+(reqnotific).join('", "') + '"'+']}}'
                            Restangular.all('people').getList({
                                where : params,
                                seed: Math.random()
                            }).then(function(response){
                                $scope.rpeoples = response;
                            });

                            var params = '{"_id": {"$in":["'+(anotific).join('", "') + '"'+']}}'
                            Restangular.all('people').getList({
                                where : params,
                                seed: Math.random()
                            }).then(function(resposne){
                                $scope.apeoples = resposne;
                            });

                        });
                    });
               }
         }

            $scope.SeenMatchButton = function(){
               // console.log('clicekd')

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
