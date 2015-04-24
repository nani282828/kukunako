angular.module('weberApp')
    .controller('indexCtrl', function($auth,$rootScope,$scope, $window) {

        $rootScope.isAuthenticated = function() {
            return $auth.isAuthenticated();
        };
        $rootScope.isloggin = $auth.isAuthenticated();

        /* login functionality code goes here*/
        $scope.submitLogin = function() {

			$auth.login({
				email: this.login_email,
				password: this.login_password
			}).then(function(response) {
				$auth.setToken(response.data.token);
				$rootScope.isloggin = true;
				$window.location.reload();
			}, function(error) {
				$scope.loginError = error;
				$alert({
					title: 'Login Failed:',
					content: error.data.error,
					placement: 'top',
					type: 'danger',
					show: true
				});
			});
		};
        /* end of login functionality*/
});