import os



if os.environ.get('PORT'):
# We're hosted on Heroku! Use the MongoHQ sandbox as our backend.+ 
    MONGO_HOST = '10.240.115.93'
    MONGO_PORT = 27017
    MONGO_USERNAME = 'test'
    MONGO_PASSWORD = 'test'
    MONGO_DBNAME = 'test'
# also, correctly set the API entry point+# SERVER_NAME = '127.0.0.1:8000' #10.240.115.93:27017'
else:
    # Running on local machine. Let's just use the local mongod instance.
    MONGO_HOST = '127.0.0.1'
    MONGO_PORT = 27017
    MONGO_USERNAME = 'test'
    MONGO_PASSWORD = 'test'
    MONGO_DBNAME = 'test'


URL_PREFIX = 'api'
TOKEN_SECRET = os.environ.get('SECRET_KEY') or 'JWT Token Secret String'


    # let's not forget the API entry point (not really needed anyway)
    #SERVER_NAME = '127.0.0.1:5000'

XML = False
# Enable reads (GET), inserts (POST) and DELETE for resources/collections
# (if you omit this line, the API will default to ['GET'] and provide
# read-only access to the endpoint).
RESOURCE_METHODS = ['GET', 'POST', 'DELETE']

# Enable reads (GET), edits (PATCH) and deletes of individual items
# (defaults to read-only item access).
ITEM_METHODS = ['GET', 'PATCH', 'DELETE','PUT']
PUBLIC_METHODS = ['GET','PATCH','DELETE','PUT']
# We enable standard client cache directives for all resources exposed by the
# API. We can always override these global settings later.
#CACHE_CONTROL = 'max-age=0'
#CACHE_EXPIRES = 0
MONGO_QUERY_BLACKLIST = ['$where']
# Our API will expose two resources (MongoDB collections): 'people' and
# 'works'. In order to allow for proper data validation, we define beaviour
# and structure.

posts_schema = {

        'author': {
            'type': 'objectid',
            'required': True,
            'data_relation': {
                     'resource': 'people',
                     'field': '_id',
                     'embeddable': True
            },
        },
        'type': {
            'type': 'string',
            'allowed': ["text", "image", "video"],
        },
        'content': {
            'type': 'string',
            'required': True
        },
        'location': {
            'type': 'dict',
            'schema': {
                'address': {'type': 'string'},
                'city': {'type': 'string'}
            }
        },
        'keywords': {
            'type': 'list',
        },

        'post_image_path': {
            'type' : 'string',
        },


    }

searchActivity_schema = {
        'content': {
            'type': 'string',
            'required': True,
            'unique':True

        },
        'keywords': {
            'type': 'list',
        },

        'author': {
            'type': 'objectid',
            'data_relation': {
                     'resource': 'people',
                     'field': '_id',
                     'embeddable': True
            },
        },
        'totalResults':{
            'type':'integer',
            'default':0
        },
        'newResults':{
            'type':'integer',
            'default':0
        },
        'seen':{
            'type':'boolean',
            'default':True
        },
        'matchedPosts': {
            'type': 'list',
            'schema': {
                'type': 'objectid',
                'data_relation': {
                    'resource': 'posts',
                    'field':'_id',
                    'embeddable': True
                }
            }
        }

    }

message_schema = {

        'sender': {
            'type': 'objectid',
            'data_relation': {
                     'resource': 'people',
                     'field': '_id',
                     'embeddable': True
            },
        },

        'receiver': {
            'type': 'objectid',
            'data_relation': {
                     'resource': 'people',
                     'field': '_id',
                     'embeddable': True
            },
        },

        'message': {
            'type': 'string',
        },

        'seen':{
            'type':'boolean',
            'default':False
        },
        'timestamp':{
            'type':'integer',
            'default': 0
        },
        'message_created':{
            'type':'datetime'
        }

    }

messages = {
    'item_title':'messages',
    'schema':message_schema,
}

