angular.module('fihApp').controller('UsersCtrl', function ($scope, $resource, $location, userList, NgTableParams, $filter) {
    $scope.pageHeader = "Users";

    $scope.rolesModel = [];
    $scope.rolesData = [];
    $scope.orgModel = [];
    $scope.orgData = [];
    $scope.spaceModel = [];
    $scope.spaceData = [];

    $scope.rolesCustomTexts = { buttonDefaultText: 'Select Roles' };
    $scope.orgCustomTexts = { buttonDefaultText: 'Select Organizations' };
    $scope.spaceCustomTexts = { buttonDefaultText: 'Select Spaces' };

    $scope.selectSettings = {
        smartButtonMaxItems: 3
    };
    $scope.users = userList.data;
    console.log("User Data: "+JSON.stringify($scope.users));
    $scope.userTable = new NgTableParams(
        {
            page: 1,
            count: 5
        },
        {
            counts: [],
            paginationMaxBlocks: 13,
            paginationMinBlocks: 2,
            total: userList.data.length,
            dataset: $scope.users,
        }
    );
    $scope.checkboxes = { 'checked': false, items: {} };

    $scope.countChecked = 0;
    $scope.countCheckedBox = function (username) {
        console.log("Object: "+JSON.stringify($scope.checkboxes));
        
        if ($scope.checkboxes.items[username]) { //If it is checked
            $scope.countChecked++;
            console.log("Checkbox checked: " + $scope.countChecked);
        }
        else {
            $scope.countChecked--;
            console.log("Checkbox unchecked: " + $scope.countChecked);
        }
        if($scope.countChecked > 1)
            $scope.disableDeleteBtn = true;
        else
            $scope.disableDeleteBtn = false;
    };
    // watch for check all checkbox
    $scope.$watch('checkboxes.checked', function (value) {
        console.log("Checkbox changed: ");
        angular.forEach($scope.users, function (item) {
            if (angular.isDefined(item.username)) {
                $scope.checkboxes.items[item.username] = value;
            }
        });
    });

    $scope.userRegister = function(){
        $location.path('/user-register');
    };

    $scope.updateUser = function(){
        
    };
    
    $scope.searchUsers = function(){
        console.log("Applying filter..");

        $scope.users = $filter('filter')(userList.data, {username:$scope.txtUserName, email: $scope.txtEmail, superuser:$scope.chkSuperUser});
        console.log("Users: "+JSON.stringify($scope.users));
        if($scope.rolesModel.length > 0){
            for(var i=0; i<$scope.rolesModel.length; i++){
                console.log("Selected Role: "+$scope.rolesModel[i].id);
                $scope.users = $filter('filter')($scope.users, {roles: $scope.rolesModel[i].id});
            }
        }
        if($scope.orgModel.length > 0){
            var selectedOrgs = [];
            for(var i=0; i<$scope.orgModel.length;i++){
                selectedOrgs.push($scope.orgModel[i].id);
            }
            $scope.users = $filter('orgFilter')($scope.users, selectedOrgs);
        }
        if($scope.spaceModel.length > 0){
            var selectedSpace = [];
            for(var i=0; i<$scope.spaceModel.length;i++){
                selectedSpace.push($scope.spaceModel[i].id);
            }
            $scope.users = $filter('spaceFilter')($scope.users, selectedSpace);
        }
        $scope.userTable.total($scope.users.length);
        $scope.userTable.settings().dataset = $scope.users;
        $scope.userTable.reload();
        console.log("Filtered Users: "+JSON.stringify($scope.users));
        
    };

    var init = function () {
        var SecurityAPI = $resource('/fih/users/roles');
        SecurityAPI.query(function (roles) {
            if (roles) {
                $scope.roles = roles;
                for (var i = 0; i < roles.length; i++) {
                    $scope.rolesData.push({ id: roles[i].name, label: roles[i].name });
                }
            }
        });

        var OrgAPI = $resource('/fih/stackatoapis/orgs');
        OrgAPI.query(function (orgs) {
            console.log("Fetched orgs: " + JSON.stringify(orgs));
            if (orgs) {
                $scope.orgs = orgs;
                for (var i = 0; i < orgs.length; i++) {
                    $scope.orgData.push({ id: orgs[i].name, label: orgs[i].name });
                }
            }
        });

        var SpaceAPI = $resource('/fih/stackatoapis/spaces');
        SpaceAPI.query(function (spaces) {
            console.log("Fetched orgs: " + JSON.stringify(spaces));
            if (spaces) {
                $scope.spaces = spaces;
                for (var i = 0; i < spaces.length; i++) {
                    $scope.spaceData.push({ id: spaces[i].name, label: spaces[i].name });
                }
            }
        });

    };

    init();
});

fihApp.filter('orgFilter', function () {
    return function (inputs, filterValues) {
        console.log("Filter Input: "+JSON.stringify(inputs));
        console.log("Filter Values: "+JSON.stringify(filterValues));
        var output = [];
        angular.forEach(inputs, function (input) {
            angular.forEach(input.orgs, function (org) {
                if (filterValues.indexOf(org.name) !== -1){
                    output.push(input);
                }
            });
        });
        return removeArrayDuplicate(output);
    };
});

fihApp.filter('spaceFilter', function () {
    return function (inputs, filterValues) {
        console.log("Filter Input: "+JSON.stringify(inputs));
        console.log("Filter Values: "+JSON.stringify(filterValues));
        var output = [];
        angular.forEach(inputs, function (input) {
            angular.forEach(input.spaces, function (space) {
                if (filterValues.indexOf(space.name) !== -1)
                    output.push(input);
            });
        });
        return removeArrayDuplicate(output);
    };
});

function removeArrayDuplicate(output){
        var arr = {};
        for (var i=0; i < output.length; i++ )
            arr[output[i]._id] = output[i];

        output = [];
        for ( var key in arr )
            output.push(arr[key]);
        console.log("Returning: "+output);
        return output;
}

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
