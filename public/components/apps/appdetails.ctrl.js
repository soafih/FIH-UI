
fihApp.controller('AppDetailsCtrl', function ($scope, $routeParams, userProfile, $timeout, $resource, $location, $anchorScroll, $filter, $uibModal, $window, $http) {
    $scope.applicationName = $routeParams.appname;
    $scope.showLabelAppDescr = true;
    $scope.showBtnDelete = userProfile.$hasPermission('app.delete');
    $scope.showBtnRestart = userProfile.$hasPermission('app.restart');
    $scope.showBtnRedeploy = userProfile.$hasPermission('app.deploy');
    $scope.showBtnUpdate = userProfile.$hasPermission('app.update');

    $scope.loader = {
        loading: false,
    };
    $scope.loader.loading = true;
    $scope.spinnerData = "Loading application data.. ";

    var AppUpdate = $resource('/fih/apps/updateStatus');

    $scope.alerts = [];
    $scope.addAlert = function (message) {
        $scope.alerts.push({ msg: message });
    };
    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.editImplDetails = function () {
        $scope.showEditableImplFields = true;
        $scope.showSavedMessage = false;
        $scope.editMessage = "";
        $scope.txtUpdatedQuery = $scope.appDetails.db_config.query;
        $scope.txtMaxWait = $scope.appDetails.db_config.max_wait;
        $scope.txtMaxIdle = $scope.appDetails.db_config.max_idle;
        $scope.txtMaxActive = $scope.appDetails.db_config.max_active;
    };

    $scope.scrollTo = function (id) {
        $location.hash(id);
        $anchorScroll();
    };

    $scope.saveImplDetails = function () {
        $scope.loader.loading = true;
        $scope.spinnerData = "Saving application data.. ";
        $scope.showEditableImplFields = false;
        console.log("Updating query " + $scope.txtUpdatedQuery + " for " + $scope.appDetails._id);
        var updateObj = {
            appObjectId: $scope.appDetails._id,
            dirty: true,
            expose_to_apigee: $scope.appDetails.expose_to_apigee,
            'db_config.query': $scope.txtUpdatedQuery,
            'db_config.max_active': $scope.txtMaxActive,
            'db_config.max_wait': $scope.txtMaxWait,
            'db_config.max_idle': $scope.txtMaxIdle,
            last_updated_by: 'System',
            last_updated_date: new Date()
        };
        AppUpdate.save(updateObj, function (res) {
            console.log($scope.appDetails._id + "Updated status: " + JSON.stringify(res));
            $scope.showSavedMessage = true;
            $scope.editMessage = "Updated.";
            $scope.msgColor = "#f0ad4e";
            $scope.appDetails.db_config.query = $scope.txtUpdatedQuery;
            $scope.appDetails.db_config.max_wait = $scope.txtMaxWait;
            $scope.appDetails.db_config.max_idle = $scope.txtMaxIdle;
            $scope.appDetails.db_config.max_active = $scope.txtMaxActive;
            $scope.addAlert('Updated Successfully. Redeploy application to reflect changes!');
            $scope.scrollTo("appheader");
            $scope.loader.loading = false;
        },
            function (error) {
                console.log("Failed in updating app query: " + JSON.stringify(error));
                $scope.showSavedMessage = true;
                $scope.editMessage = "Failed";
                $scope.msgColor = "red";
            });
    };

    $scope.cancelImplDetails = function () {
        $scope.showEditableImplFields = false;
        $scope.showSavedMessage = false;
        $scope.editMessage = "";
    };

    $scope.editAppDescr = function () {
        $scope.showLabelAppDescr = false;
        $scope.showTextAppDescr = true;
        $scope.updatedAppDesc = $scope.appDetails.descr;
    };

    $scope.saveAppDescr = function () {

        $scope.showLabelAppDescr = true;
        $scope.showTextAppDescr = false;

        var updateObj = {
            appObjectId: $scope.appDetails._id,
            descr: $scope.updatedAppDesc,
            last_updated_by: 'System',
            last_updated_date: new Date()
        };
        AppUpdate.save(updateObj, function (res) {
            console.log($scope.appDetails._id + " Updated status: " + JSON.stringify(res));
            $scope.appDetails.descr = $scope.updatedAppDesc;
        },
            function (error) {
                console.log("Failed in updating app description: " + JSON.stringify(error));
            });
    };

    $scope.cancelAppDescr = function () {
        $scope.showLabelAppDescr = true;
        $scope.showTextAppDescr = false;
        $scope.updatedAppDesc = $scope.appDetails.descr;
    };

    $scope.openDialog = function (action) {
        console.log("Action being performed:" + action);

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
            if (action === 'delete') {
                $scope.deleteApp();
            }
            else if (action === 'redeploy') {
                $scope.redeployApp();
            }
        }, function () {
            console.log('Modal Action dismissed: ' + action);
        });
    };

    $scope.redeployApp = function () {
        $scope.loader.loading = true;
        $scope.spinnerData = "Processing application data for redeployment.. ";
        var appObjectId = $scope.appDetails._id;
        var buildAppRequest = {
            "organization": $scope.appDetails.stackato_config.org,
            "space": $scope.appDetails.stackato_config.space,
            "domain": $scope.appDetails.stackato_config.domain,
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
        $http.post($scope.apiDetails.api_ep + '/FIH/service/DAASAPI/BuildApp', buildAppRequest, headerConfig, { dataType: "jsonp" })
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
                    build_identifier: response.response.buildIdentifier,
                    dirty: true
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
                            $scope.loader.loading = false;
                            console.log("Successfully updated App status: " + JSON.stringify(res));
                            redirectUrl = '/#/appstatus?apitype=' + $scope.appDetails.api_type + '&appname=' + $scope.appDetails.name + '&appId=' + appObjectId + '&buildappstatus=queued&buildidentifier=' + updateObj.build_identifier;
                            console.log("URL to redirect: " + redirectUrl);
                            $window.location.href = redirectUrl;
                        },
                            function (error) {
                                handleAppBuildFailure(error);
                            });

                        break;

                    case "WIP":
                        AppUpdate.save(updateObj, function (res) {
                            $scope.loader.loading = false;
                            console.log("Successfully updated App status: " + JSON.stringify(res));
                            redirectUrl = '/#/appstatus?apitype=' + $scope.appDetails.api_type + '&appname=' + $scope.appDetails.name + '&appId=' + appObjectId + '&buildappstatus=wip&buildno=' + updateObj.build_number + '&buildurl=' + encodeURIComponent(updateObj.build_url);
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
            $scope.loader.loading = false;
            console.log(JSON.stringify("Recieved Error From Build API: " + JSON.stringify(error)));
            appStatus = 'Failed';
            var updateObj = {
                appObjectId: appObjectId,
                status: appStatus,
            };
            var AppUpdate = $resource('/fih/apps/updateStatus');
            AppUpdate.save(updateObj, function (res) {
                var redirectUrl = '/#/appstatus?apitype=' + $scope.appDetails.api_type + '&appname=' + $scope.appDetails.name + '&appId=' + appObjectId + '&buildappstatus=failed&reason=' + error;
                console.log("URL to redirect: " + redirectUrl);
                $window.location.href = redirectUrl;
            },
                function (error) {
                    console.log("Failed in updating app status: " + JSON.stringify(error));
                });
        }
    };

    $scope.deleteApp = function () {
        $scope.loader.loading = true;
        $scope.spinnerData = "Deleting application.. ";
        var StackatoService = $resource('/fih/stackatoapis/apps/' + $scope.appGUID);
        StackatoService.delete(function (res) {
            var appDeleteStatus = JSON.stringify(res);
            console.log(res + " Stackato App Delete Status: " + appDeleteStatus);
            if (res.success) {
                var AppService = $resource('/fih/apps/name/' + $scope.applicationName);
                AppService.delete(function (res) {
                    console.log("Deleted App: " + res);
                    $scope.loader.loading = false;
                    $scope.openDialog("deleteCompleted");
                    $location.path('/#/apps');
                });
            }
            else {
                $scope.loader.loading = false;
                if (res.message) {
                    console.log("Delete failed with reason: "+res.message);
                    $scope.openDialog("deleteFailed");
                }
                else {
                    $scope.openDialog("deleteFailed");
                }
            }
        });
    };

    var init = function () {

        var StackatoService = $resource('/fih/stackatoapis/apps/' + $scope.applicationName);
        StackatoService.get(function (app) {
            console.log("APP GUID: " + app.guid);
            $scope.appGUID = app.guid;
        });

        var AppService = $resource('/fih/apps/name/' + $scope.applicationName);
        AppService.get(function (appDetails) {
            console.log("Fetched app details: " + JSON.stringify(appDetails));

            var Apis = $resource('/fih/apis/name/' + appDetails.api_type);
            Apis.get(function (api) {
                $scope.apiDetails = api;
                console.log("Fetched api details: " + JSON.stringify($scope.apiDetails));
            });

            $scope.appDetails = appDetails;
            $scope.appSummary = [
                { "API Type": appDetails.api_type },
                { "API Version": appDetails.api_ver },
                { "Status": appDetails.status },
                { "Stage": appDetails.stage },
                { "Created": $filter('date')(appDetails.created_date, "yyyy-MM-dd HH:mm:ss") },
                { "Created By": appDetails.created_by },
                { "Last Updated": $filter('date')(appDetails.last_updated_date, "yyyy-MM-dd HH:mm:ss") },
                { "Last Updated By": appDetails.last_updated_by }
            ];

            var DBService = $resource('/fih/dbconfig/name/' + appDetails.db_config.db_name);
            DBService.get(function (dbconfig) {
                console.log("Fetched database details: " + JSON.stringify(dbconfig));
                $scope.databaseInfo = dbconfig;
                $scope.dbDetails = [
                    { "Name": dbconfig.db_name },
                    { "Type": dbconfig.db_type },
                    { "Host": dbconfig.host },
                    { "Port": dbconfig.port },
                    { "User": dbconfig.uname },
                    { "Schema": dbconfig.schema }
                ];
                $scope.loader.loading = false;
            });
            console.log("appDetails.dirty: " + $scope.appDetails.dirty);
            if ($scope.appDetails.dirty == true) {
                console.log('Dirty App');
                $scope.addAlert('App changes pending. Redeploy to reflect changes!');
            }


        });

    };

    init();
});

fihApp.controller('AppDetailModalInstanceCtrl', function ($scope, $uibModalInstance, action) {
    console.log('Action Ctrl:' + action);
    if (action === 'delete') {
        $scope.modalTitle = 'Delete Application';
        $scope.modalMessage = 'All application data will be deleted. This action cannot be undone!';
        $scope.modalActionBtnText = 'Delete';
        $scope.modalActionBtnType = 'btn-danger';
    }
    else if (action === 'redeploy') {
        $scope.modalTitle = 'Redeploy Application';
        $scope.modalMessage = 'Application redeployment request will be triggered!';
        $scope.modalActionBtnText = 'Redeploy';
        $scope.modalActionBtnType = 'btn-primary';
    }
    else if (action === 'deleteCompleted') {
        $scope.modalTitle = 'Message Box';
        $scope.modalMessage = 'Application deleted successfully.!';
        $scope.modalHideActionBtn = true; 
    }
    else if (action === 'deleteFailed') {
        $scope.modalTitleStyle = "red";
        $scope.modalTitle = 'Message Box';
        $scope.modalMessage = 'Application deletion failed.!';
        $scope.modalHideActionBtn = true; 
    }

    $scope.ok = function () {
        $uibModalInstance.close();
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});