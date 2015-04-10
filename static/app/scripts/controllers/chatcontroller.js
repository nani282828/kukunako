angular.module('weberApp')
.controller('chatbarcontroller', function($scope, $auth, CurrentUser1,$socket,UserService,
                                          $http,$rootScope,SearchActivity,FriendsNotific,
                                          $document, Restangular,ChatActivity){




    //updating the chat div height using below code please put it
    $scope.get_screen_height = window.innerHeight-52;
    $scope.get_inner_div_height = (window.innerHeight-210)/2;
    $scope.UserService = UserService;
    //console.log($scope.get_screen_height)
    //console.log($scope.get_inner_div_height)

    // -----nav bar methods-----
    // nav search bar methods
     $http.get('/api/me', {
            headers: {
                'Content-Type': 'application/json'
            }
    }).success(function(userId) {

            // popup notifications code
            $scope.chat_message_Opened = false;
            $scope.chat_message_Menu = function(event) {
                $scope.chat_message_Opened = !($scope.chat_message_Opened);
                event.stopPropagation();
            };

            window.onclick = function() {
                if ($scope.chat_message_Opened) {
                    $scope.chat_message_Opened = false;
                // You should let angular know about the update that you have made, so that it can refresh the UI
                  $scope.$apply();
                }
            };
            // popup notitications code end

            var date = new Date()
            this.userId = userId;
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
                        console.log('successfully joined into room');
                    }
                });

                $socket.on('receive_messages', function(msg) {

                    console.log('message received')
                    new_message = {}

                    var details = JSON.parse(sessionStorage.getItem(msg.senderid));

                    if(user._id == msg.senderid){

                    }
                    else if(user._id != msg.senderid){
                        //console.log('yes from receiver')
                        // no chat rooms opened push message into latest Notifications
                        if(sessionStorage.getItem(msg.senderid) == null){
                           // console.log('no chat div opened')
                            $rootScope.chatactivity.pushLatestMessage(msg)
                            console.log('pushed message.........')
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
                                $scope.chatdivnotification.push({ id:msg.senderid,message: true})
                         }


                          $rootScope.chatactivity.pushMessage(msg.senderid, new_message);
                          console.log('elese message pushed')

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
                            $scope.chatdivnotification.splice(k,1)
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




                    //document.getElementById("send_"+Recept).value="";

                }

                var getValue = function(){
                    return sessionStorage.length;
                }

                var getData = function(){
                  console.log('---------session data--------')
                  console.log(sessionStorage)

                  var json = [];

                  $.each(sessionStorage, function(i, v){
                    if(sessionStorage.hasOwnProperty(i)){
                        console.log('attrib==>', i ,'value==>',v)
                        json.push(angular.fromJson(v));
                     }
                  });

                  console.log(json)
                  return json;
                }

                 function loadintodivs(){

                    var chatrooms = getData();

                    console.log('chat room opened previously', chatrooms)
                    for(k in  chatrooms){
                        //console.log(chatrooms[k])
                        $rootScope.chatactivity.loadMessages(user._id, chatrooms[k].id, chatrooms[k]);
                   }

                }


                 // opens new chat room
                 $scope.openchatroom = function(id){
                    //$scope.addToConversations(id);
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
                            $rootScope.chatactivity.messages.splice(k,1)
                        }
                    }

                    for(var i in $rootScope.chatactivity.pages){
                        if($rootScope.chatactivity.pages[i].id == id){
                            $rootScope.chatactivity.pages.splice(k,1)
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
                             return true
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
                $scope.chatactivity.nextPage($element[0].id)
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
      /*scope.$watchCollection(attr.scroll, function(newVal) {
        $timeout(function() {
         console.log('time out')
         console.log(element[0].scrollTop)
         console.log(element[0].scrollHeight)
         element[0].scrollTop = element[0].scrollHeight;
         console.log(element[0].scrollTop)
        });*/
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
});