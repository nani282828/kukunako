angular.module('weberApp')
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
               Restangular.one('people', this.currentuser._id).patch({
                   conversations : this.currentuser.conversations
               },{},{
                        'Content-Type': 'application/json',
                        'If-Match': this._etag,
                        'Authorization': $auth.getToken()
               }).then(function(data){
                   //console.log('successfully inserted into conversations')
                   //console.log(data)
                   this._etag = data._etag;
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
            //console.log(user1, user2, roomdetails)
            //console.log('load messages calling----------------------')
            var self = this;
            this.busy = true;
            var page = null;
            var key = null;

            self.main_params =  '{ "$or" : ['+
                    '{ "$and" : [ { "sender" : "'+user1+'" }, { "receiver" : "'+user2+'" } ] },'+
                    '{ "$and" : [ { "sender" : "'+user2+'" }, { "receiver": "'+user1+'" }  ] }'+
                ']}';

            self.embedded_param = '{"sender":1,"receiver":1}';
            //console.log('------------open id pages-------------')
            //console.log(self.pages)
            var data = getKey_Pages(self.pages, user2);
            page = data.pageinfo;
            key = data.key;
            // find and increment pages count of different chatrooms



            Restangular.all('messages').getList({
                where:self.main_params,
                embedded:self.embedded_param,
                seed:Math.random(),
                max_results: 10,
                page:page.page,
                sort: '[("message_created",-1)]',
            }).then(function(response){

                //console.log('loading messages at service')
				if (response.length < 10) {
					page.end = true;
				}

				self.messages.push.apply(self.messages,[{id:user2,details:roomdetails,messages:response}]);
				self.busy = false;
				page.page = page.page+1;
				self.pages[key] = page;
				//console.log('-------page----------')
                //console.log(self.pages)

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

		    //console.log(this.messages)
		    //console.log('chat next ')


			if (this.busy | this.end) return;

			var self = this;

			self.busy = true;
            var page = null;
            var key = null;

            var data = getKey_Pages(self.pages, user2)
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
                //self.messages.push.apply(self.messages,[{id:user2,details:roomdetails,messages:response}]);
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
    })

    //--------------------------------------------------------- setting services------------------------------------->
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
	}])

	//-------------------------------weber services ---------------------------------------

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
	})

	//--------------------------------friend requests service-----------------------------------

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
	})

	//-------------------------------------requested all directives-----------------------------------------

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

                html = '<image src="/static/app/images/pleasewait.gif" alt="no image found" style="position:absolute">';
                $element.html(html);
                $compile($element.contents())($scope);

                var data = Friends.addFriend($scope.user._id, $scope.profileuser._id);

                //console.log('data----------->', data)
                data.then(function(data){
                   // console.log('data123--------->', data)
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
                //console.log('data----------->', data)
                data.then(function(data){
                    //console.log('data123--------->', data)
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
                //console.log('data----------->', data)
                data.then(function(data){
                    //console.log('data123--------->', data)
                    if(data.data){
                         if(navbar_request){
                            html = '<b> friends </b>';
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
                //console.log('data----------->', data)
                data.then(function(data){
                   // console.log('data123--------->', data)
                    if(data.data){
                        if(navbar_request){
                            html = '<b>rejected</b>';
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
                //console.log('data----------->', data)
                data.then(function(data){
                    //console.log('data123--------->', data)
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
});