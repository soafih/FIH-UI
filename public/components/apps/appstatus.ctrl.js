fihApp.controller('AppStatusCtrl', function($scope, $resource, $window, $routeParams, $sce, $interval, $http, $location, prompt){
    
    $scope.pageHeader = "Application Deployment Status";

    $scope.loader = {
        loading: false,
    };
    $scope.loader.loading = true;
    
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

    $scope.openPrompt = function(message){
        prompt({
            title: 'Alert!',
            containHtml: true,
            message: message,
            "buttons": [
                {
                    "label": "Close",
                    "cancel": false,
                    "primary": false
                }
            ]
        }).then(function(){
            //he hit ok and not can,
        });
    };

    $scope.toggleIFrame = false;
    $scope.toggleDisplayLogs = function(){
        $scope.toggleIFrame = !$scope.toggleIFrame;
        if($scope.toggleIFrame){
            $scope.showLogText = 'Hide Logs';
            $scope.hideLogText = 'Show Logs';
        }
        else{
            $scope.showLogText = 'Show Logs';
            $scope.hideLogText = 'Hide Logs';
        }
    };

    var appObjectId = $routeParams.appId;

    var init = function () {
        
        var Apps = $resource('/fih/apps/objectid/' + appObjectId);
        Apps.get(function (app) {
            console.log("APPs Details: " + JSON.stringify(app));
            $scope.appDetails = app;
            $scope.appName = app.name;
            
            var Apis = $resource('/fih/apis/name/' + $scope.appDetails.api_type);
            Apis.get(function (api) {
                console.log("APIs Details: " + JSON.stringify(api));
                $scope.apiDetails = api;
                $scope.loader.loading = false;
                loadPageData();
            });
        });
    };
    init();

    function showSSLWarning() {
        var messageSSL = $sce.trustAsHtml('Please ensure self-signed HTTPS certificate has been accepted/added to exception list! ' +
            'Click on link below and accept certificate or contact system administrator for detail.'+
            '<br><a href="' + $scope.apiDetails.api_ep + '" target="_blank">' + $scope.apiDetails.api_ep) +
            '<br><a href="' + $scope.buildUrl || $scope.logURL + '" target="_blank">' + $scope.buildUrl || $scope.logURL ;
        console.log(messageSSL);
        $scope.openPrompt(messageSSL);
    }

    var loadPageData = function () {
        console.log("Loading page data..");
        var buildappstatus = $scope.appDetails.status;
        var buildStage = $scope.appDetails.stage;
        $scope.appCurrentState = buildappstatus;
        console.log("Received Build Status: " + buildappstatus + " | Stage: " + buildStage);
        var AppUpdate = $resource('/fih/apps/updateStatus');
        if (buildappstatus == 'Queued') {
            $scope.barState = $scope.appStateObj[$scope.appCurrentState];
            var queueStatusUrl = $scope.apiDetails.api_ep + '/FIH/service/DAASAPI/JenkinUtility/GetBuildNumber?buildIdentifier=' + $scope.appDetails.build_identifier;

            $scope.RefreshQueueStatus = $interval(function () {

                $http.get(queueStatusUrl).then(function (res) {
                    if(res){
                        var buildNumber = 0;
                        buildNumber = res.data.response.buildNumber;
                        console.log("Build Number:" + buildNumber);
                        if (buildNumber > 0) {
                            $scope.logURL = res.data.response.logURL;
                            var updateObj = {
                                appObjectId: appObjectId,
                                status: 'WIP',
                                stage: 'Triggered',
                                build_number: buildNumber,
                                build_url: $scope.logURL
                            };

                            AppUpdate.save(updateObj, function (res) {
                                console.log("Updated status: " + JSON.stringify(res));
                            },
                                function (error) {
                                    console.log("Failed in updating app status: " + JSON.stringify(error));
                                });

                            redirectUrl = '/#/appstatus?appId=' + appObjectId;
                            console.log("URL to redirect: " + redirectUrl);
                            $interval.cancel($scope.RefreshQueueStatus);
                            //$location.path(redirectUrl);
                            $window.location.href = redirectUrl;
                        }
                        else {
                            $window.location.reload(true);
                        }
                    }
                    else{
                        $scope.loader.loading = false;
                        showSSLWarning();
                    }
                });

            }, 10000);
        }
        else if (buildappstatus == 'Failed') {
            $scope.buildUrl = $sce.trustAsResourceUrl($scope.appDetails.build_url);
            if (!buildStage) {
                buildStage = "QueueFailed";
            }
            $scope.barState = $scope.appStateObj[buildappstatus][buildStage];
        }
        else if (buildappstatus == 'Success') {
            $scope.buildUrl = $sce.trustAsResourceUrl($scope.appDetails.build_url);
            $scope.barState = $scope.appStateObj[buildappstatus];
        }
        else if (buildappstatus == 'WIP') {
            if (buildStage) {
                buildStage = "Triggered";
            }
            $scope.barState = $scope.appStateObj[buildappstatus][buildStage];
            $scope.buildUrl = $sce.trustAsResourceUrl($scope.appDetails.build_url);
            var cancelInterval = false;

            $scope.RefreshIFrame = $interval(function () {
                if ($scope.apiDetails) {
                    var statusUrl = $scope.apiDetails.api_ep + '/FIH/service/DAASAPI/JenkinUtility/GetStatus?buildNumber=' + $scope.appDetails.build_number;
                    console.log("BuildAPI Status URL:" + statusUrl);
                    $http.get(statusUrl).then(function (res) {
                        if(res){
                            console.log("Response Status: " + JSON.stringify(res));
                            var appStatus = res.data.response.status;
                            var appStage = res.data.response.stage;
                            $scope.appCurrentState = appStatus;

                            if (appStatus == "Success") {
                                console.log("Received " + appStatus + " For BuildAPI. Stoping page refresh..");
                                $interval.cancel($scope.RefreshIFrame);
                                $scope.barState = $scope.appStateObj[$scope.appCurrentState];
                                $scope.buildUrl = $sce.trustAsResourceUrl($scope.appDetails.build_url + '?dummyVar=' + (new Date()).getTime());

                                var updateObj = {
                                    appObjectId: appObjectId,
                                    status: appStatus,
                                    stage: appStage,
                                    dirty: false
                                };
                                AppUpdate.save(updateObj, function (res) {
                                    console.log("Updated status: " + JSON.stringify(res));
                                },
                                    function (error) {
                                        console.log("Failed in updating app status: " + JSON.stringify(error));
                                    });
                            }
                            else if (appStatus == "Failed") {
                                console.log("Received " + appStatus + " from BuildAPI. Stoping page refresh..");
                                $interval.cancel($scope.RefreshIFrame);
                                if (res.data.response.stage) {
                                    $scope.appCurrentStage = res.data.response.stage;
                                }
                                else {
                                    $scope.appCurrentStage = "QueueFailed";
                                }
                                $scope.barState = $scope.appStateObj[$scope.appCurrentState][$scope.appCurrentStage];
                                $scope.buildUrl = $sce.trustAsResourceUrl($scope.appDetails.build_url + '?dummyVar=' + (new Date()).getTime());

                                var updateObjFailed = {
                                    appObjectId: appObjectId,
                                    status: appStatus,
                                    stage: appStage,
                                };
                                console.log('Updating status: ' + JSON.stringify(updateObjFailed));
                                AppUpdate.save(updateObjFailed, function (res) {
                                    console.log("Updated status: " + JSON.stringify(res));
                                },
                                    function (error) {
                                        console.log("Failed in updating app status: " + JSON.stringify(error));
                                    });
                            }
                            else if (appStatus == "WIP") {
                                console.log("Reloading Page...");
                                $scope.barState = $scope.appStateObj[$scope.appCurrentState][appStage];
                                $scope.buildUrl = $sce.trustAsResourceUrl($scope.appDetails.build_url + '?dummyVar=' + (new Date()).getTime());

                                var updateObjWIP = {
                                    appObjectId: appObjectId,
                                    status: appStatus,
                                    stage: appStage,
                                };
                                AppUpdate.save(updateObjWIP, function (res) {
                                    console.log("Updated status: " + JSON.stringify(res));
                                },
                                    function (error) {
                                        console.log("Failed in updating app status: " + JSON.stringify(error));
                                    });
                            }
                        }
                        else{
                            $scope.loader.loading = false;
                            showSSLWarning();
                        }
                    });
                }
            }, 7000);
        }
    };
});
