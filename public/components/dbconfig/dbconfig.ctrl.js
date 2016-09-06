fihApp.controller('dbconfigctrl', function ($scope, $uibModal, $filter, $resource, NgTableParams, databaseListFactory, DBData, TestQuery, prompt) {
    $scope.pageHeader = "Database Configurations";

    /* databaseListFactory.getDatabaseList().then(function (response) {
         $scope.databases = response.data;
         $scope.databaseTable = new NgTableParams({},
             {
                 total: $scope.databases.length,
                 getData: function (params) {
                     alert(params.sorting());
                     $scope.data = params.sorting() ? $filter('orderBy')($scope.databases, params.orderBy()) : $scope.databases;
                     $scope.data = params.filter() ? $filter('filter')($scope.data, params.filter()) : $scope.data;
 
                     console.log($scope.data);
                 }
             });
     });*/


    $scope.$watch('status', function () {
        console.log($scope.status + "in Watch")
        databaseListFactory.getDatabaseList().then(function (response) {
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


    $scope.popup = function (action) {
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
                db.save(DBData.message, function (app) {
                }, function (error) {
                    console.log("Error occured");
                });
            }

            if (action == 'Update') {
                var db = $resource('/fih/dbconfig/update');
                db.save(DBData.message, function (app) {
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
        console.log("DBConfigs" + dbconfigs)
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


        TestQuery.testQuery(testQueryRequest).then(function (resp) {
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


fihApp.controller('registerDatabaseCtrl', function ($scope, $uibModalInstance, $resource, DBData, action, dbConf) {

    $scope.db = {};
    $scope.db = dbConf;
    console.log($scope.db.db_type);

    $scope.DBType = [
        { id: "oracle", name: "oracle" },
        { id: "as400", name: "as400" },
        { id: "MySQL", name: "Host" },
        { id: "SQL server", name: "SQL Server" }
    ];

    $scope.action = action;
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


        DBData.setMessage(dbPostRequest);
        $uibModalInstance.close();
    };
});


fihApp.factory("DBData", function () {
    var DBData = {};
    DBData.message = {};
    DBData.setMessage = function (message) {
        DBData.message = message;
        console.log(message);
        console.log(DBData.message);
    };

    DBData.getMessage = function () {
        return DBData.message;
    };
    return DBData;

});

fihApp.factory("TestQuery", function ($http) {
    var DBData = {};

    DBData.testQuery = function (DBRequest) {

        var headerConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json;odata=verbose'
            }
        };
        console.log("Request: " + JSON.stringify(DBRequest));

        var promise = $http.post('https://daasapi.soadev.stackato-poc.foxinc.com/FIH/service/DAASAPI/DBUtility/ValidateConnection', DBRequest, headerConfig, { dataType: "jsonp" })
            .success(function (response, status, headers, config) {
                console.log("Successfully invoked BuildAPI with response: " + JSON.stringify(response));

                return response;
            }, function (error) {
                console.log("Failed to connect to DataSource Service: " + JSON.stringify(error));
            });

        return promise;
    }
    console.log("before return");
    return DBData;

});