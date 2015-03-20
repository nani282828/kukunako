'use strict';

/**
 * @ngdoc overview
 * @name weberApp
 * @description
 * # weberApp
 *
 * Main module of the application.
 */
angular
	.module('weberApp', [
		'ngAnimate',
		'ngCookies',
		'ngResource',
		'ngRoute',
		'ngSanitize',
		'ngTouch',
		'mgcrea.ngStrap',
		'satellizer',
		'restangular',
		'angularMoment',
		'elasticsearch',
		'ngImgCrop',
		'infinite-scroll',
		'ngSocket'
	])
	.run(["$rootScope", "$location",
		function($rootScope, $location) {
			$rootScope.$on("$routeChangeError", function(event, current, previous, eventObj) {
				if (eventObj.authenticated === false) {
					$location.path("/login");
				}
			});
		}
	])

	/*.run(['$route', '$rootScope', '$location', function ($route, $rootScope, $location) {
        var original = $location.path;
        $location.path = function (path, reload) {
            if (reload === false) {
                var lastRoute = $route.current;
                var un = $rootScope.$on('$locationChangeSuccess', function () {
                    $route.current = lastRoute;
                    un();
                });
            }
            return original.apply($location, [path]);
        };
    }])*/

	.config(['RestangularProvider',
		function(RestangularProvider) {
			// point RestangularProvider.setBaseUrl to your API's URL_PREFIX
			RestangularProvider.setBaseUrl('/api');
			RestangularProvider.setRestangularFields({
				selfLink: '_links._self.href'
			});
			// add a response intereceptor
			RestangularProvider.addResponseInterceptor(function(data, operation, what, url, response, deferred) {
				var extractedData;
				// .. to look for getList operations
				if (operation === "getList") {
					// .. and handle the data and meta data
					extractedData = data._items;
					extractedData.meta = data._meta;
					extractedData.links = data._links;
				} else {
					extractedData = data;
				}
				return extractedData;
			});

			RestangularProvider.setRestangularFields({
				id: "_id"
			});
		}
	])
	.config(function($routeProvider, $locationProvider, $authProvider) {
		$authProvider.logoutRedirect = '/weber_search';
		$authProvider.loginOnSignup = false;
		$routeProvider
			.when('/home', {
				templateUrl: '/static/app/views/main.html',
				controller: 'MainCtrl',
				resolve: {
					authenticated: function($location, $auth) {
						if (!$auth.isAuthenticated()) {
							return $location.path('/login');
						}
					}
				}
			})
			/*.when('/search/:query?', {
				templateUrl: '/static/app/views/search_engine.html',

			})*/
			.when('/profile/:username', {
				templateUrl: '/static/app/views/userprofile.html',
				controller: 'UserprofileCtrl',
			})
			.when('/post/:postid', {
				templateUrl: '/static/app/views/post.html',
				controller: 'PostLoadController'
			})
			.when('/forgotpassword', {
				templateUrl: '/static/app/views/f_password.html'

			})

			.when('/users/:user_name/change_password_link/:password_random_string', {
				templateUrl:'/static/app/views/change_password.html'
			})

			.when('/search/:query?', {
				templateUrl: '/static/app/views/start_search.html',
				controller: 'WeberSearchCtrl',
				reloadOnSearch: false
			})

			.when('/matchme/:query?', {
				templateUrl: '/static/app/views/search.html',
				controller: 'WeberSearchCtrl',
				resolve: {
					authenticated: function($location, $auth) {
						if (!$auth.isAuthenticated()) {
							return $location.path('/login');
						}
					}
				},
				reloadOnSearch: false
			})
			.when('/login', {
				templateUrl: '/static/app/views/login.html',
				controller: 'LoginCtrl',
			})
			.when('/settings', {
				templateUrl: '/static/app/views/settings.html',
				controller: 'SettingsCtrl',
				resolve: {
					authenticated: function($location, $auth) {
						if (!$auth.isAuthenticated()) {
							return $location.path('/login');
						}
					}
				}
			})
			.when('/friends', {
				templateUrl: '/static/app/views/friends.html',
				controller: 'FriendsCtrl',
				resolve: {
					authenticated: function($location, $auth) {
						if (!$auth.isAuthenticated()) {
							return $location.path('/login');
						}
					}
				}
			})
			.when('/messages', {
				templateUrl: '/static/app/views/messages.html',
				controller: 'MessagesCtrl',
				resolve: {
					authenticated: function($location, $auth) {
						if (!$auth.isAuthenticated()) {
							return $location.path('/login');
						}
					}
				}
			})
			.when('/email_details/:userId', {
				templateUrl: '/static/app/views/emaildetails.html',
				controller:'EmailDetailsCtrl'
			})
			.when('/confirm_account/users/:objectId/confirm/:user_random_string', {
				templateUrl:'/static/app/views/confirm_email.html',
				controller:'EmailCtrl'
			})
			.when('/signup', {
				templateUrl: '/static/app/views/signup.html',
				controller: 'SignupCtrl'
			})

			.otherwise({
				redirectTo: '/search',
				reloadOnSearch: false
			});
	});