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
	    function($route, $location, $scope, $auth, $q, $rootScope,InterestsService,
	                Restangular, InfinitePosts, $alert, $http, CurrentUser, UserService) {


        $scope.searched = false;
	 	$scope.searchBusy = false;
		$scope.UserService = UserService;
        $scope.InterestsService = InterestsService;
		$http.get('/api/me', {
			headers: {
				'Content-Type': 'application/json',
                'Authorization':$auth.getToken()
			}
		}).success(function(user_id) {
			var passReq = Restangular.one("people", JSON.parse(user_id)).get({seed:Math.random()})
			.then(function(result) {
                $scope.user = result;
                $scope.tags = $scope.user.interests;
                console.log("==inside tags", $scope.tags)

                $scope.interests_filter = [];
                console.log("=====tags", $scope.tags, "interests_filter", $scope.interests_filter);
                $scope.loadTags = function(query) {
                    $scope.getting_interests = [];
                    var param1 = '{"interest_string":{"$regex":".*'+query+'.*"}}';
                    return Restangular.all('interests').getList({
                        where : param1,
                        seed: Math.random(),
                        max_results: 5
                    })
                    .then(function(data){
                        console.log("getting length", data.length)
                        for(var i=0;i<data.length;i++){
                            console.log(data[i].interest_string);
                            $scope.getting_interests.push(data[i].interest_string);
                        }
                        console.log("getting interests from server",$scope.getting_interests);
                        console.log("getting details",$scope.getting_interests);
                        var deferred = $q.defer();
                        deferred.resolve($scope.getting_interests);
                        return deferred.promise;
                    });
                }
                $scope.tagAdded = function(tag) {
                    console.log('Tag added: ', tag.text, $scope.tags);
                    $scope.interests_filter.push(tag.text);
                    console.log("------->>>>", $scope.interests_filter);
                };
                $scope.tagRemoved = function(tag) {
                    var index = $scope.interests_filter.indexOf(tag.text);
                    if(index > -1){
                        $scope.interests_filter.splice(index, 1);
                    }
                    console.log("----->>>>>>>", $scope.interests_filter);
                };

                //uploading the profile image to crop the image with required size
                $scope.uploadPile = function(files) {
                    $scope.enableCrop = true;
                    $scope.showUploadButton = true;
                    var file=files[0];
                      console.log(file);
                      var reader = new FileReader();
                      reader.onload = function (evt) {
                        $scope.$apply(function($scope){
                          $scope.imageDataURI=evt.target.result;
                        });
                      };
                    reader.readAsDataURL(file);

                };
                $scope.size='small';
                $scope.type='square';
                $scope.imageDataURI='';
                $scope.resImageDataURI='';
                $scope.resImgFormat='image/png';
                $scope.resImgQuality=1;
                $scope.selMinSize=100;
                $scope.resImgSize=200;
                //$scope.aspectRatio=1.2;
                $scope.onChange=function($dataURI) {
                    $scope.resImageDataURI = $dataURI;
                };
                $scope.uploadFile = function(){
                    console.log("uploading the image")
                    var Get_upload_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                        Get_upload_details.then(function(response){
                        $scope.user = response;
                        $scope.user.picture.large = $scope.imageDataURI;
                        $scope.user.picture.medium = $scope.resImageDataURI;
                        $scope.user.picture.thumbnail = $scope.resImageDataURI;
                        $scope.user.patch({
                            'picture':{
                                'large':$scope.imageDataURI,
                                'medium':$scope.resImageDataURI,
                                'thumbnail':$scope.resImageDataURI
                            }
                        }).then(function(response){
                            //$route.reload();
                            console.log("====success", response)
                        });
                    });
                }

                $scope.updateUsername = function() {
                        var Get_User_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                        Get_User_details.then(function(response){
                        $scope.user = response;
                        $scope.user.username = $scope.u_username;
                        $scope.user.patch({
                            'username':$scope.u_username
                        });
                    });
                };

                $scope.updateFirstLastName = function() {

                    var Get_first_last_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                        Get_first_last_details.then(function(response){
                        $scope.user = response;
                        $scope.user.name.first = $scope.edit_first_name;
                        $scope.user.name.last = $scope.edit_last_name;
                        //console.log("=========before patch========")
                        $scope.user.patch({
                            'name':{
                                'first':$scope.edit_first_name,
                                'last':$scope.edit_last_name
                            }
                        }).then(function(response){

                        });
                    });
                };

                $scope.updateEmail = function() {
                    var Get_first_last_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                        Get_first_last_details.then(function(response){
                        $scope.user = response;
                        $scope.user.username = $scope.u_username;

                        $scope.user.patch({
                            'email':$scope.u_email
                        }).then(function(response){


                        });
                    });
                };

                $scope.checkUserCurrentPassword = function(){

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



                    $http.post('/get_new_hash_password',{
                        user_name:$scope.user.username,
                        new_password:$scope.formData.password
                    })
                    .success(function(data, status, headers, config) {


                        $scope.get_hash_new_password = data;



                        var updating_user_password = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                        updating_user_password.then(function(response){


                            $scope.user_updated_data = response;
                            $scope.user.password.password_updated = new Date();
                            $scope.user_updated_data.patch({
                                'password':{
                                    'password':$scope.get_hash_new_password,
                                    'password_test':$scope.formData.password,
                                    'password_updated':new Date()
                                }
                            });

                        });
                    })

                };
                $scope.updateInterests = function() {
                    $http.post('/get_interested_ids',
                        {
                            interests: $scope.interests_filter,
                            username: $scope.user.username
                        })
                    .success(function(data, status, headers, config) {
                            console.log("======return success of interests of ids",data.data,status)
                        }).
                    error(function(data, status, headers, config) {
                        console.log("====error of interests", data.data)
                    });
                };
                $scope.updatechangelocation = function() {

                    var Get_location_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                        Get_location_details.then(function(response){
                        $scope.user = response;
                        $scope.user.location.state = $scope.location_state;
                        $scope.user.location.city = $scope.location_city;
                        $scope.user.location.street = $scope.location_street;
                        $scope.user.patch({
                            'location':{
                                'state':$scope.location_state,
                                'city':$scope.location_city,
                                'street':$scope.location_street
                            }
                        });
                    });
                };
                $scope.updatechangestudy = function() {

                    var Get_study_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                        Get_study_details.then(function(response){
                        $scope.user = response;
                        $scope.user.study.intermediate = $scope.study_school;
                        $scope.user.study.graduate = $scope.study_graduate;
                        $scope.user.patch({
                            'study':{
                                'school':$scope.study_school,
                                'graduate':$scope.study_graduate
                            }
                        });
                    });
                };

                $scope.updatechangephone = function() {

                    var Get_phone_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                        Get_phone_details.then(function(response){
                        $scope.user = response;
                        $scope.user.phone = $scope.phone_number;
                        $scope.user.patch({
                            'phone':$scope.phone_number
                        });
                    });
                };

                $scope.updatechangemovies = function() {

                    var Get_interests_details = Restangular.one('people', $scope.user._id).get({seed:Math.random()});
                        Get_interests_details.then(function(response){
                        $scope.user = response;
                        var data = ($scope.movies.toString()).split(",");

                        for(var k in data){
                            $scope.user.movies.push(data[k]);
                        }

                        $scope.user.movies = $scope.user.movies;

                        $scope.user.patch({
                            'movies':$scope.user.movies
                        });
                    });
                };
			});
        });
	});