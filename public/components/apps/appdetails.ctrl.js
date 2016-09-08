
fihApp.controller('AppDetailsCtrl', function ($scope, $routeParams, $sce, userProfile, $resource, $location, 
        $anchorScroll, $filter, $uibModal, $window, $http) {
    $scope.applicationName = $routeParams.appname;
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
        if ($scope.appDetails.db_config.query == $scope.txtUpdatedQuery &&
            $scope.appDetails.db_config.max_wait == $scope.txtMaxWait &&
            $scope.appDetails.db_config.max_idle == $scope.txtMaxIdle &&
            $scope.appDetails.db_config.max_active == $scope.txtMaxActive) {
            $scope.showEditableImplFields = false;
            $scope.showSavedMessage = false;
            $scope.editMessage = "";
            return;
        }
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
        $scope.showTextAppDescr = true;
        $scope.updatedAppDesc = $scope.appDetails.descr;
    };

    $scope.saveAppDescr = function () {

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
        $scope.showTextAppDescr = false;
        $scope.updatedAppDesc = $scope.appDetails.descr;
    };

    $scope.openDialog = function (action, message) {
        console.log("Action being performed:" + action);

        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'modalDialog.html',
            controller: 'AppDetailModalInstanceCtrl',
            size: 'sm',
            resolve: {
                action: function () {
                    return action;
                },
                message: function () {
                    return message;
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

    function showSSLWarning() {
        var messageSSL = $sce.trustAsHtml('Please ensure self-signed HTTPS certificate has been accepted/added to exception list! ' +
            'Click on link below and accept certificate or contact system administrator for detail.<br><a href="' + $scope.apiDetails.api_ep + '" target="_blank">' + $scope.apiDetails.api_ep);
        console.log(messageSSL);
        $scope.openDialog("errorWithHtml", messageSSL);
    }
    
    $scope.redeployApp = function () {
        if (!$scope.apiDetails.api_ep) {
            $scope.openDialog("error", 'API endpoint is not defined. Application cannot be redeployed!\nPlease verify API type.');
            return;
        }
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
                if (response) {
                    $scope.isBuildCallCompleted = true;
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
                                redirectUrl = '/#/appstatus?appId=' + appObjectId;
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
                                redirectUrl = '/#/appstatus?appId=' + appObjectId;
                                console.log("URL to redirect: " + redirectUrl);
                                $window.location.href = redirectUrl;
                            },
                                function (error) {
                                    handleAppBuildFailure(error);
                                });

                            break;
                    }
                }
                else{
                    $scope.loader.loading = false;
                    showSSLWarning();
                }
            })
            .error(function (data, status, headers, config) {
                $scope.isBuildCallCompleted = true;
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
                var redirectUrl = '/#/appstatus?appId=' + appObjectId + '&reason=' + error;
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
            console.log("Stackato App Delete Status: " + JSON.stringify(res));
            if (res.success) {
                var AppService = $resource('/fih/apps/name/' + $scope.applicationName);
                AppService.delete(function (res) {
                    console.log("Deleted App: " + res);
                    $scope.loader.loading = false;
                    $scope.openDialog("deleteCompleted", 'Application deleted successfully!');
                    $location.path('/#/apps');
                });
            }
            else {
                $scope.loader.loading = false;
                if (res.status_code == 401 || res.status_code == 403) {
                    return;
                }
                else{
                    if (res.message) {
                        console.log("App Deletion failed with reason: " + res.message);
                        $scope.openDialog("deleteFailed", 'App Deletion failed with reason: ' + res.message);
                    }
                    else {
                        $scope.openDialog("deleteFailed", 'App Deletion failed!');
                    }
                }
            }
        });
    };

    $scope.showAppLogs = function () {
        var redirectUrl = '/appstatus?appId=' + $scope.appDetails._id;
        console.log("URL to redirect: " + redirectUrl);
        $location.path(redirectUrl);
        //$window.location.href = redirectUrl;
    };

    var init = function () {

        var AppService = $resource('/fih/apps/name/' + $scope.applicationName);
        AppService.get(function (appDetails) {
            console.log("Fetched app details: " + JSON.stringify(appDetails));
            if (appDetails._id) {
                var Apis = $resource('/fih/apis/name/' + appDetails.api_type);
                Apis.get(function (api) {
                    $scope.apiDetails = api;
                    console.log("Fetched api details: " + JSON.stringify($scope.apiDetails));
                });

                var StackatoService = $resource('/fih/stackatoapis/apps/' + $scope.applicationName);
                StackatoService.get(function (app) {
                    console.log("APP GUID: " + app.guid);
                    $scope.appGUID = app.guid;
                });

                appDetails.created_date = $filter('date')(appDetails.created_date, "yyyy-MM-dd HH:mm:ss");
                appDetails.last_updated_date = $filter('date')(appDetails.last_updated_date, "yyyy-MM-dd HH:mm:ss");
                $scope.appDetails = appDetails;

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
                if ($scope.appDetails.dirty === true) {
                    console.log('Dirty App');
                    $scope.addAlert('App changes pending. Redeploy to reflect changes!');
                }
            }
            else{
                $scope.openDialog("error", "Application not found! Please selected one of listed Applications / Integration Services");
                $location.path('/apps');
                return;
            }
        });
    };
    init();
});

fihApp.controller('AppDetailModalInstanceCtrl', function ($scope, $uibModalInstance, action, message) {
    console.log('Action Ctrl:' + action);
    $scope.btnCancelText = "Cancel";
    $scope.modalMessage = message;
    $scope.modalContainHtml = false;
    if (action === 'delete') {
        $scope.modalTitleStyle = "amber";
        $scope.modalTitle = 'Delete Application';
        $scope.modalActionBtnText = 'Delete';
        $scope.modalActionBtnType = 'btn-danger';
    }
    else if (action === 'redeploy') {
        $scope.modalTitleStyle = "grey";
        $scope.modalTitle = 'Redeploy Application';
        $scope.modalActionBtnText = 'Redeploy';
        $scope.modalActionBtnType = 'btn-primary';
    }
    else if (action === 'deleteCompleted') {
        $scope.modalTitleStyle = "green";
        $scope.modalTitle = 'Alert';
        $scope.modalHideActionBtn = true;
    }
    else if (action === 'deleteFailed') {
        $scope.modalTitleStyle = "red";
        $scope.modalTitle = 'Alert';
        $scope.modalHideActionBtn = true;
    }
    else if (action === 'error') {
        $scope.modalTitleStyle = "red";
        $scope.modalTitle = 'Alert';
        $scope.modalHideActionBtn = true;
        $scope.btnCancelText = "Close";
    }
    else if (action === 'errorWithHtml') {
        $scope.modalTitleStyle = "red";
        $scope.modalTitle = 'Alert';
        $scope.modalHideActionBtn = true;
        $scope.btnCancelText = "Close";
        $scope.modalContainHtml = true;
    }

    $scope.ok = function () {
        $uibModalInstance.close();
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});