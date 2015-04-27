angular.module('weberApp')

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
