fihApp.controller('dbconfigctrl', function ($scope, $uibModal, $filter, $resource, NgTableParams, databaseListFactory, ConnectionData, TestQuery, prompt) {
 
   
 var init = function ()
 {
      $scope.pageHeader = "Database Configurations";
  var Apis = $resource('/fih/apis/name/DAAS');
        Apis.get(function (api) {
            if(api.name){
                console.log("APIs Details: " + JSON.stringify(api));
                $scope.apiDetails = api;
            }
            else{
                console.log("Error getting the API details");
            }
        });
 }

 init();
    $scope.$watch('status', function () {
       
        databaseListFactory.getDatabaseList().then(function (response) {
             $scope.app.dbconfig = {};
            $scope.databases = response.data;
            $scope.databaseTable = new NgTableParams({},
                {
                    total: $scope.databases.length,
                    getData: function (params) {
                        $scope.data = params.sorting() ? $filter('orderBy')($scope.databases, params.orderBy()) : $scope.databases;
                        $scope.data = params.filter() ? $filter('filter')($scope.data, params.filter()) : $scope.data;
                    }
                });
        });
    });




    $scope.app = {};
    $scope.app.dbconfig = {};


    $scope.do = function (action) {
        if (action == 'Create') {
            $scope.app.dbconfig = {};
        }
        else {

            if ($scope.app.dbconfig.db_name == undefined) {
                prompt({
                    title: 'Warning',
                    message: 'Please select the database connection to be updated',
                    buttons: [
                        {
                            "label": "Ok",
                            "cancel": true,
                            "primary": true
                        }
                    ]
                }).then(function (result) {

                });

                return;
            }
        }
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'registerDatabase.html',
            controller: 'registerDatabaseCtrl',
            size: 'lg',
            resolve: {
                action: function () {
                    return action;
                },
                dbConf: function () {
                    return $scope.app.dbconfig;
                }
            }
        });

        modalInstance.result.then(function () {

            if (action == 'Create') {
                var db = $resource('/fih/dbconfig');
                db.save(ConnectionData.message, function (app) {
                }, function (error) {
                    console.log("Error occured");
                });
            }

            if (action == 'Update') {
                var db = $resource('/fih/dbconfig/update');
                db.save(ConnectionData.message, function (app) {
                }, function (error) {
                    console.log("Error occured");
                });
            }

            $scope.status = 'update' + (new Date()).getTime();
          
        }, function () {
            console.log('Modal Action dismissed');
        });


    };

    $scope.Delete = function () {

        if ($scope.app.dbconfig.db_name == undefined) {
            prompt({
                title: 'Warning',
                message: 'Please select the database connection to be deleted',
                buttons: [
                    {
                        "label": "Ok",
                        "cancel": true,
                        "primary": true
                    }
                ]
            }).then(function (result) {

            });

            return;
        }

        prompt({
            title: 'Confirm Delete',
            message: 'Are you sure you want to do delete connection - ' + $scope.app.dbconfig.db_name + '?',
            buttons: [
                {
                    "label": "Confirm Delete",
                    "cancel": false,
                    "primary": false
                },
                {
                    "label": "Cancel",
                    "cancel": true,
                    "primary": false
                }
            ]
        }).then(function (result) {
            if (result.label == "Confirm Delete") {
                var db = $resource('/fih/dbconfig/' + $scope.app.dbconfig._id);
                db.delete(function (app) {
                    $scope.status = 'update' + (new Date()).getTime();
                    console.log($scope.status + "in Delete");
                }, function (error) {
                    console.log("Error occured");
                });
            }
        });


    }

    $scope.testQuery = function (dbconfigs) {
       
        var testQueryRequest = {

            "databaseInfo": {
                "databaseType": dbconfigs.db_type,
                "hostName": dbconfigs.host,
                "port": dbconfigs.port,
                "databaseName": dbconfigs.db_name,
                "schema": dbconfigs.schema,
                "user": dbconfigs.uname,
                "password": dbconfigs.pwd
            }
        };


        TestQuery.testQuery(testQueryRequest,  $scope.apiDetails.api_ep).then(function (resp) {
            console.log(resp);
            var status = resp.data.response.status;
            var detail;
            if (status == "Success") {
                details = "Connection Successfull !!";
                titleStyle = "color:green";
            }
            else {
                details = resp.data.response.errorDetails;
                titleStyle = "color:red";
            }

            prompt({
                title: status,
                titleStyle: titleStyle,
                message: details,
                buttons: [
                    {
                        "label": "Ok",
                        "cancel": true,
                        "primary": true
                    }
                ]
            }).then(function (result) {

            });

        });
    }
});


fihApp.controller('registerDatabaseCtrl', function ($scope, $uibModalInstance, $resource, ConnectionData, action, dbConf) {

    $scope.db = {};
    $scope.db = dbConf;


    $scope.DBType = [
        { id: "oracle", name: "oracle" },
        { id: "as400", name: "as400" },
        { id: "MySQL", name: "MySQL" },
        { id: "SQL server", name: "SQL Server" }
    ];

    $scope.action = action;

    if ($scope.action == 'Create') {
        $scope.title = "Create new Database Connection";
        $scope.db.db_type = "oracle";
    }
    else
        $scope.title = "Update the Database Connection";

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.ok = function () {
        var dbPostRequest = {
            "_id": $scope.db._id,
            "db_type": $scope.db.db_type,
            "host": $scope.db.host,
            "port": $scope.db.port,
            "uname": $scope.db.uname,
            "pwd": $scope.db.pwd,
            "conn_string": "",
            "db_name": $scope.db.db_name,
            "schema": $scope.db.schema
        };


        ConnectionData.setMessage(dbPostRequest);
        $uibModalInstance.close();
    };
});


fihApp.factory("ConnectionData", function () {
    var ConnectionData = {};
    ConnectionData.message = {};
    ConnectionData.setMessage = function (message) {
        ConnectionData.message = message;
    };

    ConnectionData.getMessage = function () {
        return ConnectionData.message;
    };
    return ConnectionData;

});

fihApp.factory("TestQuery", function ($http) {
    var db = {};

    db.testQuery = function (DBRequest, APIendpoint) {

        var headerConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json;odata=verbose'
            }
        };
        console.log("Request: " + JSON.stringify(DBRequest));

        var promise = $http.post(APIendpoint+'/FIH/service/DAASAPI/DBUtility/ValidateConnection', DBRequest, headerConfig, { dataType: "jsonp" })
            .success(function (response, status, headers, config) {
                console.log("Successfully invoked BuildAPI with response: " + JSON.stringify(response));

                return response;
            }, function (error) {
                console.log("Failed to connect to DataSource Service: " + JSON.stringify(error));
            });

        return promise;
    }
    
    return db;

});