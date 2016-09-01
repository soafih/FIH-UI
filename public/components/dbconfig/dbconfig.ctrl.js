fihApp.controller('dbconfigctrl', function ($scope, databaseList) {
     $scope.pageHeader = "Database Configurations";
      $scope.databases = databaseList.data;
      console.log( $scope.databases);


      $scope.DBSearchList = [
        { id: "name", name: "Name" },
        { id: "type", name: "Type" },
        { id: "host", name: "Host" },
     ];

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