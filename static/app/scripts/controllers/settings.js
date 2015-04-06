'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:SettingsCtrl
 * @description
 * # SettingsCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
	.controller('SettingsCtrl',
	    function($route, $location, $scope, $auth, Restangular, InfinitePosts, $alert, $http, CurrentUser, UserService) {



        //ng-tags-input code for tags style interests
            $scope.tags = [
                ];
                for(var i=0; i<$scope.tags.length; i++){
                    console.log($scope.tags[i])
                }
                $scope.loadTags = function(query) {
                         //return $http.get('/tags?query=' + query);
                    };
                $scope.tagAdded = function(tag) {
                    console.log('Tag added: ', tag.text);
                    console.log($scope.tags)
                };
                $scope.tagRemoved = function(tag) {
                    console.log('Tag removed: ', tag);
                    console.log($scope.tags)
                };


		$scope.UserService = UserService;
		$http.get('/api/me', {
			headers: {
				'Content-Type': 'application/json',
                'Authorization':$auth.getToken()
			}
		}).success(function(user_id) {
			var passReq = Restangular.one("people", JSON.parse(user_id)).get({seed:Math.random()}).then(function(result) {
              $scope.user = result;

            });


            $scope.size='small';
            $scope.type='circle';
            $scope.imageDataURI='';
            $scope.resImageDataURI='';
            $scope.resImgFormat='image/png';
            $scope.resImgQuality=1;
            $scope.selMinSize=100;
            $scope.resImgSize=200;
            //$scope.aspectRatio=1.2;
            $scope.onChange=function($dataURI) {
              console.log('onChange fired');
              console.log($dataURI)
            };
            $scope.onLoadBegin=function() {
              console.log('onLoadBegin fired');
            };
            $scope.onLoadDone=function() {
              console.log('onLoadDone fired');
            };
            $scope.onLoadError=function() {
              console.log('onLoadError fired');
            };
            var handleFileSelect=function(evt) {
              var file=evt.currentTarget.files[0];
              console.log(file);
              var reader = new FileReader();
              reader.onload = function (evt) {
                $scope.$apply(function($scope){
                  $scope.imageDataURI=evt.target.result;
                  console.log("============after base encoding the image===========")
                  console.log($scope.imageDataURI);
                });
              };
              reader.readAsDataURL(file);
            };
            angular.element(document.querySelector('#fileInput')).on('change',handleFileSelect);
            $scope.$watch('resImageDataURI',function(){
                console.log('Res image', $scope.resImageDataURI);
                console.log("its just testing the encoding base64")


            });

            $scope.uploadFile = function(){

                var Get_upload_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                    Get_upload_details.then(function(response){
                    $scope.user = response;

                    $scope.user.picture.large = $scope.imageDataURI;
                    $scope.user.picture.medium = $scope.resImageDataURI;
                    $scope.user.picture.thumbnail = $scope.resImageDataURI;

                    console.log("=========before patch of upload========")

                    $scope.user.patch({
                        'picture':{
                            'large':$scope.imageDataURI,
                            'medium':$scope.resImageDataURI,
                            'thumbnail':$scope.resImageDataURI
                        }
                    }).then(function(response){

                        console.log("=====after patch========")
                        console.log(response)
                    });
                });

            }



            $scope.updateUsername = function() {

                var Get_User_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                    Get_User_details.then(function(response){
                    $scope.user = response;

                    $scope.user.username = $scope.u_username;
                    console.log("-------checking user object------")
                    console.log($scope.user)
                    console.log("=========before patch========")
                    console.log($scope.user.username)

                    $scope.user.patch({

                        'username':$scope.u_username

                    }).then(function(response){

                        console.log("=====after patch========")
                        console.log(response)
                    });
                });
			};

			$scope.updateFirstLastName = function() {

			    var Get_first_last_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                    Get_first_last_details.then(function(response){
                    $scope.user = response;

                    $scope.user.name.first = $scope.edit_first_name;
                    $scope.user.name.last = $scope.edit_last_name;

                    console.log("=========before patch========")

                    $scope.user.patch({
                        'name':{
                            'first':$scope.edit_first_name,
                            'last':$scope.edit_last_name
                        }
                    }).then(function(response){

                        console.log("=====after patch========")
                        console.log(response)
                    });
                });
			};

			$scope.updateEmail = function() {

			    var Get_first_last_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                    Get_first_last_details.then(function(response){
                    $scope.user = response;

                    $scope.user.username = $scope.u_username;
                    console.log("=========before patch========")

                    $scope.user.patch({
                        'email':$scope.u_email
                    }).then(function(response){

                        console.log("=====after patch========")
                        console.log(response)
                    });
                });
			};

			$scope.checkUserCurrentPassword = function(){
			    console.log($scope.formData.cPassword)
			    $http.post('/check_user_current_password',
                    {
                        user_name:$scope.user.username,
                        old_password:$scope.formData.cPassword
                    })
                    .success(function(data, status, headers, config) {
                        $scope.if_user_password_is_incorrect = false;
                    })
                    .error(function(error, status, headers, config) {
                        $scope.if_user_password_is_incorrect = error.error;
                    });
			}


			$scope.updatePassword = function() {
			    console.log("----testing password functionality-----")
			    console.log($scope.formData.password)

			    $http.post('/get_new_hash_password',{
                    user_name:$scope.user.username,
                    new_password:$scope.formData.password
                })
                .success(function(data, status, headers, config) {
                    console.log("-------getting status-------")
                    console.log(status)
                    $scope.get_hash_new_password = data;
                    console.log("=======get hashed password====")
                    console.log($scope.get_hash_new_password)

                    var updating_user_password = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                    updating_user_password.then(function(response){
                        console.log("--------user data-----")
                        console.log(response)
                        $scope.user_updated_data = response;
                        $scope.user.password.password_updated = new Date();
                        $scope.user_updated_data.patch({
                            'password':{
                                'password':$scope.get_hash_new_password,
                                'password_test':$scope.formData.password,
                                'password_updated':new Date()
                            }
                        })
                        .then(function(response){
                            console.log("----------after password patch update----------")
                            console.log(response)
                        });
                    });
                })
                .error(function(error, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    console.log("----getting error status ------")
                    console.log(status)
                    console.log(error.error)

                });
			};

			$scope.updateInterests = function() {

			    var Get_interests_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                    Get_interests_details.then(function(response){
                    $scope.user = response;
                    console.log("=========before patch========")

                    var data = ($scope.interests.toString()).split(",");

                    for(var k in data){
                        $scope.user.interests.push(data[k]);
                    }
                    $scope.user.interests = $scope.user.interests;
                    $scope.user.patch({
                        'interests':$scope.user.interests
                    }).then(function(response){

                        console.log("===after interests patch=====");
                        console.log(response);

                    });
                });
			};

			$scope.updatechangelocation = function() {

			    var Get_location_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                    Get_location_details.then(function(response){
                    $scope.user = response;
                    console.log("=========before patch========")

                    $scope.user.location.state = $scope.location_state;
                    $scope.user.location.city = $scope.location_city;
                    $scope.user.location.street = $scope.location_street;
                    $scope.user.patch({
                        'location':{
                            'state':$scope.location_state,
                            'city':$scope.location_city,
                            'street':$scope.location_street
                        }
                    }).then(function(response){

                        console.log("===after location patch=====");
                        console.log(response);

                    });
                });
			};

			$scope.updatechangestudy = function() {

			    var Get_study_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                    Get_study_details.then(function(response){
                    $scope.user = response;
                    console.log("=========before patch========")

                    $scope.user.study.intermediate = $scope.study_intermediate;
                    $scope.user.study.graduate = $scope.study_graduate;
                    $scope.user.patch({
                        'study':{
                            'intermediate':$scope.study_intermediate,
                            'graduate':$scope.study_graduate
                        }
                    }).then(function(response){

                        console.log("===after study patch=====");
                        console.log(response);

                    });
                });
			};

			$scope.updatechangephone = function() {

			    var Get_phone_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                    Get_phone_details.then(function(response){
                    $scope.user = response;
                    console.log("=========before patch========")

                    $scope.user.phone = $scope.phone_number;
                    $scope.user.patch({
                        'phone':$scope.phone_number
                    }).then(function(response){

                        console.log("===after phone number patch=====");
                        console.log(response);

                    });
                });
			};

            $scope.updatechangemovies = function() {

			    var Get_interests_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                    Get_interests_details.then(function(response){
                    $scope.user = response;
                    console.log("=========before patch========")

                    var data = ($scope.movies.toString()).split(",");

                    for(var k in data){
                        $scope.user.movies.push(data[k]);
                    }

                    $scope.user.movies = $scope.user.movies;

                    $scope.user.patch({
                        'movies':$scope.user.movies
                    }).then(function(response){

                        console.log("===after interests patch=====");
                        console.log(response);
                    });
                });
			};
        });
	});