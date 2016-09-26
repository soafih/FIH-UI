angular.module('fihApp').controller('UsersCtrl', function ($scope, $resource, $location, userList, NgTableParams, $filter, prompt) {
    $scope.pageHeader = "Users";

    $scope.superUserOption = ["Select", "Yes", "No"];
    $scope.selectedSuperUser = "Select";
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
    $scope.countCheckedBox = function (_id) {
        if ($scope.checkboxes.items[_id]) { //If it is checked
            $scope.countChecked++;
            console.log("Checkbox checked: " + $scope.countChecked);
        }
        else {
            $scope.countChecked--;
            console.log("Checkbox unchecked: " + $scope.countChecked);
        }
        if($scope.countChecked > 1){
            $scope.disableUpdateBtn = true;
        }
        else{
            $scope.disableUpdateBtn = false;
        }
    };
    // watch for check all checkbox
    $scope.$watch('checkboxes.checked', function (value) {
        console.log("Checkbox changed: ");
        angular.forEach($scope.users, function (item) {
            if (angular.isDefined(item._id)) {
                $scope.checkboxes.items[item._id] = value;
            }
        });
    });

    $scope.userRegister = function(){
        $location.path('/user-register');
    };

    $scope.updateUser = function(){
        var userList = $scope.checkboxes.items;
        console.log("All users items: "+JSON.stringify($scope.checkboxes.items));
        if($scope.countChecked === 1){
            var selectedUserId = ""; 
            for (var key in userList) {
                if (userList.hasOwnProperty(key)) {
                    if(userList[key]){
                        selectedUserId = key;
                        break;
                    }
                }
            }
            console.log("Updating user: "+selectedUserId);
            $location.path('/user-update/'+selectedUserId);
        }
        else{
            $scope.openPromptFailure("Please select exactly one user to update.!");
        }
    };

    $scope.deleteUser = function(){
        var userList = $scope.checkboxes.items;
        console.log("All users items: "+JSON.stringify($scope.checkboxes.items));
        if($scope.countChecked < 1){
            $scope.openPromptFailure("Please select atleast one user to delete.!");
            return;
        }
        var message = 'All user data will be deleted. This action cannot be undone!';
        prompt({
            title: 'Warning!',
            titleStyle: 'color: red;',
            containHtml: true,
            message: message,
            "buttons": [
                {
                    "label": "Confirm",
                    "cancel": false,
                    "primary": true
                },
                {
                    "label": "Cancel",
                    "cancel": true,
                    "primary": false
                }
            ]
        }).then(function(){
            var selectedUserId = ""; 
            for (var key in userList) {
                if (userList.hasOwnProperty(key)) {
                    if(userList[key]){
                        selectedUserId = key;
                        break;
                    }
                }
            }
            console.log("Deleting user: "+selectedUserId);
            var selectedUserGuid = "";
            for(var i=0; i<$scope.users.length;i++){
                if(selectedUserId === $scope.users[i]._id){
                    selectedUserGuid = $scope.users[i].guid;
                }
            }
            console.log("Selected User Guid: "+selectedUserGuid);
            var AppService = $resource('/fih/users/' + selectedUserGuid);
            AppService.delete(function (res) {
                console.log("Deleted user: " + JSON.stringify(res));
                if(res.success){
                    $scope.openPromptSuccess('User deleted successfully!');
                    var UserAPI = $resource('/fih/users');
                    UserAPI.query(function (users) {
                        if (users) {
                            $scope.users = users;
                            $scope.userTable.total($scope.users.length);
                            $scope.userTable.settings().dataset = $scope.users;
                            $scope.userTable.reload();
                        }
                    });
                }
                else{
                    $scope.openPromptFailure('Error in user deletion!');
                }
            });
        });
    };
    
    $scope.searchUsers = function(){
        console.log("Applying filter..");
        
        $scope.users = $filter('filter')(userList.data, {username:$scope.txtUserName, email: $scope.txtEmail});
        
        if($scope.selectedSuperUser !== 'Select'){
            var isSuperUser = false;
            if($scope.selectedSuperUser === 'Yes')
                isSuperUser = true;
            $scope.users = $filter('filter')(userList.data, {username:$scope.txtUserName, email: $scope.txtEmail, superuser:isSuperUser});
        }
        
        if($scope.rolesModel.length > 0){
            var selectedRoles = [];
            for(var i=0; i<$scope.rolesModel.length; i++){
                selectedRoles.push($scope.rolesModel[i].id);
            }
            $scope.users = $filter('roleFilter')($scope.users, selectedRoles);
        }
        if($scope.orgModel.length > 0){
            console.log("Selected Org: "+JSON.stringify($scope.orgModel));
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
    
    $scope.reset = function(){
        $scope.txtUserName = "";
        $scope.txtEmail = "";
        $scope.orgModel = [];
        $scope.spaceModel = [];
        $scope.rolesModel = [];
        $scope.selectedSuperUser = 'Select';
        $scope.checkboxes = { 'checked': false, items: {} };
        $scope.users = userList.data;
        $scope.userTable.total($scope.users.length);
        $scope.userTable.settings().dataset = $scope.users;
        $scope.userTable.reload();
    };

    var init = function () {
        var SecurityAPI = $resource('/fih/users/roles');
        SecurityAPI.query(function (roles) {
            if (roles) {
                $scope.roles = roles;
                for (var i = 0; i < roles.length; i++) {
                    if(roles[i].name !== "fih_admin"){
                        $scope.rolesData.push({ id: roles[i].name, label: roles[i].name });
                    }
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
    
    $scope.openPromptFailure = function(message){
        prompt({
            title: 'Alert!',
            titleStyle: 'color: red;',
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

    $scope.openPromptSuccess = function(message){
        prompt({
            title: 'Message!',
            titleStyle: 'color: green;',
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
});

fihApp.filter('roleFilter', function () {
    return function (inputs, filterValues) {
        console.log("Filter Input: "+JSON.stringify(inputs));
        console.log("Filter Values: "+JSON.stringify(filterValues));
        var output = [];
        angular.forEach(inputs, function (input) {
            angular.forEach(input.roles, function (role) {
                if (filterValues.indexOf(role) !== -1){
                    output.push(input);
                }
            });
        });
        return removeArrayDuplicate(output);
    };
});

fihApp.filter('orgFilter', function () {
    return function (inputs, filterValues) {
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

