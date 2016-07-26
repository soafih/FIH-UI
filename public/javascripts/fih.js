var fihApp = angular.module('fihApp', ['ngAnimate','ui.bootstrap','ngResource', 'ngRoute','ngTable']);

fihApp.config(['$routeProvider', function($routeProvider){
    $routeProvider
        .when('/', {
            templateUrl: 'partials/marketplace.html',
            controller: 'MarketPlaceCtrl'
        })
        .when('/dashboard', {
            templateUrl: 'partials/dashboard.html',
        })
        .when('/help', {
            templateUrl: 'partials/help.html',
        })
        .when('/#/apps', {
            templateUrl: 'partials/apps.html',
            controller: 'AppsCtrl'
        })
        .when('/apps', {
            templateUrl: 'partials/apps.html',
            controller: 'AppsCtrl'
        })
        .when('/appdetails', {
            templateUrl: 'partials/app-details.html',
        })
        .when('/add-api', {
            templateUrl: 'partials/api-form.html',
            controller: 'AddApiCtrl'
        })
        .when('/add-app/:apitype', {
            templateUrl: 'partials/app-form.html',
            controller: 'AddAppCtrl',
            resolve: {
                databaseList: function(databaseListFactory) {
                return databaseListFactory.getDatabaseList();
            }
        }

        })
        .otherwise({
            redirectTo: '/'
        });
}]);

fihApp.factory('databaseListFactory', function($http, $window) {
    var factoryResult = {
        getDatabaseList: function() {
            var promise = $http({
                method: 'GET', 
                url: '/fih/dbconfig' 
            }).success(function(data, status, headers, config) {
                return data;
            });

            return promise;
        }
    }; 

    return factoryResult;
});

fihApp.controller('MarketPlaceCtrl', ['$scope', '$resource', 
    function($scope, $resource){
        $scope.pageHeader = "API Markeplace";
        var Apis = $resource('/fih/apis');
        Apis.query(function(apis){
            $scope.apis = apis;
        });
    }]);

fihApp.controller('AppsCtrl', ['$scope', '$resource', 
    function($scope, $resource){
        $scope.pageHeader = "Applications/Integration Services";
        var Apps = $resource('/fih/apps');
        Apps.query(function(apps){
            $scope.apps = apps;
        });
    }]);

fihApp.controller('AddApiCtrl', ['$scope', '$resource', '$location',
    function($scope, $resource, $location){
        $scope.pageHeader = "API Configuration";
        $scope.save = function(){
            var Apis = $resource('/fih/apis');
            Apis.save($scope.api, function(){
                $location.path('/');
            });
        };
    }]);

fihApp.controller('AddAppCtrl', ['$scope','$window','$http', '$resource', '$location', '$filter','$routeParams', 'NgTableParams','databaseList',
    function($scope, $window, $http, $resource, $location, $filter,$routeParams, NgTableParams, databaseList){
        $scope.app = {};
        $scope.app.dbconfig= {};
        $scope.activeTab = 0;
        $scope.apitype = $routeParams.apitype;

        $scope.pageHeader = "Application / Integration Service Configuration";
        $scope.createApp = function(){
            var formattedDate = new Date();
            var appPostRequest = {
                name: $scope.app.name,
                api_type: $scope.apitype,
                api_ver: '1.0',
                descr: $scope.app.descr,
                version: '1.0',
                endpoint: 'TBD',
                status: 'Saved',
                servicename: $scope.app.name,
                created_by: 'System',
                created_date: formattedDate,
                last_updated_by: 'System',
                last_updated_date: formattedDate,
                messages: [{message: 'First Version'}],
                stackato_config: {org: $scope.app.selectedOrg,space: $scope.app.selectedSpace},
                api_config: {
                    db_name: $scope.app.dbconfig.db_name,
                    query: $scope.app.db_query
                }
            };

            var Apps = $resource('/fih/apps');
            Apps.save(appPostRequest, function(){
                $location.path('/#/apps');
            });

            var buildApiRequest = {
                "organization":$scope.app.selectedOrg,
                "space":$scope.app.selectedSpace,
                "applicationName":$scope.app.name,
                "query":$scope.app.db_query,
                "databaseInfo":
                {
                    "databaseType":$scope.app.dbconfig.db_type,
                    "hostName": $scope.app.dbconfig.host,
                    "port": $scope.app.dbconfig.port,
                    "databaseName":$scope.app.dbconfig.db_name,
                    "user":$scope.app.dbconfig.uname,
                    "password":$scope.app.dbconfig.pwd
                },
                "connectionAttr":
                {
                    "maxActive":"50",
                    "maxIdle":"30",
                    "maxWait":"10000"
                }
            };

            var headerConfig = {headers:  {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json;odata=verbose'
                }
            };
            
            console.log("Build API Request: "+JSON.stringify(buildApiRequest));

            $http.post('http://daasapi.10.135.4.49.xip.io/FIH/service/DAASAPI',buildApiRequest, headerConfig, {dataType: "jsonp"})
            .success(function(response, status, headers, config){
                var resString = JSON.stringify(response);
                console.log("Successfully invoked BuildAPI with response: "+resString);
            })
            .error(function(data, status, headers, config){
                JSON.stringify("Recieved Error From Build API: "+data);
            });
        };

        $scope.stackatoOrg = ["SOA"];
        $scope.app.selectedOrg = $scope.stackatoOrg[0];

        $scope.stackatoSpace = ["SOA", "fih"];
        $scope.app.selectedSpace = $scope.stackatoSpace[0];

        /*$scope.getDbSearchResult = function(val) {
           
                return $http.get('/fih/dbconfig/dbname', {
                params: {
                    dbname: val
                }
                }).then(function(response){
                    return response.data.map(function(item){
                        return item.db_name;
                    });
                });
            
        };
        */
        
        $scope.databases = databaseList.data;

        $scope.databaseTable = new NgTableParams({}, 
        {
            total: $scope.databases.length, 
            getData: function (params) {
                $scope.data = params.sorting() ? $filter('orderBy')($scope.databases, params.orderBy()) : $scope.databases;
                $scope.data = params.filter() ? $filter('filter')($scope.data, params.filter()) : $scope.data;
                //$scope.data = $scope.data.slice((params.page() - 1) * params.count(), params.page() * params.count());
            }
        });
    }]);