people = {
    # 'title' tag used in item links.
    'item_title': 'person',
    'allow_unknown': True,
    # by default the standard item entry point is defined as
    # '/people/<ObjectId>/'. We leave it untouched, and we also enable an
    # additional read-only entry point. This way consumers can also perform GET
    # requests at '/people/<lastname>/'.
    'additional_lookup': {
        'url': 'regex("[\w]+")',
        'field': 'username'
    },

    # Schema definition, based on Cerberus grammar. Check the Cerberus project
    # (https://github.com/nicolaiarocci/cerberus) for details.
    'schema': {
        'name': {
            'type': 'dict',
            'schema': {
                'first': {
                    'type': 'string',
                    'minlength': 1,
                    'maxlength': 10,
                },
                'last': {
                    'type': 'string',
                    'minlength': 1,
                    'maxlength': 15,
                    'unique': True,
                },	
                'title': {
                    'type': 'string'
                }
            }
        },

        'email': {
            'type': 'string',
            'minlength': 1,
            'required': True,
            'unique': True,
        },

        'conversations': {
            'type': 'list',
            'schema': {
                'type': 'objectid',
                'data_relation': {
                    'resource': 'people',
                    'embeddable': True
                }
            },
        },

	    'username': {
            'type': 'string',
            'minlength': 1,
            'maxlength': 25,
            'unique': True,
        },

	      'password': {
            'type': 'string'
        },
	      'password_test': {
            'type': 'string'
        },
        'lastmessageseen': {
            'type': 'integer'
        },
        'role': {
            'type': 'string',
            'default': 'normal',
            'allowed': ["admin", "normal", "test"],
        },
        'gender': {
            'type': 'string',
        },
        'email_confirmed':{
            'type':'boolean'
        },
        'random_string':{
            'type':'string',
            'unique':True
        },
        'location': {
            'type': 'dict',
            'schema': {
                'street': {'type': 'string'},
                'city': {'type': 'string'},
                'state': {'type': 'string'},
                'zip': {'type': 'string'}
            },
        },
        'picture': {
            'type': 'dict',
            'schema': {
                'large': {'type': 'string'},
                'medium': {'type': 'string'},
                'thumbnail': {'type': 'string'}
            },
        },
        'born': {
            'type': 'string',
        },
        'phone': {
            'type': 'string',
        },

        'all_seen':{
            'type':'boolean',
            'default':False
        },

        'interests':{
            'type':'list',
            'schema': {
                'type': 'string',
            }
        },
        'movies':{
            'type':'list',
            'schema': {
                'type': 'string',
            }
        },

        'study':{
            'type': 'dict',
            'schema': {
                'intermediate': {'type': 'string'},
                'graduate': {'type': 'string'}
            },
        },

        'notifications': {
            'type': 'list',

            'schema': {
                'type':'dict',
                'schema':{
                    'friend_requests': {
                        'type': 'objectid',

                         #'unique': True,
                        'data_relation': {
                            'resource': 'people',
                            'embeddable': True
                        },
                    },
                    'seen': {
                            'type': 'boolean',
                            'default': False
                    }
                }
            }
        },

        'acceptnotifications': {
            'type': 'list',
	    'schema':{
		'type':'dict',

	            'schema': {
        	        'acceptedid': {
                             'type': 'string'
                     	}
                 
                    }
	    }
	},

        'friends': {
            'type': 'list',
            'schema': {
                'type': 'objectid',
                'data_relation': {
                    'resource': 'people',
                    'embeddable': True
                }
            }
        },

        'matchedpeoplenotificcount':{
            'type': 'list'
        },


            'matchedpeoplenotifications': {
            'type': 'list'
        }


    }
}

posts = {
    'item_title': 'posts',
    'schema':posts_schema,
    #'url': 'people/posts/<regex("[a-f0-9]{24}"):author>',
    #'url' : 'posts',
}

searchActivity = {
    'item_title': 'searchActivity',
    'schema' : searchActivity_schema,
    'url' : 'searchActivity',
}

people_searchActivity = {
    'schema': searchActivity_schema,
    'url': 'people/<regex("[a-f0-9]{24}"):author>/searchActivity',
    'datasource': {"source": "searchActivity"}
}

people_posts = {
    'schema': posts_schema,
    'url': 'people/<regex("[a-f0-9]{24}"):author>/posts',
    'datasource': {"source": "posts"}
}


items = {
        'schema': {
            'uri': {'type': 'string', 'unique': True},
            'name': {'type': 'string'},
            'firstcreated': {'type': 'datetime'},
            'category': {
                'type': 'string',
                'mapping': {'type': 'string', 'index': 'not_analyzed'}
            },
        },
        'datasource': {
            'backend': 'elastic',
            'projection': {'firstcreated': 1, 'name': 1},
            'default_sort': [('firstcreated', -1)]
        }
}

# The DOMAIN dict explains which resources will be available and how they will
# be accessible to the API consumer.
DOMAIN = {
    'items':items,
    'people': people,
    'posts': posts,
    'searchActivity': searchActivity,
    'people_searchActivity':people_searchActivity,
    'people_posts':people_posts,
    'messages':messages
}
