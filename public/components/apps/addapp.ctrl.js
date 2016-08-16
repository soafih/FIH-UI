
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


fihApp.controller('ModalQueryInstanceCtrl', function ($scope, $rootScope, $uibModalInstance, testQueryResult) {

    $scope.testQueryResult = testQueryResult;

    /*$scope.ok = function () {
        $uibModalInstance.close($scope.selected.item);
    };*/

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

fihApp.controller('AddAppCtrl', function($scope, DAASAPI_URL, DOMAIN_URL, $rootScope, $window, $http, $resource, $location, $uibModal, $filter,$routeParams, NgTableParams, databaseList){
        
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
        $scope.spinnerData = "Loading query result.. ";
        $scope.loader.loading = true;
        console.log("Calling Test Query service.."+JSON.stringify($scope.app.dbconfig));
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

        modalInstance.result.then(function () {

        }, function () {
            console.log('Modal dismissed at: ' + new Date());
        });
    };

    $scope.app = {};
    $scope.app.dbconfig= {};
    $scope.apitype = $routeParams.apitype;
    
    $scope.createApp = function(){
        $scope.spinnerData = "Processing application data.. ";
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
            domain: DOMAIN_URL,
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
                "domain": DOMAIN_URL,
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
        $scope.spinnerData = "Loading page data..";
        $scope.loader.loading = true;
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
            $scope.loader.loading = false;
        });
    };
    // and fire it after definition
    init();
    
});
