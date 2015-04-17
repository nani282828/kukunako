angular.module('weberApp')
.directive('chatdivdir', function () {
    return {
        restrict: 'A',
        replace: true,


        controller:function($scope, $element, $attrs){

            $scope.chatroomdiv = function(id){
                if($element[0].offsetHeight == 364){+

                    console.log('clicked element==>',$element)

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


.directive('cancelrequest', function ($compile, CurrentUser, Restangular, $routeParams, $route,friendsActivity, Friends) {
    return {
        restrict: 'E',
        replace: true,

        link: function ($scope, element, attrs ) {},
         controller:function($scope, $element, $attrs, $transclude){

         $scope.frndaddrequest = function(id){

                html = '<image src="/static/app/images/pleasewait.gif" alt="no image found" style="position:absolute">';
                $element.html(html);
                $compile($element.contents())($scope);

                var data = Friends.addFriend($scope.user._id, $scope.profileuser._id);

                console.log('data----------->', data)
                data.then(function(data){
                    console.log('data123--------->', data)
                    if(data.data){
                         var html ='<addfriend><button ng-click="frndcancelrequest(\''+id+'\')"  class="btn btn-primary">cancel request</button></addfriend>';
                         e =$compile(html)($scope);
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

.directive('addfriend', function ($compile, CurrentUser, Restangular,$route, $routeParams, friendsActivity, Friends,$route) {

    return {
        restrict: 'E',
        replace: true,
        link: function ($scope, $element, attrs) {},
         controller:function($scope, $element, $attrs, $transclude){
         $scope.frndcancelrequest = function(id){

                html = '<image src="/static/app/images/pleasewait.gif" alt="no image found" style="position:absolute">';
                $element.html(html);
                $compile($element.contents())($scope);

                var data = Friends.cancelRequest($scope.user._id, $scope.profileuser._id);
                console.log('data----------->', data)
                data.then(function(data){
                    console.log('data123--------->', data)
                    if(data.data){
                         var html ='<cancelrequest><button  ng-click="frndaddrequest(\''+id+'\')"  class="btn btn-primary">AddFriend</button></cancelrequest>';
                         e =$compile(html)($scope);
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

                html = '<image src="/static/app/images/pleasewait.gif" alt="no image found" style="position:absolute">';
                $element.html(html);
                $compile($element.contents())($scope);

                 var data = Friends.acceptRequest(cuserid, puserid);
                console.log('data----------->', data)
                data.then(function(data){
                    console.log('data123--------->', data)
                    if(data.data){
                         if(navbar_request){
                            html = '<b> friends </b>'
                         }else{
                            html ='<unaddfriend><button ng-click="friendunfriend()" class="btn btn-primary">unfriend</button></unaddfriend>';
                         }

                         e =$compile(html)($scope);
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
                console.log('data----------->', data)
                data.then(function(data){
                    console.log('data123--------->', data)
                    if(data.data){
                        if(navbar_request){
                            html = '<b>rejected</b>'
                        }else{
                            html ='<cancelrequest><button ng-click="frndaddrequest()" class="btn btn-primary">AddFriend</button></cancelrequest>';
                        }

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