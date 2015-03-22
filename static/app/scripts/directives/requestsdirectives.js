angular.module('weberApp')
.directive('chatdivdir', function () {
    return {
        restrict: 'A',
        replace: true,


        controller:function($scope, $element, $attrs){

            $scope.chatroomdiv = function(id){
                if($element[0].offsetHeight == 364){
                   //console.log($element)
                   $element.css('height', '40px')
                    var data = JSON.parse(sessionStorage.getItem(id))
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
                    $element.css('height', '364px')
                    $scope.chatdivnotification = [];
                    var data = JSON.parse(sessionStorage.getItem(id))
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


.directive('cancelrequest', function ($compile, CurrentUser, Restangular, $routeParams, $route,friendsActivity) {
    return {
        restrict: 'E',
        replace: true,

        link: function ($scope, element, attrs ) {},
         controller:function($scope, $element, $attrs, $transclude){

         $scope.frndaddrequest = function(id){

                html = '<image src="/static/app/images/pleasewait.gif" alt="no image found" style="position:absolute">';
                $element.html(html);
                $compile($element.contents())($scope);


                var currentuserobj = new CurrentUser();
                currentuserobj.getUserId().then(function(){
                currentuserobj.getCUserDetails(currentuserobj.userId).then(function(user){
                        var user_obj = Restangular.one('people', id);
                        user_obj.get({ seed : Math.random() }).then(function(profileuser) {

                            //console.log('-----------check in friends user--------')
                            $scope.friendsactivity = new friendsActivity(user, profileuser)
                            f_status = $scope.friendsactivity.checkInFriends()

                            if(f_status.pf_status && f_status.cf_status){
                                var html ='<b>alredy friends please reload page</b>';
                                e =$compile(html)($scope);
                                $element.replaceWith(e);

                            }else if((!(f_status.pf_status)&& f_status.cf_status)
                                                    ||
                                    (!(f_status.cf_status) && f_status.pf_status)){

                                    $scope.friendsactivity.removeFriends('addfriend').then(function(){
                                        console.log('remove friends add request sent')
                                        var html ='<addfriend><button ng-click="frndcancelrequest(\''+id+'\')" class="btn btn-primary" >cancel request</button></addfriend>';
                                        e =$compile(html)($scope);
                                        $element.replaceWith(e);

                                    });
                            }else if(!(f_status.pf_status && f_status.cf_status )){

                                n_status = $scope.friendsactivity.checkInNotifcations()
                                    if(n_status.pn_status){
                                        var html ='<b>alredy reqeust sent please reload page</b>';
                                        e =$compile(html)($scope);
                                        $element.replaceWith(e);
                                    }else if(n_status.cn_status){
                                        var html ='<b>accept request first please reload page </b>';
                                        e =$compile(html)($scope);
                                        $element.replaceWith(e);
                                    }else{
                                        $scope.temps = $scope.friendsactivity.AddFriend();
                                        $scope.temps.then(function(data){
                                            var html ='<addfriend><button ng-click="frndcancelrequest(\''+id+'\')"  class="btn btn-primary">cancel request</button></addfriend>';
                                            e =$compile(html)($scope);
                                            $element.replaceWith(e);
                                        });

                                    }



                            }else
                                console.log('nothing to done in add friend request')
                        });
                   });
                });
            }
         }

    };
})

.directive('addfriend', function ($compile, CurrentUser, Restangular, $routeParams, friendsActivity, $route) {
    return {
        restrict: 'E',
        replace: true,
        link: function ($scope, $element, attrs) {},
         controller:function($scope, $element, $attrs, $transclude){
         $scope.frndcancelrequest = function(id){

                html = '<image src="/static/app/images/pleasewait.gif" alt="no image found" style="position:absolute">';
                $element.html(html);
                $compile($element.contents())($scope);

               var currentuserobj = new CurrentUser();
               currentuserobj.getUserId().then(function(){
                   currentuserobj.getCUserDetails(currentuserobj.userId).then(function(user){
                        var user_obj = Restangular.one('people', id);
		                user_obj.get({ seed : Math.random() }).then(function(profileuser) {

                         $scope.friendsactivity = new friendsActivity(user, profileuser)

		                 var n_status = $scope.friendsactivity.checkInNotifcations();
                         $scope.currentuser = user;

                         if(n_status.cn_status && n_status.pn_status){
                             $scope.friendsactivity.removeCnotifcations();
                             $scope.friendsactivity.then(function(response){
                                    console.log('remove notifcations at profile user')
                                    html ='<cancelrequest><button  ng-click="frndaddrequest(\''+id+'\')"  class="btn btn-primary">AddFriend</button></cancelrequest>';
                                    e =$compile(html)($scope);
                                    $element.replaceWith(e);
                             });

                         }else if(n_status.pn_status){
                                var data = $scope.friendsactivity.removePnotifcations();
                                data.then(function(response){
                                    console.log('remove notifcations at profile user')
                                    html ='<cancelrequest><button  ng-click="frndaddrequest(\''+id+'\')"  class="btn btn-primary">AddFriend</button></cancelrequest>';
                                    e =$compile(html)($scope);
                                    $element.replaceWith(e);
                                });

                            }else if(n_status.cn_status){
                                var data = $scope.friendsactivity.removeCnotifcations();
                                data.then(function(response){
                                    console.log('remove notifcations at current user')
                                    html ='<cancelrequest><button ng-click="frndaddrequest(\''+id+'\')"  class="btn btn-primary">AddFriend</button></cancelrequest>';
                                    e =$compile(html)($scope);
                                    $element.replaceWith(e);
                                });
                            }

                           else {
                                var html ='<b>bad request please reload page</b>';
                                e =$compile(html)($scope);
                                $element.replaceWith(e);
                            }
		                });
                   });
               });
               }

            }
    };
})
.directive('acceptreject', function ($compile, CurrentUser, Restangular, $routeParams, friendsActivity) {
    return {
        restrict: 'E',
        replace: true,
        link: function (scope, element, attrs) {},
        controller:function($scope, $element, $attrs, $transclude){

            $scope.acceptrequest = function(id,view){

                if(view == 'navbarview')
                    $routeParams.username = id;


                html = '<image src="/static/app/images/pleasewait.gif" alt="no image found" style="position:absolute">';
                $element.html(html);
                $compile($element.contents())($scope);

                var currentuserobj = new CurrentUser();
                    currentuserobj.getUserId().then(function(){
                    currentuserobj.getCUserDetails(currentuserobj.userId)
                        .then(function(user){
                            $scope.currentuser = user;
                             var user_obj = Restangular.one('people', $routeParams.username);
                             user_obj.get({ seed : Math.random() }).then(function(profileuser) {

                                $scope.friendsactivity = new friendsActivity(user, profileuser)
                                var n_status = $scope.friendsactivity.checkInNotifcations()

                                if(n_status.cn_status){

                                    var data = $scope.friendsactivity.accept_request();
                                    data.then(function(response){
                                        if(view == 'navbarview'){
                                            html ='<b>friends</b>';
                                            e =$compile(html)($scope);
                                            $element.replaceWith(e);
                                        }else{
                                            html ='<unaddfriend><button ng-click="friendunfriend(\''+id+'\')" class="btn btn-primary">unfriend</button></unaddfriend>';
                                            e =$compile(html)($scope);
                                            $element.replaceWith(e);
                                        }
                                    });

                                }else{
                                    html ='<b>send request cancelled by your friend</b>';
                                    e =$compile(html)($scope);
                                    $element.replaceWith(e);
                                }

                            });
                        });
                    });
            }

            $scope.rejectrequest = function(id, view){

                if(view == 'navbarview'){
                    console.log('yes in nav bar view')
                    $routeParams.username = id;
                }

                html = '<image src="/static/app/images/pleasewait.gif" alt="no image found" style="position:absolute">';
                $element.html(html);
                $compile($element.contents())($scope);
                var currentuserobj = new CurrentUser();
                    currentuserobj.getUserId().then(function(){
                    currentuserobj.getCUserDetails(currentuserobj.userId)
                        .then(function(user){

                         var user_obj = Restangular.one('people', $routeParams.username);
                             user_obj.get({ seed : Math.random() }).then(function(profileuser) {

                            $scope.friendsactivity = new friendsActivity(user, profileuser)
                            var n_status = $scope.friendsactivity.checkInNotifcations();
                            $scope.currentuser = user;

                            if(n_status.cn_status && n_status.pn_status){

                                $scope.friendsactivity.removeCnotifcations();

                                var data = $scope.friendsactivity.removePnotifcations();
                                data.then(function(response){
                                    if(view == 'navbarview'){
                                        console.log('navbarview')
                                        html ='<b>rejected</b>';
                                        e =$compile(html)($scope);
                                        $element.replaceWith(e);

                                    }else{

                                        console.log('userprofileview')
                                        html ='<cancelrequest><button ng-click="frndaddrequest(\''+id+'\')" class="btn btn-primary">AddFriend</button></cancelrequest>';
                                        e =$compile(html)($scope);
                                        $element.replaceWith(e);
                                    }
                                });


                            }
                            else if(n_status.cn_status){
                                var data = $scope.friendsactivity.removeCnotifcations();
                                data.then(function(response){
                                    if(view == 'navbarview'){
                                        console.log('navbarview')
                                        html ='<b>rejected</b>';
                                        e =$compile(html)($scope);
                                        $element.replaceWith(e);

                                    }else{

                                        console.log('userprofileview')
                                        html ='<cancelrequest><button ng-click="AddFriend()" class="btn btn-primary">AddFriend</button></cancelrequest>';
                                        e =$compile(html)($scope);
                                        $element.replaceWith(e);
                                    }
                                });
                            }

                            else if(n_status.pn_status){
                                $scope.rf = friendsactivity.removePnotifcations();
                                $scope.rf.then(function(response){
                                    if(view == 'navbarview'){
                                    console.log('navbarview')
                                    html ='<b>rejected</b>';
                                    e =$compile(html)($scope);
                                    $element.replaceWith(e);

                                }else{

                                    console.log('userprofileview')
                                    html ='<cancelrequest><button ng-click="AddFriend()" class="btn btn-primary">AddFriend</button></cancelrequest>';
                                    e =$compile(html)($scope);
                                    $element.replaceWith(e);
                                }
                                });
                            }else {
                                html ='<b>sent request cancelled by your friend</b>';
                                e =$compile(html)($scope);
                                $element.replaceWith(e);

                            }

                         });

                        });
                    });
            }
        }
    };
})
.directive('unaddfriend', function ($compile, CurrentUser, Restangular, $routeParams, friendsActivity,$route) {
    return {
        restrict: 'E',
        replace: true,
        link: function ($scope, element, attrs) {},
        controller:function($scope, $element, $attrs, $transclude){

        $scope.friendunfriend = function(id){

                html = '<image src="/static/app/images/pleasewait.gif" alt="no image found" style="position:absolute">';
                $element.html(html);
                $compile($element.contents())($scope);

               var currentuserobj = new CurrentUser();
               currentuserobj.getUserId().then(function(){

                   currentuserobj.getCUserDetails(currentuserobj.userId).then(function(user){
                        var user_obj = Restangular.one('people', id);

		                user_obj.get({ seed : Math.random() }).then(function(profileuser) {
                            $scope.friendsactivity = new friendsActivity(user, profileuser)
                            var f_status = $scope.friendsactivity.checkInFriends();
                            console.log(f_status)

                            if(f_status.pf_status && f_status.cf_status){

                                var data = $scope.friendsactivity.unfriend();
                                data.then(function(data){
                                    html ='<cancelrequest><button ng-click="frndaddrequest(\''+id+'\')" class="btn btn-primary">AddFriend</button></cancelrequest>';
                                    e =$compile(html)($scope);
                                    $element.replaceWith(e);
                                });
                            }else if(f_status.pf_status){
                                var data = $scope.friendsactivity.remove_pfriends();
                                data.then(function(data){
                                    html ='<cancelrequest><button ng-click="frndaddrequest(\''+id+'\')" class="btn btn-primary">AddFriend</button></cancelrequest>';
                                    e =$compile(html)($scope);
                                    $element.replaceWith(e);
                                });

                            }else if(f_status.cf_status){
                                var data = $scope.friendsactivity.remove_cfriends();
                                data.then(function(data){
                                    html ='<cancelrequest><button ng-click="frndcancelrequest(\''+id+'\')" class="btn btn-primary">AddFriend</button></cancelrequest>';
                                    e =$compile(html)($scope);
                                    $element.replaceWith(e);
                                });

                            }else{
                                var html ='<b>bad request please reload page</b>';
                                e =$compile(html)($scope);
                                $element.replaceWith(e);
                            }

		                });
                   });
               });
               }
            }




    };
})
.directive('matchmeunfriend', function ($compile, CurrentUser, Restangular, $routeParams, friendsActivity,$route) {
    return {
        restrict: 'A',
        replace: true,
        link: function ($scope, element, attrs) {},
        controller:function($scope, $element, $attrs, $transclude){



        $scope.matchmeunfriend = function(id) {

               html = '<image src="/static/app/images/pleasewait.gif" alt="no image found" style="position:absolute">';
               $element.html(html);
               $compile($element.contents())($scope);

               var currentuserobj = new CurrentUser();
               currentuserobj.getUserId().then(function(){
                   currentuserobj.getCUserDetails(currentuserobj.userId).then(function(user){
                        var user_obj = Restangular.one('people',id);
		                user_obj.get({ seed : Math.random() }).then(function(profileuser) {

                            $scope.friendsactivity = new friendsActivity(user, profileuser)
                            var f_status = $scope.friendsactivity.checkInFriends();

                            if(f_status.pf_status && f_status.cf_status){

                                var data = $scope.friendsactivity.unfriend();
                                data.then(function(data){
                                    html ='<cancelrequest><button ng-click="AddFriend()" class="btn btn-primary" ng-click="frndcancelrequest("'+id+'")">AddFriend</button></cancelrequest>';
                                    e =$compile(html)($scope);
                                    $element.replaceWith(e);
                                });

                            }else if(f_status.pf_status){
                                var data = $scope.friendsactivity.remove_pfriends();
                                data.then(function(data){
                                    html ='<cancelrequest><button ng-click="AddFriend()" class="btn btn-primary" ng-click="frndcancelrequest("'+id+'")">AddFriend</button></cancelrequest>';
                                    e =$compile(html)($scope);
                                    $element.replaceWith(e);
                                });

                            }else if(f_status.cf_status){
                                var data = $scope.friendsactivity.remove_cfriends();
                                data.then(function(data){
                                    html ='<cancelrequest><button ng-click="AddFriend()" class="btn btn-primary" ng-click="frndcancelrequest("'+id+'")">AddFriend</button></cancelrequest>';
                                    e =$compile(html)($scope);
                                    $element.replaceWith(e);
                                });

                            }else{
                                console.log('nothing to done')
                            }

		                });
                   });
               });
            }
        }

    };
});