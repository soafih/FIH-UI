angular.module('fihApp').controller('RoleUpdateCtrl', function ($scope, $resource, $location, $uibModal, prompt, 
        roleList, permissionList, userList, NgTableParams, $filter, $routeParams) {
    $scope.pageHeader = "Update Role ";
    
    $scope.roleid = $routeParams.roleid;

    /* Start - Setup data for roles tab */
    {
        $scope.roles = [];
        for(var i=0; i<roleList.data.length;i++){
            if(roleList.data[i].name !== "fih_admin"){
                $scope.roles.push(roleList.data[i]);
            }
        }
        roleList.data = $scope.roles;
        $scope.roleTable = new NgTableParams(
            {
                page: 1,
                count: 5
            },
            {
                counts: [],
                paginationMaxBlocks: 13,
                paginationMinBlocks: 2,
                total: $scope.roles.length,
                dataset: $scope.roles,
            }
        );
        
        $scope.checkboxesRoles = { 'checked': false, items: {} };
        $scope.$watch('checkboxesRoles.checked', function (value) {
            angular.forEach($scope.roles, function (item) {
                if (angular.isDefined(item.name)) {
                    $scope.checkboxesRoles.items[item.name] = value;
                }
            });
        });
    }
    /* End - Setup data for roles tab */

    /* Start - Setup data for permissions tab */
    {
        $scope.permissions =permissionList.data;
        $scope.resources = identifyUniqueResource(permissionList.data);
        
        $scope.checkboxesPermissions = { 'checked': false, items: {} };
        $scope.$watch('checkboxesPermissions.checked', function (valResource, valOperation) {
            angular.forEach($scope.permissions, function (item) {
                if (angular.isDefined(item.valResource) && angular.isDefined(item.valOperation)) {
                    $scope.checkboxesPermissions.items[item.valResource+'.'+item.valOperation] = item.valResource+'.'+item.valOperation;
                }
            });
        });
    }
    /* End - Setup data for permissions tab */

    /* Start - Setup data for user tab */
    {
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

        $scope.checkboxesUsers = { 'checked': false, items: {} };
        $scope.$watch('checkboxesUsers.checked', function (value) {
            angular.forEach($scope.users, function (item) {
                if (angular.isDefined(item._id)) {
                    $scope.checkboxesUsers.items[item._id] = value;
                }
            });
        });
    }

    /* End - Setup data for user tab */

    $scope.chkRoleChanged = function(role){
        console.log("Selected role name: "+role.name);
        if($scope.checkboxesRoles.items[role.name]){
            for(var i=0; i<role.inherits.length; i++){
                console.log("Inherited roles: "+role.inherits[i]);
                $scope.checkboxesRoles.items[role.inherits[i]] = true;
                var childRole = $filter('filter')($scope.roles, {name: role.inherits[i]})[0];
                $scope.chkRoleChanged(childRole);
            }
        }
    };

    
    $scope.chkPermissionChanged = function(permission){
        var permissionName = permission.resource+ '.'+permission.operation;
        console.log("chkPermissionChanged value:"+$scope.checkboxesPermissions.items[permissionName]);
        if($scope.checkboxesPermissions.items[permissionName]){
            for(var i=0; i<permission.child_perm.length; i++){
                console.log("Inherited permissions: "+permission.child_perm[i]);
                $scope.checkboxesPermissions.items[permission.child_perm[i]] = true;
                var childPermission = $filter('filter')($scope.permissions, {resource: permission.child_perm[i].split('.')[0], operation: permission.child_perm[i].split('.')[1]})[0];
                $scope.chkPermissionChanged(childPermission);
            }
        }
    };

    $scope.reset = function(){
        $scope.checkboxesRoles = { 'checked': false, items: {} };
        $scope.checkboxesPermissions = { 'checked': false, items: {} };
        $scope.checkboxesUsers = { 'checked': false, items: {} };
        init();
    };
    
    $scope.updateRole = function () {
        $scope.selectedRoles = chkGenerateSelectedItemArray($scope.checkboxesRoles.items);
        $scope.selectedPermissions = chkGenerateSelectedItemArray($scope.checkboxesPermissions.items);
        $scope.selectedUsers = chkGenerateSelectedItemArray($scope.checkboxesUsers.items);

        console.log("Selected Roles: " + JSON.stringify($scope.selectedRoles));
        console.log("Selected Permissions: " + JSON.stringify($scope.selectedPermissions));
        console.log("Selected Users: " + JSON.stringify($scope.selectedUsers));
        var isValid = true;
        var message = "";
        if (!$scope.txtRoleName || $scope.txtRoleName === '') {
            isValid = false;
            message = '<span class="red">Role name is mandatory field!</span><br>';
        }
        if(!$scope.txtDescription || $scope.txtDescription === ''){
            isValid = false;
            message += '<br><span class="red">Role description is mandatory field!</span><br>';
        }
        if ($scope.selectedPermissions.length < 1) {
            message += '<br><span class="amber">No permission selected! Permission can be selected from permission tab(optional).</span><br>';
            if(isValid)
                message += '<br>Click ok if you want to continue else cancel.<br>';
        }
        if(!isValid){
            openPromptFailure(message);
            return;
        }
        else if (message === "") {
            updateRoleData();
        }
        else{
            prompt({
                title: 'Confirmation box?',
                containHtml: true,
                message: message,
                "buttons": [
                    {
                        "label": "Ok",
                        "cancel": false,
                        "primary": true
                    },
                    {
                        "label": "Cancel",
                        "cancel": true,
                        "primary": false
                    }
                ]
            }).then(function (result) {
                console.log("Prompt result: " + result);
                if (result === 'Cancel') {
                    return;
                }
                else {
                    updateRoleData();
                }
            });
        }

        function updateRoleData(){

            var addedUsers = [];
            var deletedUsers = [];

            for (var i = 0; i < $scope.selectedUsers.length; i++) {
                //Identify added objects
                if ($scope.currentUsers.indexOf($scope.selectedUsers[i]) === -1) {
                    addedUsers.push($scope.selectedUsers[i]);
                }
            }
            for (var j = 0; j < $scope.currentUsers.length; j++) {
                if ($scope.selectedUsers.indexOf($scope.currentUsers[j]) === -1) {
                    deletedUsers.push($scope.currentUsers[j]);
                }
            }

            console.log("deletedUsers: " + JSON.stringify(deletedUsers));
            console.log("addedUsers: " + JSON.stringify(addedUsers));

            var roleData = {
                objectid: $scope.roleDetails._id,
                name: $scope.txtRoleName,
                descr: $scope.txtDescription,
                inherits: $scope.selectedRoles,
                can: $scope.selectedPermissions,
                changeInUsers: { added: addedUsers, deleted: deletedUsers }
            };
            console.log("Updating role with data: " + JSON.stringify(roleData));

            var RolesAPI = $resource('/fih/users/role/update');
            RolesAPI.save(roleData, function (res) {
                if (res.success) {
                    console.log("Role data updated successfully: " + JSON.stringify(res));
                    openPromptSuccess("Role data updated successfully");
                    $scope.reset();
                }
                else {
                    console.log("Error in role updation: " + JSON.stringify(res));
                    openPromptFailure("Error in role updation");
                }
            }, function (error) {
                console.log("Error in role creation: " + error);
                openPromptFailure("Error in role updation");
            });
        }
    };
    
    var init = function () {

        var RolesAPI = $resource('/fih/users/roles/objectid/' + $scope.roleid);
        RolesAPI.get(function (role) {
            if (role && role.name) {
                console.log("Selected role details: " + JSON.stringify(role));
                $scope.roleDetails = role;

                $scope.pageHeader = 'Edit ' + role.name;
                $scope.txtRoleName = role.name;
                $scope.txtDescription = role.descr;
                
                var UsersAPI = $resource('/fih/users/role/name/' + role.name);
                UsersAPI.query(function (users) {
                    if (users && users.length > 0) {
                        $scope.currentUsers = [];
                        console.log("Selected role users: " + JSON.stringify(users));
                        for (var i = 0; i < users.length; i++) {
                            $scope.checkboxesUsers.items[users[i]._id] = true;
                            $scope.currentUsers.push(users[i]._id);
                        }
                    }
                });
                for (var i = 0; i < role.inherits.length; i++) {
                    $scope.checkboxesRoles.items[role.inherits[i]] = true;
                }
                
                for (var j = 0; j < role.can.length; j++) {
                    $scope.checkboxesPermissions.items[role.can[j]] = true;
                }
            }
            else {
                $scope.openPromptFailure("Selected role not found. Please make sure you select user from role table.!");
                $location.path('/roles');
            }
        });

    };

    init();
    var openPromptSuccess = function(message){
        prompt({
            title: 'Message',
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

    var openPromptFailure = function(message){
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
        }).then(function(result){
            console.log("Reu: "+result);
        });
    };

});

function identifyUniqueResource(permissions) {
    var indexedPermissions = [];
    for (var i = 0; i < permissions.length; i++) {
        var newResource = indexedPermissions.indexOf(permissions[i].resource) == -1;
        if (newResource) {
            indexedPermissions.push(permissions[i].resource);
        }
    }

    return indexedPermissions;
}

function chkGenerateSelectedItemArray(data) {
    var roles = [];
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            if (data[key])
                roles.push(key);
        }
    }
    return roles;
}