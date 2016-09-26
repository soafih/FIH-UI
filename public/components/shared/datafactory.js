
fihApp.factory('roleListFactory', function ($http) {
    var factoryResult = {
        getRoleList: function () {
            var promise = $http({
                method: 'GET',
                url: '/fih/users/roles'
            }).success(function (data, status, headers, config) {
                return data;
            });

            return promise;
        }
    };

    return factoryResult;
});

fihApp.factory('userListFactory', function ($http) {
    var factoryResult = {
        getUserList: function () {
            var promise = $http({
                method: 'GET',
                url: '/fih/users'
            }).success(function (data, status, headers, config) {
                return data;
            });

            return promise;
        }
    };

    return factoryResult;
});


fihApp.factory('permissionListFactory', function ($http) {
    var factoryResult = {
        getPermissionList: function () {
            var promise = $http({
                method: 'GET',
                url: '/fih/users/permissions'
            }).success(function (data, status, headers, config) {
                return data;
            });

            return promise;
        }
    };

    return factoryResult;
});
