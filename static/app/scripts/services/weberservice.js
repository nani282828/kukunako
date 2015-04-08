'use strict';
/**
 * @ngdoc service
 * @name weberApp.weberService
 * @description
 * # weberService
 * Service in the weberApp.
 */
angular.module('weberApp')
	.filter('highlight', function($sce) {
		return function(text, phrase) {
			if (phrase) text = text.replace(new RegExp('(' + phrase + ')', 'gi'),
				'<span class="highlighted">$1</span>');
			return $sce.trustAsHtml(text);
		};
	})

    /*.factory('socket', function(){
        var socket =

    })*/
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
                    console.log(self.InstancesearchResult)
                }.bind(self));
            }else{
                self.InstancesearchResult = []
            }

        };

        InstanceSearch.prototype.nextPage = function() {
            console.log('next page')
            console.log(this.busy, this.end)
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
				console.log(self.InstancesearchResult)
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

		/*this.deleteFromIList = function(userId, postId){
		    var userNotifications = this.get(userId).MatchedPeopleNotifications;
		    for(var temp in userNotifications){
		        if(userNotifications[temp].postid == postId &&
		        userNotifications[temp].interestedList.indexOf(userId) !== -1){
		            userNotifications[temp].interestedList.splice(userNotifications[temp].interestedList.indexOf(userId),1)
		        }
		    }
		    //console.log('user==>',this.get(userId))
		}

		this.PushToIList = function(userId, postId){
		    var userNotifications = this.get(userId).MatchedPeopleNotifications;
		    for(var temp in userNotifications){
                //console.log('usenotifications==>', userNotifications[temp])
		        if(userNotifications[temp].postid == postId &&
		        userNotifications[temp].interestedList.indexOf(userId) === -1){
		            userNotifications[temp].interestedList.push(userId);
		        }
		    }

		}*/

	})
	.service('MatchButtonService', function($http, Restangular, CurrentUser1) {
		this.checkMatchUnMatch = function(post, user) {
		     //console.log('interestedlist==>', post.interestedPeople.interestedlist,'userid==>', user._id)
		     //console.log(post.interestedPeople.hasOwnProperty('interestedlist'))
             if(post.interestedPeople.hasOwnProperty('interestedlist')
                            &&
                post.interestedPeople.interestedlist.indexOf(user._id) !== -1){
                    return true;
             }else{
                return false;
             }
		};
	})
	.service('PostService', function($http, Restangular) {
		this.posts = [];
        var param1 = '{"author":1}';

		this.get = function(postid) {
		    console.log('postid==>', postid)

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


	}).service('sortIListService', function($http, Restangular,CurrentUser1) {
		this.sendList = function(list){
		    if(list && list.length){
		        for(var temp in list){
    		       if(list[temp] == CurrentUser1.user._id){
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

    .factory('MatchButton', function($http,$auth,$q, Restangular,PostService) {

        var MatchButton = function(user,profileuserid, postid) {
           //console.log('-- at match button-----')
           //console.log(postid)
           this.profileuserid = profileuserid,
           this.user = user,
           this.postid = postid

        }


        MatchButton.prototype.addToInterested = function(){

           var deferred = $q.defer();
           var self = this;

           setTimeout(function() {
               Restangular.one('posts', self.postid).get({seed:Math.random(), embedded:{'author':1}})
                  .then(function(post){
                        if(post.interestedPeople.hasOwnProperty('interestedlist')
                            &&
                            post.interestedPeople.interestedlist.indexOf(self.user._id) == -1){
                            //console.log('insert has property and not in interested list')

                            post.interestedPeople.interestedlist.push(self.user._id)
                            //post.interestedPeople.presentupdated = 10;
                            console.log((post.interestedPeople.lastupdated))
                            post.patch({
                                'interestedPeople':{
                                'interestedlist': post.interestedPeople.interestedlist,
                                'presentupdated' : parseInt(post.interestedPeople.lastupdated)+1,
                                'lastupdated':0
                                }
                            }).then(function(data){
                                console.log('successfully updated interests of post', data)

                                Restangular.one('people', post.author._id).get({seed:Math.random()})
                                .then(function(person){
                                    var check = true;

                                    for(var temp in person.matchnotifications){
                                        if(person.matchnotifications[temp].postid == post._id &&
                                           person.matchnotifications[temp].interestedperson == post.author._id){
                                               check = false;
                                               
                                           }
                                    }

                                    if(check){
                                        //alert('ffffffff')
                                        person.matchnotifications.push({
                                                'postid':post._id,
                                                'interestedperson':self.user._id,
                                                'seen':false
                                            })
                                        var data = person.patch({
                                            'matchnotifications':person.matchnotifications
                                        });
                                        deferred.resolve(data)
                                    }

                                })

                            });
                        }else{
                            post.interestedPeople.interestedlist= [self.user._id]
                            post.interestedPeople.presentupdated = 1;
                            post.interestedPeople.lastupdated = 0;
                            post.patch({
                                'interestedPeople':{
                                    'interestedlist': post.interestedPeople.interestedlist,
                                    'presentupdated' : parseInt(post.interestedPeople.lastupdated)+1,
                                    'lastupdated':0
                                }
                            }).then(function(data){
                                console.log('successfully updated first interest', data)

                                 Restangular.one('people', post.author._id).get({seed:Math.random()})
                                .then(function(person){
                                    var check = true;
                                    for(var temp in person.matchnotifications){
                                        if(person.matchnotifications[temp].postid == post._id &&
                                           person.matchnotifications[temp].interestedperson == post.author._id){
                                               check = false;
                                           }
                                    }
                                    if(check){
                                        //alert('ddd')
                                        person.matchnotifications.push({
                                                'postid':post._id,
                                                'interestedperson':self.user._id,
                                                'seen':false
                                            })

                                        var data = person.patch({
                                           'matchnotifications':person.matchnotifications
                                        });
                                        deferred.resolve(data)
                                    }
                                })
                            });
                        }
                        /*var checkvalue = false;
                         var isPostCreated = false;
                         // if user has alredy matched notifications count
                         if(profileuser.MatchedPeopleNotifications.length !== 0){
                            for(var k in profileuser.MatchedPeopleNotifications){
                                if(profileuser.MatchedPeopleNotifications[k].postid === self.postid){
                                    isPostCreated = true;
                                    if(profileuser.MatchedPeopleNotifications[k].interestedList.indexOf(self.user._id) === -1){
                                        checkvalue = true;
                                        profileuser.MatchedPeopleNotifications[k].interestedList.push(self.user._id)
                                        profileuser.MatchedPeopleNotifications[k].updated_one = new Date()
                                        profileuser.MatchedPeopleNotificCount.push({'postid':self.postid, 'authorid':self.user._id})
                                    }
                                }
                            }

                            // if user interestlist doesn't contains userid
                            if(checkvalue){
                                var data =  profileuser.patch({
                                    'MatchedPeopleNotifications': profileuser.MatchedPeopleNotifications,
                                    'MatchedPeopleNotificCount' : profileuser.MatchedPeopleNotificCount
                                });
                                 deferred.resolve(data);
                            }
                            // if postid doesnot created
                            if(!(isPostCreated)){
                                 var newMatch = {
                                    'postid': self.postid,
                                    'interestedList': [self.user._id],
                                    'updated_one': new Date()
                                }
                                profileuser.MatchedPeopleNotifications.push(newMatch)
                                profileuser.MatchedPeopleNotificCount.push({'postid':self.postid, 'authorid':self.user._id})
                                var data =  profileuser.patch({
                                   'MatchedPeopleNotifications' : profileuser.MatchedPeopleNotifications,
                                   'MatchedPeopleNotificCount' : profileuser.MatchedPeopleNotificCount
                                });
                                deferred.resolve(data)
                            }

                         }
                        // if first match occured to user
                        else{

                            var newMatch = {
                                'postid': self.postid,
                                'interestedList': [self.user._id],
                                'updated_one': new Date()
                            }

                            profileuser.MatchedPeopleNotifications.push(newMatch)
                            profileuser.MatchedPeopleNotificCount.push({'postid':self.postid, 'authorid':self.user._id})
                            var data =  profileuser.patch({
                               'MatchedPeopleNotifications' : profileuser.MatchedPeopleNotifications,
                               'MatchedPeopleNotificCount' : profileuser.MatchedPeopleNotificCount
                            });
                            deferred.resolve(data)
                        }*/
                        //deferred.resolve(post)
                  });




           }, 1000);
           return deferred.promise;
        };


        MatchButton.prototype.DeleteFromInterested = function(){
            var self = this;
            // getting profile user details


           var deferred = $q.defer();
           var self = this;
           setTimeout(function() {
                Restangular.one('posts', self.postid).get({seed:Math.random(), embedded:{'author':1}})
                  .then(function(post){
                        if(post.interestedPeople.hasOwnProperty('interestedlist')
                            &&
                            post.interestedPeople.interestedlist.indexOf(self.user._id) != -1){
                            post.interestedPeople.interestedlist.splice(post.interestedPeople.interestedlist.indexOf(self.user._id),1)
                            post.patch({
                                 'interestedPeople':{
                                    'interestedlist': post.interestedPeople.interestedlist,
                                    'presentupdated' : 0,
                                    'lastupdated':0
                                }
                            }).then(function(data){


                                console.log('successfully updated interests of post')
                                 Restangular.one('people', post.author._id).get({seed:Math.random()})
                                .then(function(person){
                                    var check = false;

                                    for(var temp in person.matchnotifications){
                                        if(person.matchnotifications[temp].postid == post._id &&
                                           person.matchnotifications[temp].interestedperson == post.author._id){
                                               check = true;
                                               person.matchnotifications.splice(temp,1);
                                           }
                                    }

                                    if(check){
                                        var data = person.patch({
                                            'matchnotifications':person.matchnotifications
                                        });
                                        deferred.resolve(data)
                                    }

                                })
                            })
                        }



                /*Restangular.one('people', self.profileuserid).get({seed:Math.random()})
                .then(function(profileuser){
                     var checkvalue = false;

                     if(profileuser.MatchedPeopleNotifications.length !== 0){

                        // remove from MatchedPeopleNotifications list
                        for(var k in profileuser.MatchedPeopleNotifications){
                            if(profileuser.MatchedPeopleNotifications[k].postid === self.postid){
                                //console.log(profileuser.MatchedPeopleNotifications[k])
                                if(profileuser.MatchedPeopleNotifications[k].interestedList.indexOf(self.user._id) !== -1){
                                    checkvalue = true;
                                    var indexvalue = profileuser.MatchedPeopleNotifications[k].interestedList.indexOf(self.user._id)
                                    profileuser.MatchedPeopleNotifications[k].interestedList.splice(indexvalue, 1)

                                }else
                                    console.log('nothing to delete')
                            }
                        }

                        for(var i in profileuser.MatchedPeopleNotificCount){
                            if(profileuser.MatchedPeopleNotificCount[i].postid == self.postid &&
                               profileuser.MatchedPeopleNotificCount[i].authorid == self.user._id){
                                   profileuser.MatchedPeopleNotificCount.splice(i,1)
                               }
                        }

                        if(checkvalue){
                            var data = profileuser.patch({
                                'MatchedPeopleNotifications': profileuser.MatchedPeopleNotifications,
                                'MatchedPeopleNotificCount' : profileuser.MatchedPeopleNotificCount
                            });
                             deferred.resolve(data)
                        }
                     }*/
                });

           }, 1000);

           return deferred.promise;
        };
        return MatchButton;
    })


    .service('ESClient', function(esFactory) {
		return esFactory({
			host: 'http://127.0.0.1:8000',
			apiVersion: '1.2',
			log: 'trace'
		});
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
            console.log('author params===>', this.params)
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
            Restangular.all('posts', postid.postid).getList({embedded:embedded, seed:Math.random()})
            .then(function(data){

                this.posts.push.apply(this.posts, data);
                console.log('posts--------->', this.posts);
                console.log('ddata--------->', data);
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
                        _etag: post._etag
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
				interestedPeople:{ }
			}).then(function(data) {

                this.posts.unshift({
                    author: this.user_obj._id,
                    content: content,
                    post_image_path : imagePath,
                    _created: new Date(),
                    _id:data._id,
                    _etag: data._etag,
                    interestedPeople: {}

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

		InfinitePosts.prototype.deletePost = function(post) {

			Restangular.one('posts', post._id).remove({},{
			    'If-Match': (post._etag).toString()
			})
			.then(function(data) {
			    for(var k in this.posts){
			        if(this.posts[k]._id == post._id){
			            this.posts.splice(k,1)
			            this.SpecificPost = {};
			            console.log("successfully deleted")
			        }
			    }
			}.bind(this));
		};
		return InfinitePosts;
	}).factory('SearchActivity', function($http, Restangular, $alert, $timeout) {

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

            var temparray = []
            var authorIds = []

            for(var i in inputarry){
                //console.log(i)
                if(authorIds.indexOf(inputarry[i].author._id) === -1){
                    authorIds.push(inputarry[i].author._id)
                    temparray.push(inputarry[i])
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
            //var data =
            //console.log('this query splited==>', data);
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
					//this.total_matches = data.length;
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
					    tempresutls.push(author)

					}

					this.mresults = tempresutls;
			}.bind(this));

		}

		return MatchMeResults;
	});