fihApp.controller('AddAppCtrl', function ($scope, $window, $http, $resource, $location, $uibModal, $filter,
    $routeParams, NgTableParams, databaseList, userProfile) {

    $scope.pageHeader = "Application / Integration Service Configuration";
    $scope.reNamepattern = /^[a-z0-9](-*[a-z0-9]+)*$/i;
    $scope.previousBtnDisabled = true;
    $scope.changeActiveTab = function (selectedTab) {
        switch (selectedTab) {
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

    $scope.resetQuery = function () {
        $scope.app.db_query = null;
        $scope.disableCreateBtn = true;
        $scope.disableQueryText = false;
    };

    $scope.testQuery = function () {
        $scope.spinnerData = "Loading query result.. ";
        $scope.loader.loading = true;
        console.log("Calling Test Query service.." + JSON.stringify($scope.app.dbconfig));
        $scope.queryResponse = '';
        $scope.showQueryLabel = false;
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
            $http.post($scope.apiDetails.api_ep + '/FIH/service/DAASAPI/DBUtility/ValidateQuery', testQueryRequest, headerConfig, { dataType: "jsonp" })
                .success(function (response, status, headers, config) {
                    console.log("Successfully invoked BuildAPI with response: " + JSON.stringify(response));
                    if (response.response.status == "Success") {
                        $scope.queryResult = response.response.status;
                        $scope.queryResultColor = "green";
                        $scope.testQueryResult = response.response.DataCollection.Data;
                        $scope.disableCreateBtn = false;
                        $scope.showQueryLabel = false;
                        //$scope.disableQueryText = true;
                        $scope.loader.loading = false;
                        $scope.openResultModal();
                    }
                    else {
                        $scope.queryResponse = response.response.errorDetails;
                        $scope.disableCreateBtn = true;
                        $scope.showQueryLabel = true;
                        $scope.disableQueryText = false;
                        $scope.loader.loading = false;
                    }
                }, function (error) {
                    console.log("Failed to connect to DataSource Service: " + JSON.stringify(error));
                    $scope.queryResponse = "Error in connection with Datasource Service.";
                    $scope.disableCreateBtn = true;
                    $scope.showQueryLabel = true;
                    $scope.disableQueryText = false;
                    $scope.loader.loading = false;
                });

        }
        else {
            $scope.spinnerData = "";
            $scope.loader.loading = false;
            $scope.errorMsgs = [];
            $scope.errorMsgs.push({ error: "Please select database from Database Connection Info Tab.." });
            $scope.activeTab = 1;
            $scope.validationModal();
        }
    };

    $scope.animationsEnabled = false;
    $scope.openResultModal = function () {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'myModalContent.html',
            controller: 'ModalQueryInstanceCtrl',
            size: 'lg',
            resolve: {
                testQueryResult: function () {
                    console.log("scope.testQueryResult: " + JSON.stringify($scope.testQueryResult));
                    return $scope.testQueryResult;
                }
            }
        });

        modalInstance.result.then(function () {

        }, function () {
            console.log('Modal dismissed at: ' + new Date());
        });
    };


    $scope.validationModal = function () {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'validationModalContent.html',
            controller: 'ModalValidationCtrl',
            size: 'md',
            resolve: {
                errors: function () {
                    return $scope.errorMsgs;
                }
            }
        });
    };

    $scope.validate = function () {
        $scope.errorMsgs = [];
        var valid = true;

        if ($scope.app.name == null) {
            $scope.errorMsgs.push({ error: "Application name can not be blank and can contain only the characters in (a-z A-Z 1-9 -)and should start and end with letter or number" });
        }
        else {

            var Apps = $resource('/fih/apps/name/' + $scope.app.name);
            Apps.get(function (appDetails) {
                if (appDetails.name != null && (appDetails.stackato_config.org == $scope.app.selectedOrg.name) && (appDetails.stackato_config.space == $scope.app.selectedSpace))
                    $scope.errorMsgs.push({ error: "Duplicate Application. The application with same name already exists" });
            });
        }

        if ($scope.app.descr == null) {
            $scope.errorMsgs.push({ error: "Application description can not be blank" });
        }

        if ($scope.app.db_query == null) {
            $scope.errorMsgs.push({ error: "Query can not be blank" });
        }

        if ($scope.errorMsgs.length > 0) {
            $scope.validationModal();
            valid = false;
        }
        return valid;
    };

    $scope.app = {};
    $scope.app.dbconfig = {};
    $scope.apitype = $routeParams.apitype;

    $scope.createApp = function () {
        console.log(userProfile.$hasRole("app.deploy"));
        if (!$scope.validate()) {
            return;
        }
        console.log("Domain selected:" + $scope.app.selectedOrg.domain);
        $scope.spinnerData = "Processing application data.. ";
        $scope.loader.loading = true;
        $scope.hidePanel = true;
        $scope.app.name = $scope.app.name.replace("_", "-");
        var formattedDate = new Date();
        var maxActive = ($scope.app.dbconfig.max_active === undefined ? '50' : $scope.app.dbconfig.max_active);
        var maxIdle = ($scope.app.dbconfig.max_idle === undefined ? '30' : $scope.app.dbconfig.max_idle);
        var maxWait = ($scope.app.dbconfig.max_wait === undefined ? '10000' : $scope.app.dbconfig.max_wait);
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
            messages: [{ message: 'First Version' }],
            stackato_config: {
                org: $scope.app.selectedOrg.name,
                space: $scope.app.selectedSpace,
                domain: $scope.app.selectedOrg.domain
            },
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
        Apps.save(appPostRequest, function (app) {
            appCurrentState = 'Saved';
            appObjectId = app._id;
        }, function (error) {
            appCurrentState = 'SaveFailed';
        });

        if (appCurrentState == 'SaveFailed') {
            var redirectUrl = '/#/appstatus?appId=' + appObjectId;
            console.log("Failed to save application details in database. Redirect to: " + redirectUrl);
            $window.location.href = redirectUrl;
        }
        else {
            var buildAppRequest = {
                "organization": $scope.app.selectedOrg.name,
                "space": $scope.app.selectedSpace,
                "domain": $scope.app.selectedOrg.domain,
                "applicationName": $scope.app.name,
                "query": $scope.app.db_query,
                "databaseInfo":
                {
                    "databaseType": $scope.app.dbconfig.db_type,
                    "hostName": $scope.app.dbconfig.host,
                    "port": $scope.app.dbconfig.port,
                    "databaseName": $scope.app.dbconfig.db_name,
                    "schema": $scope.app.dbconfig.schema,
                    "user": $scope.app.dbconfig.uname,
                    "password": $scope.app.dbconfig.pwd
                },
                "connectionAttr":
                {
                    "maxActive": maxActive,
                    "maxIdle": maxIdle,
                    "maxWait": maxWait
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

                })
                .error(function (data, status, headers, config) {
                    handleAppBuildFailure();
                });
        }

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

    $scope.orgChange = function () {
        console.log("Selected Org: " + $scope.app.selectedOrg.name);
        var key = $scope.stackatoOrgs.indexOf($scope.app.selectedOrg);
        $scope.stackatoSpace = $scope.stackatoOrgs[key].spaces;
        $scope.app.selectedSpace = $scope.stackatoSpace[0];
    };

    var init = function () {
        $scope.spinnerData = "Loading page data..";
        $scope.loader.loading = true;
        var orgs = userProfile.stackato_config;
        console.log("orgs: " + JSON.stringify(orgs));
        $scope.stackatoOrgs = orgs;
        $scope.stackatoOrg = orgs;
        $scope.app.selectedOrg = orgs[0];
        $scope.stackatoSpace = $scope.stackatoOrgs[0].spaces;
        $scope.app.selectedSpace = $scope.stackatoSpace[0];
        $scope.loader.loading = false;

        var Apis = $resource('/fih/apis/name/' + $scope.apitype);
        Apis.get(function (api) {
            if(api.name){
                console.log("APIs Details: " + JSON.stringify(api));
                $scope.apiDetails = api;
            }
            else{
                $scope.errorMsgs = [];
                $scope.errorMsgs.push({ error: "API not found! Please select one of the listed API from Marketplace." });
                $scope.validationModal();
                $location.path('/');
                return;
            }
        });
    };
    init();
});

fihApp.factory('databaseListFactory', function ($http) {
    var factoryResult = {
        getDatabaseList: function () {
            var promise = $http({
                method: 'GET',
                url: '/fih/dbconfig'
            }).success(function (data, status, headers, config) {
                return data;
            });

            return promise;
        }
    };

    return factoryResult;
});

fihApp.controller('ModalQueryInstanceCtrl', function ($scope, $uibModalInstance, testQueryResult) {

    $scope.testQueryResult = testQueryResult;

    /*$scope.ok = function () {
        $uibModalInstance.close($scope.selected.item);
    };*/

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

fihApp.controller('ModalValidationCtrl', function ($scope, $uibModalInstance, errors) {

    $scope.validationErrors = errors;

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});