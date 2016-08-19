fihApp.controller('AppStatusCtrl', function($scope, $resource, $window, $routeParams, $sce, $interval, $http, $location){
    
    $scope.pageHeader = "Application Deployment Status";

    var apiType= $routeParams.apitype;
    var Apis = $resource('/fih/apis/name/'+apiType);
    Apis.get(function(api){
        console.log("APIs Details: "+JSON.stringify(api));
        $scope.apiDetails = api;
    });

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
        var queueStatusUrl = $scope.apiDetails.api_ep + '/FIH/service/DAASAPI/JenkinUtility/GetBuildNumber?buildIdentifier='+$routeParams.buildidentifier;
        
        $scope.RefreshQueueStatus = $interval(function () {

            $http.get(queueStatusUrl).then(function (res) {
                var buildNumber = 0;
                buildNumber = res.data.response.buildNumber;
                console.log("Build Number:"+buildNumber);
                if(buildNumber > 0){
                    var logURL = res.data.response.logURL;
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
        
        $scope.RefreshIFrame = $interval(function () {
            if($scope.apiDetails){
                var statusUrl = $scope.apiDetails.api_ep + '/FIH/service/DAASAPI/JenkinUtility/GetStatus?buildNumber='+$routeParams.buildno;
            
                $http.get(statusUrl).then(function (res) {
                    var appStatus = res.data.response.status;
                    var appStage = res.data.response.stage;
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
                            dirty: false
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
            }
        }, 7000);
    }
    
});
