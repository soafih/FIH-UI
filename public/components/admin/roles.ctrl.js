angular.module('fihApp').controller('RolesCtrl', function ($scope, $resource, $location, roleList, NgTableParams, $filter, prompt) {
    $scope.pageHeader = "Roles";

    $scope.spaceModel = [];
    $scope.spaceData = [];
    $scope.spaceCustomTexts = { buttonDefaultText: 'Select Spaces' };

    $scope.selectSettings = {
        smartButtonMaxItems: 3
    };
    $scope.roles = roleList.data;
    $scope.roleTable = new NgTableParams(
        {
            page: 1,
            count: 8
        },
        {
            counts: [],
            paginationMaxBlocks: 13,
            paginationMinBlocks: 2,
            total: roleList.data.length,
            dataset: $scope.roles,
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

    $scope.roleRegister = function(){
        $location.path('/role-register');
    };

    $scope.updateRole = function(){
        var selectedRoles = $scope.checkboxes.items;
        console.log("Roles table items: "+JSON.stringify($scope.checkboxes.items));
        if($scope.countChecked === 1){
            var selectedRoleId = ""; 
            for (var key in selectedRoles) {
                if (selectedRoles.hasOwnProperty(key)) {
                    if(selectedRoles[key]){
                        selectedRoleId = key;
                        break;
                    }
                }
            }
            console.log("Updating role: "+selectedRoleId);
            $location.path('/role-update/'+selectedRoleId);
        }
        else{
            $scope.openPromptFailure("Please select exactly one role to update.!");
        }
    };

    $scope.deleteRoles = function(){
        var roleList = $scope.checkboxes.items;
        console.log("All users items: "+JSON.stringify($scope.checkboxes.items));
        if($scope.countChecked !== 1){
            $scope.openPromptFailure("Please select exactly one user to update.!");
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
            for (var key in roleList) {
                if (roleList.hasOwnProperty(key)) {
                    if(roleList[key]){
                        selectedUserId = key;
                        break;
                    }
                }
            }
            console.log("Updating user: "+selectedUserId);
            var selectedUserGuid = "";
            for(var i=0; i<$scope.users.length;i++){
                if(selectedUserId === $scope.users[i]._id){
                    selectedUserGuid = $scope.users[i].guid;
                }
            }
            console.log("Selected User Guid: "+selectedUserGuid);
            var AppService = $resource('/fih/users/' + selectedUserGuid);
            AppService.delete(function (res) {
                console.log("Deleted App: " + JSON.stringify(res));
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
    
    $scope.searchRoles = function(){
        console.log("Applying filter..");
        
        $scope.roles = $filter('filter')(roleList.data, {name:$scope.txtRoleName, descr: $scope.txtDescription});
        
        /*if($scope.spaceModel.length > 0){
            var selectedSpace = [];
            for(var i=0; i<$scope.spaceModel.length;i++){
                selectedSpace.push($scope.spaceModel[i].id);
            }
            $scope.roles = $filter('spaceFilter')($scope.users, selectedSpace);
        }*/
        $scope.roleTable.total($scope.roles.length);
        $scope.roleTable.settings().dataset = $scope.roles;
        $scope.roleTable.reload();
        console.log("Filtered Roles: "+JSON.stringify($scope.roles));
        
    };
    
    $scope.reset = function(){
        $scope.txtUserName = "";
        $scope.txtEmail = "";
        $scope.orgModel = [];
        $scope.spaceModel = [];
        $scope.rolesModel = [];
        $scope.selectedSuperUser = 'Select';
        $scope.checkboxes = { 'checked': false, items: {} };
        $scope.users = roleList.data;
        $scope.userTable.total($scope.users.length);
        $scope.userTable.settings().dataset = $scope.users;
        $scope.userTable.reload();
    };

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

