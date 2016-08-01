var fihApp = angular.module('fihApp', ['ngAnimate','ui.bootstrap','ngResource', 'ngRoute','ngTable']);

fihApp.config(['$routeProvider', function($routeProvider){
    $routeProvider
        .when('/', {
            templateUrl: 'partials/marketplace.html',
            controller: 'MarketPlaceCtrl',
            activetab: 'APIMarketplace'
        })
        .when('/dashboard', {
            templateUrl: 'partials/dashboard.html',
            controller: 'DashboardCtrl',
            activetab: 'Dashboard'
        })
        .when('/help', {
            templateUrl: 'partials/help.html',
        })
        .when('/#/apps', {
            templateUrl: 'partials/apps.html',
            controller: 'AppsCtrl',
            activetab: 'Applications'
        })
        .when('/apps', {
            templateUrl: 'partials/apps.html',
            controller: 'AppsCtrl',
            activetab: 'Applications'
        })
        .when('/appdetails', {
            templateUrl: 'partials/app-details.html',
        })
        .when('/add-api', {
            templateUrl: 'partials/api-form.html',
            controller: 'AddApiCtrl'
        })
        .when('/appstatus', {
            templateUrl: 'partials/app-status.html',
            controller: 'AppStatusCtrl',
        })
        .when('/#/appstatus', {
            templateUrl: 'partials/app-status.html',
            controller: 'AppStatusCtrl',
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

fihApp.factory('databaseListFactory', function($http) {
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

fihApp.controller('MarketPlaceCtrl', ['$scope', '$resource', '$location', 
    function($scope, $resource, $location){
        $scope.pageHeader = "API Markeplace";
        $scope.isActive = function(route) {
            return route === $location.path();
        };

        // Generate random colors for API Panel
        $scope.Math = window.Math;
        $scope.hcolors = new Array("#009688","#D50000","#2962FF","#2E7D32","#006064","#607D8B","#4E342E","#E64A19");
        $scope.bcolors = new Array("#80CBC4","#FF8A80","#82B1FF","#C8E6C9","#B2EBF2","#CFD8DC","#BCAAA4","#FFAB91");
        $scope.fcolors = new Array("#E0F2F1","#FFEBEE","#E3F2FD","#E8F5E9","#E0F7FA","#ECEFF1","#EFEBE9","#FBE9E7");

        $scope.hexstyle = new Array("hexagon1","hexagon2","hexagon3","hexagon4","hexagon5");
        $scope.hextextstyle = new Array("hex-text1","hex-text2","hex-text3","hex-text4","hex-text5");

        var Apis = $resource('/fih/apis');
        Apis.query(function(apis){
            $scope.apis = apis;
        });
    }]);

fihApp.controller('DashboardCtrl', ['$scope', '$resource', '$location', 
    function($scope, $resource, $location){
        $scope.pageHeader = "Dashboard";
        
    }]);

fihApp.controller('SidebarCtrl', ['$scope', '$resource', '$location', 
    function($scope, $resource, $location){
        $scope.isActive = function(route) {
            return route === $location.path();
        };

    }]);

fihApp.controller('AppsCtrl', ['$scope', '$resource','$location', 
    function($scope, $resource, $location){
        $scope.pageHeader = "Applications / Integration Services";
        $scope.isActive = function(route) {
            return route === $location.path();
        };

        // Generate random colors for API Panel
        $scope.Math = window.Math;
        $scope.hcolors = new Array("#009688","#D50000","#2962FF","#2E7D32","#006064","#607D8B","#4E342E","#E64A19");
        $scope.bcolors = new Array("#80CBC4","#FF8A80","#82B1FF","#C8E6C9","#B2EBF2","#CFD8DC","#BCAAA4","#FFAB91");
        $scope.fcolors = new Array("#E0F2F1","#FFEBEE","#E3F2FD","#E8F5E9","#E0F7FA","#ECEFF1","#EFEBE9","#FBE9E7");

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

fihApp.controller('AppStatusCtrl', ['$scope', '$window', '$routeParams','$sce','$interval', '$http', '$location',
    function($scope, $window, $routeParams, $sce, $interval, $http, $location){
        
        $scope.pageHeader = "Application Deployment Status";
        
        $scope.appStateObj = {
            Saved: {Text: "Saved", Per: 5, Type: "info", Class: "progress-striped active"},
            Queued: {Text: "Queued", Per: 10, Type: "warning", Class: "progress-striped active"},
            WIP: {
                Triggered: {Text: "Build Triggered", Per: 20, Type: "default", Class: "progress-striped active"},
                Checkedout: {Text: "Build Checkedout", Per: 30, Type: "default", Class: "progress-striped active"},
                BuildComplete: {Text: "Build Completed", Per: 50, Type: "default", Class: "progress-striped active"},
                Pushed: {Text: "Build Pushed", Per: 90, Type: "default", Class: "progress-striped active"}
            },
            Failed: {
                QueueFailed: {Text: "Build Queue Failed", Per: 30, Type: "danger", Class: "progress-striped"},
                CheckoutFailed: {Text: "Build Checkout Failed", Per: 40, Type: "danger", Class: "progress-striped"},
                BuildFailed: {Text: "Build Failed", Per: 60, Type: "danger", Class: "progress-striped"},
                PushFailed: {Text: "Push Failed", Per: 80, Type: "danger", Class: ""}
            },
            Success: {Text: "Success", Per: 100, Type: "success", Class: "progress-striped"}
        };

        var buildappstatus = $routeParams.buildappstatus;

        $scope.appCurrentState = "Saved";
        $scope.barState = $scope.appStateObj[$scope.appCurrentState];
        
        console.log("Build Status Received: "+buildappstatus);
        if(buildappstatus == 'queued'){
            $scope.appCurrentState = "Queued";
            $scope.barState = $scope.appStateObj[$scope.appCurrentState];
            var queueStatusUrl = 'http://daasapi.10.135.4.49.xip.io/FIH/service/DAASAPI/JenkinUtility/GetBuildNumber?buildIdentifier='+$routeParams.buildidentifier;
            $scope.RefreshQueueStatus = $interval(function () {
                
                $http.get(queueStatusUrl).then(function (res) {
                    var buildNumber = 0;
                    buildNumber = res.data.response.buildNumber;
                    console.log("Build Number:"+buildNumber);
                    if(buildNumber > 0){
                        redirectUrl ='/#/appstatus?buildappstatus=wip&buildno='+buildNumber+'&buildurl='+encodeURIComponent('http://jenkins-06hw6.10.135.4.49.xip.io/job/DAASBuild/'+buildNumber+'/consoleText');
                        console.log("URL to redirect: "+redirectUrl);
                        $interval.cancel($scope.RefreshQueueStatus);
                        //$location.path(redirectUrl);
                        $window.location.href = redirectUrl;
                    }
                    else{
                        $window.location.reload(true);
                    }
                });
                
            }, 10000);
        }
        else if(buildappstatus == 'failed'){
            $scope.appCurrentState = "Failed";
            $scope.barState = $scope.appStateObj[$scope.appCurrentState]["QueueFailed"];
        }
        else if (buildappstatus == 'wip'){
            $scope.appCurrentState = "WIP";
            $scope.barState = $scope.appStateObj[$scope.appCurrentState]["Triggered"];
            var logUrl = $routeParams.buildurl;
            console.log("Application Build URL: "+logUrl);
            $scope.buildUrl = $sce.trustAsResourceUrl(logUrl);
            var cancelInterval = false;
            var statusUrl = 'http://daasapi.10.135.4.49.xip.io/FIH/service/DAASAPI/JenkinUtility/GetStatus?buildNumber='+$routeParams.buildno;
            
            $scope.RefreshIFrame = $interval(function () {
                
                $http.get(statusUrl).then(function (res) {
                    var appStatus = res.data.response.status.trim();
                    $scope.appCurrentState = appStatus;

                    if(appStatus == "Success"){
                        console.log("Received "+appStatus+" For BuildAPI. Stoping page refresh..");
                        $interval.cancel($scope.RefreshIFrame);
                        $scope.barState = $scope.appStateObj[$scope.appCurrentState];
                        // TODO: Persist APP state in mongodb
                    }
                    else if(appStatus == "Failed"){
                        console.log("Received "+appStatus+" from BuildAPI. Stoping page refresh..");
                        $interval.cancel($scope.RefreshIFrame);
                        console.log("res.data.response.stage"+res.data.response.stage);
                        if(res.data.response.stage){
                            $scope.appCurrentStage = res.data.response.stage;
                        }
                        else{
                            $scope.appCurrentStage = "QueueFailed";
                        }
                        console.log("Failure State: "+$scope.appCurrentState);
                        console.log("Failure Stage: "+$scope.appCurrentStage);
                        $scope.barState = $scope.appStateObj[$scope.appCurrentState][$scope.appCurrentStage];
                        console.log("Bar state:"+JSON.stringify($scope.barState));
                    }
                    else if(appStatus =="WIP"){
                        console.log("Reloading Page...");
                        var appStage = res.data.response.stage;
                        $scope.barState = $scope.appStateObj[$scope.appCurrentState][appStage];
                        $scope.buildUrl = $sce.trustAsResourceUrl($routeParams.buildurl+'?dummyVar='+ (new Date()).getTime());
                        //$window.location.reload(true);
                    }
                });
                
                /*if(cancelInterval){
                    console.log("Stoping Refresh..");
                    $interval.cancel($scope.RefreshIFrame);
                }*/
            }, 5000);
        }
        
    }]);

fihApp.controller('AddAppCtrl', ['$scope','$window','$http', '$resource', '$location', '$filter','$routeParams', 'NgTableParams','databaseList',
    function($scope, $window, $http, $resource, $location, $filter,$routeParams, NgTableParams, databaseList){
        
        $scope.pageHeader = "Application / Integration Service Configuration";
        
        $scope.loader = {
            loading: false,
        };

        $scope.hidePanel = false;

        $scope.queryResult = '..';
        $scope.queryResultColor = 'black';
        $scope.testQuery = function(){
            console.log("Calling OracleDB service..");
            var DbConn = $resource('/fih/dbconfig/testdbconn');
            DbConn.save($scope.app, function(responseQuery){
                    console.log("Result from OracleDB: "+responseQuery.rows);
                    $scope.queryResult = "Success: "+responseQuery.rows;
                    $scope.queryResultColor = "green";
            }, function(error){
                console.log("Error in fetching data from OracleDB: "+JSON.stringify(error));
                $scope.queryResult = "Failed";
                $scope.queryResultColor = "red";
            }
            );
        };

        $scope.app = {};
        $scope.app.dbconfig= {};
        $scope.apitype = $routeParams.apitype;
        $scope.createApp = function(){
            
            $scope.loader.loading = true;
            $scope.hidePanel = true;

            var formattedDate = new Date();
            var appPostRequest = {
                name: $scope.app.name,
                api_type: $scope.apitype,
                api_ver: '1.0',
                descr: $scope.app.descr,
                version: '1.0',
                //endpoint: '',
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
            var appCurrentState = {};
            var appObjectId = {};
            Apps.save(appPostRequest, function(app){
                appCurrentState = 'Saved';
                appObjectId = app._id;
            }, function(error){
                appCurrentState = 'SaveFailed';
            });

            if(appCurrentState == 'SaveFailed'){
                var redirectUrl ='/#/appstatus?buildappstatus=savefailed';
                console.log("Failed to save application details in database. Redirect to: "+redirectUrl);
                $window.location.href = redirectUrl;
            }
            else{
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
                $http.post('http://daasapi.10.135.4.49.xip.io/FIH/service/DAASAPI/BuildApp',buildApiRequest, headerConfig, {dataType: "jsonp"})
                .success(function(response, status, headers, config){
                    console.log("Successfully invoked BuildAPI with response: "+JSON.stringify(response));
                    console.log("Build App status: "+ response.response.status);

                    var buildApiResponseStatus = response.response.status; 
                    var updateObj = {
                        appObjectId : appObjectId,
                        appEP : response.response.app_ep,
                        appBuildUrl : response.response.logURL,
                        appStatus : buildApiResponseStatus,
                        appBuildNumber: response.response.buildNumber,
                        appBuildIdentifier: response.response.buildIdentifier
                    };
                    console.log("Updating app status with request: "+JSON.stringify(updateObj));

                    var AppUpdate = $resource('/fih/apps/updateStatus');
                    var redirectUrl = '';
                    switch(buildApiResponseStatus){
                        case "Failed":
                            handleAppBuildFailure();
                            break;

                        case "Queued":
                            AppUpdate.save(updateObj, function(res){
                                console.log("Successfully updated App status: "+JSON.stringify(res));
                                redirectUrl ='/#/appstatus?buildappstatus=queued&buildidentifier='+updateObj.appBuildIdentifier;
                                console.log("URL to redirect: "+redirectUrl);
                                $window.location.href = redirectUrl;
                            },
                            function(error){
                                handleAppBuildFailure(error);
                            });
                            
                            break;

                        case "WIP":
                            AppUpdate.save(updateObj, function(res){
                                console.log("Successfully updated App status: "+JSON.stringify(res));
                                redirectUrl ='/#/appstatus?buildappstatus=wip&buildno='+updateObj.appBuildNumber+'&buildurl='+encodeURIComponent(updateObj.appBuildUrl);
                                console.log("URL to redirect: "+redirectUrl);
                                $window.location.href = redirectUrl;
                            },
                            function(error){
                                handleAppBuildFailure(error);
                            });

                            break;
                    }
                        
                })
                .error(function(data, status, headers, config){
                    handleAppBuildFailure();
                });
            }
            
            function handleAppBuildFailure(error){
                $scope.loader.loading = false;
                console.log(JSON.stringify("Recieved Error From Build API: "+JSON.stringify(error)));
                appStatus = 'Failed';
                var urlpath ='/#/appstatus?buildapistatus=failed&reason='+error;
                $window.location.href = urlpath;
            }
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

fihApp.controller('ModalAppCtrl', function ($scope, $uibModal, $filter) {
  
    $scope.items = [{'item1': 'Value1'}, {'item2': 'Value2'}, {'item3': 'Value3'}];
    $scope.animationsEnabled = true;
    $scope.appDetails = [];
    $scope.open = function (appName) {
        
        var choosenApp = $filter('filter')($scope.apps, {name: appName}, true)[0];
        console.log("Filtered App Details: "+JSON.stringify(choosenApp));
 
        $scope.appDetails = [
            {"App / Integration Service" : choosenApp.name},
            {"Application Description" : choosenApp.descr},
            {"API Type" : choosenApp.api_type},
            {"API Version" : choosenApp.api_ver},
            {"End Point": choosenApp.endpoint},
            {"Status" : choosenApp.status},
            {"Organization" : choosenApp.stackato_config.org},
            {"Space" : choosenApp.stackato_config.space},
            {"Database" : choosenApp.api_config.db_name},
            {"DB Query" : choosenApp.api_config.query}
        ];
        console.log("App Details:"+JSON.stringify($scope.appDetails));

        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'myModalContent.html',
            controller: 'ModalInstanceCtrl',
            appName: appName,
            size:'lg',
            resolve: {
                appDetails: function () {
                    return $scope.appDetails;
                }
            }
        });

        modalInstance.result.then(function (selectedItem) {
        $scope.selected = selectedItem;
        }, function () {
            console.log('Modal dismissed at: ' + new Date());
        });
    };

    $scope.toggleAnimation = function () {
        $scope.animationsEnabled = !$scope.animationsEnabled;
    };

});


// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

fihApp.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, appDetails) {

  $scope.appDetails = appDetails;
  
  $scope.selected = {
  };

  $scope.ok = function () {
    $uibModalInstance.close($scope.selected.item);
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
});