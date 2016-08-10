var fihApp = angular.module('fihApp', ['ngAnimate','ui.bootstrap','ngResource','ngRoute','ngTable']);
fihApp.constant("DAASAPI_URL","http://daasapi.stackato-poc.foxinc.com");

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
        .when('/apps', {
            templateUrl: 'partials/apps.html',
            controller: 'AppsCtrl',
            activetab: 'Applications'
        })
        .when('/appdetails/:appname', {
            templateUrl: 'partials/app-details.html',
            controller: 'AppDetailsCtrl'
        })
        .when('/add-api', {
            templateUrl: 'partials/api-form.html',
            controller: 'AddApiCtrl'
        })
        .when('/appstatus', {
            templateUrl: 'partials/app-status.html',
            controller: 'AppStatusCtrl',
        })
        .when('/login', {
            templateUrl: 'partials/login.html',
            controller: 'LoginCtrl',
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

fihApp.controller('MarketPlaceCtrl', function($scope, $resource, $location){
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
    });

fihApp.controller('LoginCtrl', function($scope, $resource, $location, $http){
        $scope.pageHeader = "Login";
        
    });

fihApp.controller('DashboardCtrl', function($scope, $resource, $location){
        $scope.pageHeader = "Dashboard";
        
    });
fihApp.controller('AppDetailsCtrl', function($scope, $routeParams, $resource, $location, $filter, $uibModal, $window, $http, DAASAPI_URL){
        $scope.applicationName = $routeParams.appname;
        $scope.showLabelAppDescr = true;
        
        var AppUpdate = $resource('/fih/apps/updateStatus');

        $scope.editImplDetails = function(){
            $scope.showEditableImplFields = true;
            $scope.showSavedMessage = false;
            $scope.editMessage = "";
            $scope.txtUpdatedQuery = $scope.appDetails.db_config.query;
            $scope.txtMaxWait = $scope.appDetails.db_config.max_wait;
            $scope.txtMaxIdle = $scope.appDetails.db_config.max_idle;
            $scope.txtMaxActive = $scope.appDetails.db_config.max_active;
        };

        $scope.saveImplDetails = function(){
            $scope.showEditableImplFields = false;
            console.log("Updating query "+$scope.txtUpdatedQuery+" for "+$scope.appDetails._id);
            var updateObj = {
                appObjectId : $scope.appDetails._id,
                expose_to_apigee : $scope.appDetails.expose_to_apigee,
                'db_config.query': $scope.txtUpdatedQuery,
                'db_config.max_active': $scope.txtMaxActive,
                'db_config.max_wait': $scope.txtMaxWait,
                'db_config.max_idle': $scope.txtMaxIdle,
                last_updated_by: 'System',
                last_updated_date: new Date()
            };
            AppUpdate.save(updateObj, function(res){
                console.log($scope.appDetails._id + "Updated status: "+JSON.stringify(res));
                $scope.showSavedMessage = true;
                $scope.editMessage = "Updated, Redeploy Application.";
                $scope.msgColor = "#f0ad4e";
                $scope.appDetails.db_config.query= $scope.txtUpdatedQuery; 
                $scope.appDetails.db_config.max_wait = $scope.txtMaxWait;
                $scope.appDetails.db_config.max_idle = $scope.txtMaxIdle;
                $scope.appDetails.db_config.max_active = $scope.txtMaxActive;
            },
            function(error){
                console.log("Failed in updating app query: "+JSON.stringify(error));
                $scope.showSavedMessage = true;
                $scope.editMessage = "Failed";
                $scope.msgColor = "red";
            });
        };

        $scope.cancelImplDetails = function(){
            $scope.showEditableImplFields = false;
            $scope.showSavedMessage = false;
            $scope.editMessage = "";
        };

        $scope.editAppDescr = function(){
            $scope.showLabelAppDescr = false;
            $scope.showTextAppDescr = true;
            $scope.updatedAppDesc = $scope.appDetails.descr;
        };

        $scope.saveAppDescr = function(){
            $scope.showLabelAppDescr = true;
            $scope.showTextAppDescr = false;
            
            var updateObj = {
                appObjectId : $scope.appDetails._id,
                descr: $scope.updatedAppDesc,
                last_updated_by: 'System',
                last_updated_date: new Date()
            };
            AppUpdate.save(updateObj, function(res){
                console.log($scope.appDetails._id + " Updated status: "+JSON.stringify(res));
                $scope.appDetails.descr = $scope.updatedAppDesc;
            },
            function(error){
                console.log("Failed in updating app description: "+JSON.stringify(error));
            });
        };

        $scope.cancelAppDescr = function(){
            $scope.showLabelAppDescr = true;
            $scope.showTextAppDescr = false;
            $scope.updatedAppDesc = $scope.appDetails.descr;
        };

        $scope.openDialog = function(action){
            console.log("Action being performed:"+action);
            
            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: 'modalDialog.html',
                controller: 'AppDetailModalInstanceCtrl',
                size: 'md',
                resolve: {
                    action: function () {
                        return action;
                    }
                }
            });

            modalInstance.result.then(function () {
                console.log('Modal Action selected: ' + action);
                if(action === 'delete'){
                    $scope.deleteApp();
                }
                else if (action === 'redeploy'){
                    $scope.redeployApp();
                }
            }, function () {
                console.log('Modal Action dismissed: ' + action);
            });
        };

        $scope.redeployApp = function(){
            var appObjectId = $scope.appDetails._id;
            var buildAppRequest = {
                "organization": $scope.appDetails.stackato_config.org,
                "space": $scope.appDetails.stackato_config.space,
                "applicationName": $scope.appDetails.name,
                "query": $scope.appDetails.db_config.query,
                "databaseInfo":
                {
                    "databaseType": $scope.databaseInfo.db_type,
                    "hostName": $scope.databaseInfo.host,
                    "port": $scope.databaseInfo.port,
                    "databaseName": $scope.databaseInfo.db_name,
                    "schema": $scope.databaseInfo.schema,
                    "user": $scope.databaseInfo.uname,
                    "password": $scope.databaseInfo.pwd
                },
                "connectionAttr":
                {
                    "maxActive": $scope.appDetails.db_config.max_active,
                    "maxIdle": $scope.appDetails.db_config.max_idle,
                    "maxWait": $scope.appDetails.db_config.max_wait
                }
            };

            var headerConfig = {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json;odata=verbose'
                }
            };

            console.log("Build API Request: " + JSON.stringify(buildAppRequest));
            $http.post(DAASAPI_URL + '/FIH/service/DAASAPI/BuildApp', buildAppRequest, headerConfig, { dataType: "jsonp" })
                .success(function (response, status, headers, config) {
                    console.log("Successfully invoked BuildAPI with response: " + JSON.stringify(response));
                    console.log("Build App status: " + response.response.status);

                    var buildApiResponseStatus = response.response.status;
                    var updateObj = {
                        appObjectId: appObjectId,
                        endpoint: response.response.app_ep,
                        build_url: response.response.logURL,
                        status: buildApiResponseStatus,
                        stage: response.response.stage,
                        build_number: response.response.buildNumber,
                        build_identifier: response.response.buildIdentifier
                    };

                    console.log("Updating app status with request: " + JSON.stringify(updateObj));

                    var AppUpdate = $resource('/fih/apps/updateStatus');
                    var redirectUrl = '';
                    switch (buildApiResponseStatus) {
                        case "Failed":
                            handleAppBuildFailure();
                            break;

                        case "Queued":
                            AppUpdate.save(updateObj, function (res) {
                                console.log("Successfully updated App status: " + JSON.stringify(res));
                                redirectUrl = '/#/appstatus?appname=' + $scope.appDetails.name + '&appId=' + appObjectId + '&buildappstatus=queued&buildidentifier=' + updateObj.build_identifier;
                                console.log("URL to redirect: " + redirectUrl);
                                $window.location.href = redirectUrl;
                            },
                                function (error) {
                                    handleAppBuildFailure(error);
                                });

                            break;

                        case "WIP":
                            AppUpdate.save(updateObj, function (res) {
                                console.log("Successfully updated App status: " + JSON.stringify(res));
                                redirectUrl = '/#/appstatus?appname=' + $scope.appDetails.name + '&appId=' + appObjectId + '&buildappstatus=wip&buildno=' + updateObj.build_number + '&buildurl=' + encodeURIComponent(updateObj.build_url);
                                console.log("URL to redirect: " + redirectUrl);
                                $window.location.href = redirectUrl;
                            },
                                function (error) {
                                    handleAppBuildFailure(error);
                                });

                            break;
                    }

                })
                .error(function (data, status, headers, config) {
                    handleAppBuildFailure();
                });


            function handleAppBuildFailure(error) {
                console.log(JSON.stringify("Recieved Error From Build API: " + JSON.stringify(error)));
                appStatus = 'Failed';
                var updateObj = {
                    appObjectId: appObjectId,
                    status: appStatus,
                };
                var AppUpdate = $resource('/fih/apps/updateStatus');
                AppUpdate.save(updateObj, function (res) {
                    var redirectUrl = '/#/appstatus?appname=' + $scope.appDetails.name + '&appId=' + appObjectId + '&buildappstatus=failed&reason=' + error;
                    console.log("URL to redirect: " + redirectUrl);
                    $window.location.href = redirectUrl;
                },
                    function (error) {
                        console.log("Failed in updating app status: " + JSON.stringify(error));
                    });
            }
        };

        $scope.deleteApp = function(){
            var StackatoService =$resource('/fih/stackatoapis/apps/'+$scope.appGUID);
            StackatoService.delete(function(res){
                var appDeleteStatus = JSON.stringify(res);
                console.log(res+" Stackato App Delete Status: "+appDeleteStatus);
                console.log("Response Status Code:"+res.statusCode);
                if(res){
                    var AppService = $resource('/fih/apps/name/'+$scope.applicationName);
                    AppService.delete(function(res){
                        console.log("Deleted App: "+res);
                        console.log("Deleted App: "+JSON.stringify(res));
                        $location.path('/#/');
                    });
                }
            });
        };

        var init = function(){
            var AppService = $resource('/fih/apps/name/'+$scope.applicationName);
            AppService.get(function(appDetails){
                console.log("Fetched app details: "+JSON.stringify(appDetails));
                $scope.appDetails = appDetails;
                $scope.appSummary = [
                    {"API Type" : appDetails.api_type},
                    {"API Version" : appDetails.api_ver},
                    {"Status" : appDetails.status},
                    {"Stage" : appDetails.stage},
                    {"Created" : $filter('date')(appDetails.created_date, "yyyy-MM-dd HH:mm:ss")},
                    {"Created By" : appDetails.created_by},
                    {"Last Updated" : $filter('date')(appDetails.last_updated_date, "yyyy-MM-dd HH:mm:ss")},
                    {"Last Updated By" : appDetails.last_updated_by}
                ];
                
                var DBService = $resource('/fih/dbconfig/name/'+appDetails.db_config.db_name);
                DBService.get(function(dbconfig){
                    console.log("Fetched database details: "+JSON.stringify(dbconfig));
                    $scope.databaseInfo = dbconfig;
                    $scope.dbDetails = [
                        {"Name" : dbconfig.db_name},
                        {"Type" : dbconfig.db_type},
                        {"Host": dbconfig.host},
                        {"Port" : dbconfig.port},
                        {"User" : dbconfig.uname},
                        {"Schema" : dbconfig.schema}
                    ];
                });
            });

            var StackatoService =$resource('/fih/stackatoapis/apps/'+$scope.applicationName);
            StackatoService.get(function(app){
                console.log("APP GUID: "+app.guid);
                $scope.appGUID = app.guid;
            });
        };

        init();
    });
    
