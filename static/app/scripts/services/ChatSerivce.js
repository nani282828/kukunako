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
                        this.chatfriends.push.apply(this.chatfriends, data)
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
                   console.log('successfully inserted into conversations')
                   console.log(data)
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
                        return ({'pageinfo':temp_pages, 'key':key})
                    }
                }

                if(!(found)){
                    // if person not found push into array
                    pages.push({
                        id:recept,
                        page:1,
                        end: false
                    });
                   temp_pages = pages[pages.length-1]
                   console.log('pushed when not found', pages)
                   return ({'pageinfo':pages[pages.length-1], 'key': pages.length-1})

                }
            }
            // no chat room open push first page
            else{
                console.log('first page')
                pages.push({
                    id:recept,
                    page:1,
                    end: false
                });
                return ({'pageinfo': pages[0], 'key':0})
            }
        }

        ChatActivity.prototype.loadMessages = function(user1, user2, roomdetails){
            console.log(user1, user2, roomdetails)
            console.log('load messages calling----------------------')
            var self = this;
            this.busy = true;
            var page = null;
            var key = null;

            self.main_params =  '{ "$or" : ['+
                    '{ "$and" : [ { "sender" : "'+user1+'" }, { "receiver" : "'+user2+'" } ] },'+
                    '{ "$and" : [ { "sender" : "'+user2+'" }, { "receiver": "'+user1+'" }  ] }'+
                ']}';

            self.embedded_param = '{"sender":1,"receiver":1}'
            console.log('------------open id pages-------------')
            console.log(self.pages)
            var data = getKey_Pages(self.pages, user2)
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

                console.log('loading messages at service')
				if (response.length < 10) {
					page.end = true;
				}

				self.messages.push.apply(self.messages,[{id:user2,details:roomdetails,messages:response}]);
				self.busy = false;
				page.page = page.page+1;
				self.pages[key] = page;
				console.log('-------page----------')
                console.log(self.pages)

            }.bind(self));
        }

        // push message in messages array after next page called
        function PushMessages(allMessages, newMessages, recept){
            for(k in allMessages){
                if(allMessages[k].id == recept){
                   console.log('all one messages', allMessages[k].messages)
                   allMessages[k].messages.push.apply(allMessages[k].messages, newMessages)
                   console.log('after all one messages', allMessages[k].messages)
                   return allMessages;

                }
            }

        }

        ChatActivity.prototype.nextPage = function(user2) {

		    //console.log(this.messages)
		    console.log('chat next ')


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

            self.embedded_param = '{"sender":1,"receiver":1}'

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
                   this.messages[k].messages.unshift(message)
                }
            }
        }

        ChatActivity.prototype.pushLatestMessage = function(msg){
            this.messageNotifc.push.apply(this.messageNotifc,[msg]);
            console.log(this.messageNotifc)
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
            console.log(getResults)

            params =  '{ "$and" : [ { "timestamp":{"$gte": '+this.currentuser.lastmessageseen +' }},'+
                                       '{ "receiver" : "'+this.currentuser._id+'" }] }';

            if(this.messageNotifc.length){
                params = '{ "$and" : [ { "timestamp":{"$gte": '+this.currentuser.lastmessageseen +' }},'+
                                       '{ "receiver" : "'+this.currentuser._id+'" }, { "seen" : '+false+' } ] }';
                getResults = true;

            }else if(!(this.latestMessages.length)){
                getResults = true
            }else{}

            var sort_param = '[("message_created",-1)]';
            var embedded_param = '{"sender":1,"receiver":1}';
            var self = this;

            if(getResults){

                Restangular.all('updatetimestamp').post({
                    timestamp:this.currentuser.lastmessageseen,
                    userid:this.currentuser._id
                }).then(function(data){
                    console.log(data)
                });

                Restangular.all('messages').getList({
                    where: params,
                    embedded: embedded_param,
                    sort:sort_param,
                    max_results: 10,
                    seed:Math.random()
                }).then(function(data){

                    // getting distinct message notifications
                    var data2 = []
                    data2.push.apply(data2,data)
                    var distinctMessages = []

                    for(temp in data2){

                        // update seen true messages
                        this.updateseenmessages.push.apply(this.updateseenmessages, data)
                        // distinct arry empty then push
                        if(distinctMessages.length == 0){
                            distinctMessages.push(data2[temp])
                        }
                        // else check in array then push
                        else{
                            for(var k in distinctMessages){
                                if(data2[temp].receiver._id == distinctMessages[k].receiver._id){
                                    console.log('alredy pushed')
                                }
                                else{
                                    distinctMessages.push(data2[temp])
                                }
                            }

                        }

                    }


                    self.latestMessages.push.apply(self.latestMessages, distinctMessages);

                    if(self.messageNotifc.length){
                        self.makeMessagesSeen(self.latestMessages);
                        self.messageNotifc = []
                    }

                }.bind(self))
            }

        }

        ChatActivity.prototype.makeMessagesSeen = function(latestMessages){
            var messageids = []
            for(x in this.updateseenmessages){
                messageids.push(this.updateseenmessages[x]._id)
            }
            if(messageids.length){
                Restangular.all('updateMessageSeen').post({
                    messageids: messageids
                }).then(function(data){
                    console.log('--------updated messages seen status----------')
                    console.log(data)
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
    });