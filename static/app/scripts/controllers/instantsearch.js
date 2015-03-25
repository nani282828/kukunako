'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:InstantsearchCtrl
 * @description
 * # InstantsearchCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
  .controller('InstantsearchCtrl', function ($scope, $routeParams, $location,$rootScope,
                                             Restangular,$http,$auth, InstanceSearch) {

  /*$scope.searching = function(){

   var params = '{"keywords": {"$in":["'+($scope.search.split(" "))+'"]}}'
   var params2 = '{"author":1}'
        Restangular.all('people/posts').getList({where :params,embedded :params2}).then(function(data) {
						$scope.results = data
        });
   };

    $scope.searchSubmit = function(){
        $location.path("/search").search({q: $scope.search});
    };
    



     var searchPeoplesParams = '{"username":1,"email":1,"name":{"first":1,"last":1},"picture":{"large":1,"medium":1,"thumbnail":1}}';

    var searchFriends = Restangular.all('people').getList({
        projection : searchPeoplesParams,
        seed : Math.random()
    });

    searchFriends.then(function(database_people){
        $scope.searchPeoples = database_people;
    });

    $scope.searchP = function(){
        $scope.filtered = []
        if($scope.searchPeoples && $scope.searchPeople){
            for(var i = 0 ; i < $scope.searchPeoples.length; i++){
                if(
                (($scope.searchPeoples[i]).name.first+
                ($scope.searchPeoples[i]).username+
                ($scope.searchPeoples[i]).name.last+
                ($scope.searchPeoples[i].email))
                .toString().search($scope.searchPeople) > -1
                ){
                    $scope.filtered.push($scope.searchPeoples[i])
                }
            }
        }
    } */



    /*$scope.InstanceSearchPeoples = function(){



      //$scope.$parent.testing = $scope.InstanceSearchQuery;
      this.testing = $scope.instancesearch;
      //$scope.$apply();

    }*/


 })
.directive('instancesearch', function ($compile, CurrentUser, Restangular, $routeParams, friendsActivity,$route, InstanceSearch) {
    return {
        restrict: 'A',
        replace: true,
        link: function ($scope, element, attrs) {},
        controller:function($scope, $element, $attrs, $transclude){
            $scope.instancesearch = new InstanceSearch();
            $scope.InstanceSearchPeoples = function() {

                $scope.instancesearch.getInstancePeoples($scope.InstanceSearchQuery)
                console.log($scope.instancesearch)
                $scope.testing = 'dddddddddddcccccccccccddd'

            }
        }

    };
});