fihApp.controller('AppDetailModalInstanceCtrl', function ($scope, $uibModalInstance, action) {
    console.log('Action Ctrl:' + action);
    if (action === 'delete') {
        $scope.modalTitle = 'Delete Application';
        $scope.modalMessage = 'All application data will be deleted. This action cannot be undone!';
        $scope.ModalActionBtnText = 'Delete';
    }
    else if (action === 'redeploy') {
        $scope.modalTitle = 'Redeploy Application';
        $scope.modalMessage = 'Application redeployment request will be triggered!';
        $scope.ModalActionBtnText = 'Redeploy';
    }

    $scope.ok = function () {
        $uibModalInstance.close();
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

fihApp.controller('SidebarCtrl', function($scope, $resource, $location){
        $scope.isActive = function(route) {
            return route === $location.path();
        };

    });

fihApp.controller('AppsCtrl', function($scope, $resource, $location){
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
    });

fihApp.controller('AddApiCtrl', function($scope, $resource, $location){
        $scope.pageHeader = "API Configuration";
        $scope.save = function(){
            var Apis = $resource('/fih/apis');
            Apis.save($scope.api, function(){
                $location.path('/');
            });
        };
    });

fihApp.controller('AppStatusCtrl', function($scope, $resource, $window, $routeParams, $sce, $interval, $http, $location, DAASAPI_URL){
        
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
                QueueFailed: {Text: "Build Queue Failed", Per: 20, Type: "danger", Class: ""},
                CheckoutFailed: {Text: "Build Checkout Failed", Per: 30, Type: "danger", Class: ""},
                BuildFailed: {Text: "Build Failed", Per: 50, Type: "danger", Class: ""},
                PushFailed: {Text: "Push Failed", Per: 80, Type: "danger", Class: ""}
            },
            Success: {Text: "Success", Per: 100, Type: "success", Class: ""}
        };

        var buildappstatus = $routeParams.buildappstatus;
        $scope.appName = $routeParams.appname;
        var appObjectId= $routeParams.appId;

        $scope.appCurrentState = "Saved";
        $scope.barState = $scope.appStateObj[$scope.appCurrentState];

        $scope.successIFrame = false;
        $scope.displaySuccessLogs = function(){
            $scope.successIFrame = !$scope.successIFrame;
            if($scope.successIFrame){
                $scope.showLogText = 'Hide Logs';
            }
            else{
                $scope.showLogText = 'Show Logs';
            }
        };
        console.log("Build Status Received: "+buildappstatus);
        var AppUpdate = $resource('/fih/apps/updateStatus');
        if(buildappstatus == 'queued'){
            $scope.appCurrentState = "Queued";
            $scope.barState = $scope.appStateObj[$scope.appCurrentState];
            var queueStatusUrl = DAASAPI_URL + '/FIH/service/DAASAPI/JenkinUtility/GetBuildNumber?buildIdentifier='+$routeParams.buildidentifier;
            
            $scope.RefreshQueueStatus = $interval(function () {

                $http.get(queueStatusUrl).then(function (res) {
                    var buildNumber = 0;
                    buildNumber = res.data.response.buildNumber;
                    console.log("Build Number:"+buildNumber);
                    if(buildNumber > 0){
                        var logURL = 'http://jenkins-06hw6.10.135.4.49.nip.io/job/DAASBuild/'+buildNumber+'/consoleText';
                        var updateObj = {
                            appObjectId : appObjectId,
                            status : 'WIP',
                            stage: 'Triggered',
                            build_number: buildNumber,
                            build_url: logURL
                        };
                        
                        AppUpdate.save(updateObj, function(res){
                            console.log("Updated status: "+JSON.stringify(res));
                        },
                        function(error){
                            console.log("Failed in updating app status: "+JSON.stringify(error));
                        });

                        redirectUrl ='/#/appstatus?appname='+$scope.appName+'&buildappstatus=wip&buildno='+buildNumber+'&buildurl='+encodeURIComponent(logURL);
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
            var statusUrl = DAASAPI_URL + '/FIH/service/DAASAPI/JenkinUtility/GetStatus?buildNumber='+$routeParams.buildno;
            
            $scope.RefreshIFrame = $interval(function () {
                
                $http.get(statusUrl).then(function (res) {
                    var appStatus = res.data.response.status.trim();
                    var appStage = res.data.response.stage.trim();
                    $scope.appCurrentState = appStatus;
                        
                    if(appStatus == "Success"){
                        console.log("Received "+appStatus+" For BuildAPI. Stoping page refresh..");
                        $interval.cancel($scope.RefreshIFrame);
                        $scope.barState = $scope.appStateObj[$scope.appCurrentState];
                        $scope.buildUrl = $sce.trustAsResourceUrl($routeParams.buildurl+'?dummyVar='+ (new Date()).getTime());
                        
                        var updateObj = {
                            appObjectId : appObjectId,
                            status : appStatus,
                            stage: appStage,
                        };
                        AppUpdate.save(updateObj, function(res){
                            console.log("Updated status: "+JSON.stringify(res));
                        },
                        function(error){
                            console.log("Failed in updating app status: "+JSON.stringify(error));
                        });
                    }
                    else if(appStatus == "Failed"){
                        console.log("Received "+appStatus+" from BuildAPI. Stoping page refresh..");
                        $interval.cancel($scope.RefreshIFrame);
                        if(res.data.response.stage){
                            $scope.appCurrentStage = res.data.response.stage;
                        }
                        else{
                            $scope.appCurrentStage = "QueueFailed";
                        }
                        $scope.barState = $scope.appStateObj[$scope.appCurrentState][$scope.appCurrentStage];
                        $scope.buildUrl = $sce.trustAsResourceUrl($routeParams.buildurl+'?dummyVar='+ (new Date()).getTime());

                        var updateObj = {
                            appObjectId : appObjectId,
                            status : appStatus,
                            stage: appStage,
                        };
                        AppUpdate.save(updateObj, function(res){
                            console.log("Updated status: "+JSON.stringify(res));
                        },
                        function(error){
                            console.log("Failed in updating app status: "+JSON.stringify(error));
                        });
                    }
                    else if(appStatus =="WIP"){
                        console.log("Reloading Page...");
                        $scope.barState = $scope.appStateObj[$scope.appCurrentState][appStage];
                        $scope.buildUrl = $sce.trustAsResourceUrl($routeParams.buildurl+'?dummyVar='+ (new Date()).getTime());

                        var updateObj = {
                            appObjectId : appObjectId,
                            status : appStatus,
                            stage: appStage,
                        };
                        AppUpdate.save(updateObj, function(res){
                            console.log("Updated status: "+JSON.stringify(res));
                        },
                        function(error){
                            console.log("Failed in updating app status: "+JSON.stringify(error));
                        });
                    }
                });
                
            }, 5000);
        }
        
    });


fihApp.controller('ModalQueryInstanceCtrl', function ($scope, $rootScope, $uibModalInstance, testQueryResult) {

    $scope.testQueryResult = testQueryResult;

    /*$scope.ok = function () {
        $uibModalInstance.close($scope.selected.item);
    };*/

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

fihApp.controller('AddAppCtrl', function($scope, DAASAPI_URL, $rootScope, $window, $http, $resource, $location, $uibModal, $filter,$routeParams, NgTableParams, databaseList){
        
        $scope.pageHeader = "Application / Integration Service Configuration";
        $scope.previousBtnDisabled = true;
        $scope.changeActiveTab = function(selectedTab){
            switch(selectedTab){
                case 0:
                    $scope.nextActiveTab = 1;
                    $scope.previousBtnDisabled = true;
                    $scope.nextBtnDisabled = false;
                    break;
                case 1:
                    $scope.nextActiveTab = 2;
                    $scope.previousActiveTab = 0;
                    $scope.previousBtnDisabled = false;
                    $scope.nextBtnDisabled = false;
                    break;
                case 2:
                    $scope.previousActiveTab = 1;
                    $scope.previousBtnDisabled = false;
                    $scope.nextBtnDisabled = true;
                    break;
            }
        };
        $scope.loader = {
            loading: false,
        };
        $scope.hidePanel = false;
        $scope.disableCreateBtn = true;
        $scope.disableQueryText = false;

        $scope.resetQuery =  function(){
            $scope.app.db_query = null;
            $scope.disableCreateBtn = true;
            $scope.disableQueryText = false;
        };

        $scope.testQuery = function(){
            console.log("Calling Test Query service.."+JSON.stringify($scope.app.dbconfig));
            $scope.queryResponse = '';
            if ($scope.app.dbconfig.db_name) {
                var testQueryRequest = {
                    "query": $scope.app.db_query,
                    "databaseInfo": {
                        "databaseType": $scope.app.dbconfig.db_type,
                        "hostName": $scope.app.dbconfig.host,
                        "port": $scope.app.dbconfig.port,
                        "databaseName": $scope.app.dbconfig.db_name,
                        "schema": $scope.app.dbconfig.schema,
                        "user": $scope.app.dbconfig.uname,
                        "password": $scope.app.dbconfig.pwd
                    }
                };

                var headerConfig = {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json;odata=verbose'
                    }
                };

                console.log("Calling Test Query service with request: " + JSON.stringify(testQueryRequest));
                $scope.queryResultColor = '';
                $scope.testQueryResult = [];
                $http.post(DAASAPI_URL + '/FIH/service/DAASAPI/DBUtility/ValidateQuery', testQueryRequest, headerConfig, { dataType: "jsonp" })
                    .success(function (response, status, headers, config) {
                        console.log("Successfully invoked BuildAPI with response: " + JSON.stringify(response));
                        if (response.response.status == "Success") {
                            $scope.queryResult = response.response.status;
                            $scope.queryResultColor = "green";
                            $scope.testQueryResult = response.response.DataCollection.Data;
                            $scope.disableCreateBtn = false;
                            $scope.showQueryLabel = false;
                            //$scope.disableQueryText = true;
                            $scope.openResultModal();
                        }
                        else {
                            $scope.queryResponse = response.response.errorDetails;
                            $scope.disableCreateBtn = true;
                            $scope.showQueryLabel = true;
                            $scope.disableQueryText = false;
                        }
                    }, function (error) {
                        console.log("Failed to connect to DataSource Service: " + JSON.stringify(error));
                        $scope.queryResponse = "Error in connection with Datasource Service.";
                        $scope.disableCreateBtn = true;
                        $scope.showQueryLabel = true;
                        $scope.disableQueryText = false;
                    });

            }
            else {
                $window.alert("Please select database from Database Info Tab..");
                $scope.activeTab = 1;
            }
        };
        
        $scope.animationsEnabled = false;
        $scope.openResultModal = function () {
            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: 'myModalContent.html',
                controller: 'ModalQueryInstanceCtrl',
                size:'lg',
                resolve: {
                    testQueryResult: function () {
                        console.log("scope.testQueryResult: "+JSON.stringify($scope.testQueryResult));
                        return $scope.testQueryResult;
                    }
                }
            });

            modalInstance.result.then(function (selectedItem) {
                $scope.selected = selectedItem;
            }, function () {
                console.log('Modal dismissed at: ' + new Date());
            });
        };

        $scope.app = {};
        $scope.app.dbconfig= {};
        $scope.apitype = $routeParams.apitype;
        
        $scope.createApp = function(){
            
            $scope.loader.loading = true;
            $scope.hidePanel = true;
            $scope.app.name = $scope.app.name.replace("_", "-");
            var formattedDate = new Date();
            var maxActive =  ($scope.app.dbconfig.max_active === undefined ? '50' : $scope.app.dbconfig.max_active);
            var maxIdle= ($scope.app.dbconfig.max_idle === undefined ? '30' : $scope.app.dbconfig.max_idle);
            var maxWait= ($scope.app.dbconfig.max_wait === undefined ? '10000' : $scope.app.dbconfig.max_wait);
            var appPostRequest = {
                name: $scope.app.name,
                api_type: $scope.apitype,
                api_ver: '1.0',
                descr: $scope.app.descr,
                version: '1.0',
                status: 'Saved',
                servicename: $scope.app.name,
                expose_to_apigee: $scope.app.exposeToApigee,
                created_by: 'System',
                created_date: formattedDate,
                last_updated_by: 'System',
                last_updated_date: formattedDate,
                messages: [{message: 'First Version'}],
                stackato_config: {org: $scope.app.selectedOrg,space: $scope.app.selectedSpace},
                db_config: {
                    db_name: $scope.app.dbconfig.db_name,
                    query: $scope.app.db_query,
                    max_active: maxActive,
                    max_idle: maxIdle,
                    max_wait: maxWait
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
                var redirectUrl ='/#/appstatus?appname='+$scope.app.name+'&appId='+appObjectId+'&buildappstatus=savefailed';
                console.log("Failed to save application details in database. Redirect to: "+redirectUrl);
                $window.location.href = redirectUrl;
            }
            else{
                var buildAppRequest = {
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
                        "schema":$scope.app.dbconfig.schema,
                        "user":$scope.app.dbconfig.uname,
                        "password":$scope.app.dbconfig.pwd
                    },
                    "connectionAttr":
                    {
                        "maxActive": maxActive,
                        "maxIdle": maxIdle,
                        "maxWait": maxWait
                    }
                };

                var headerConfig = {headers:  {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json;odata=verbose'
                    }
                };
                
                console.log("Build API Request: "+JSON.stringify(buildAppRequest));
                $http.post(DAASAPI_URL + '/FIH/service/DAASAPI/BuildApp',buildAppRequest, headerConfig, {dataType: "jsonp"})
                .success(function(response, status, headers, config){
                    console.log("Successfully invoked BuildAPI with response: "+JSON.stringify(response));
                    console.log("Build App status: "+ response.response.status);

                    var buildApiResponseStatus = response.response.status; 
                    var updateObj = {
                        appObjectId : appObjectId,
                        endpoint : response.response.app_ep,
                        build_url : response.response.logURL,
                        status : buildApiResponseStatus,
                        stage : response.response.stage,
                        build_number: response.response.buildNumber,
                        build_identifier: response.response.buildIdentifier
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
                                redirectUrl ='/#/appstatus?appname='+$scope.app.name+'&appId='+appObjectId+'&buildappstatus=queued&buildidentifier='+updateObj.build_identifier;
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
                                redirectUrl ='/#/appstatus?appname='+$scope.app.name+'&appId='+appObjectId+'&buildappstatus=wip&buildno='+updateObj.build_number+'&buildurl='+encodeURIComponent(updateObj.build_url);
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
                var updateObj = {
                    appObjectId : appObjectId,
                    status : appStatus,
                };
                var AppUpdate = $resource('/fih/apps/updateStatus');
                AppUpdate.save(updateObj, function(res){
                    var redirectUrl ='/#/appstatus?appname='+$scope.app.name+'&appId='+appObjectId+'&buildappstatus=failed&reason='+error;
                    console.log("URL to redirect: "+redirectUrl);
                    $window.location.href = redirectUrl;
                },
                function(error){
                    console.log("Failed in updating app status: "+JSON.stringify(error));
                });
            }
        };

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

        // at the bottom of your controller
        var init = function () {
            
            var OrgApis = $resource('/fih/stackatoapis/orgs');
            OrgApis.query(function(apis){
                console.log("apis: "+apis);
                $scope.stackatoOrg = apis;
                $scope.app.selectedOrg = $scope.stackatoOrg[0];
                
            });

            var SpaceApis = $resource('/fih/stackatoapis/spaces');
            SpaceApis.query(function(spaces){
                console.log("apis: "+spaces);
                $scope.stackatoSpace = spaces;
                $scope.app.selectedSpace = $scope.stackatoSpace[0];
            });
        };
        // and fire it after definition
        init();
        
    });

fihApp.controller('ModalAppCtrl', function ($scope, $uibModal, $filter, $window) {
  
    $scope.animationsEnabled = true;
    $scope.appDetails = [];
    $scope.viewDetails = function(appName){
        $window.location.href = "/#/appdetails/"+appName;
    };
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

});

// Note that $uibModalInstance represents a modal window (instance) dependency.
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