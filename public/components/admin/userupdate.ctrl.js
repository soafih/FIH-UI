angular.module('fihApp').controller('UserUpdateCtrl', function ($scope, $resource, $location, $routeParams, prompt, 
        roleList, NgTableParams) {
    $scope.pageHeader = "Edit";
    
    $scope.userid = $routeParams.userid;

    $scope.orgModel = [];
    $scope.orgData = [];

    $scope.orgCustomTexts = { buttonDefaultText: 'Select Org/Spaces' };

    $scope.selectSettings = {
        smartButtonMaxItems: 3
    };
    
    $scope.roles = [];
    for(var i=0; i<roleList.data.length;i++){
        if(roleList.data[i].name !== "fih_admin"){
            $scope.roles.push(roleList.data[i]);
        }
    }
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
    $scope.checkboxes = { 'checked': false, items: {} };
    // watch for check all checkbox
    $scope.$watch('checkboxes.checked', function (value) {
        console.log("Checkbox changed: ");
        angular.forEach($scope.users, function (item) {
            if (angular.isDefined(item.username)) {
                $scope.checkboxes.items[item.username] = value;
            }
        });
    });

    $scope.countCheckedBox = function (_id) {
        console.log("Checkbox checked: " + JSON.stringify($scope.checkboxes.items));
    };

    function generateRolesArray(data) {
        var roles = [];
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                if(data[key])
                    roles.push(key);
            }
        }
        return roles;
    }

    var validateForm = function () {
        var isValid = true;
        
        if ($scope.orgModel.length < 1) {
            isValid = false;
            $scope.openPromptFailure("Please select user's organization from dropdown. You may select multiple organization!");
        }
        return isValid;
    };
    $scope.updateUser = function(){
        if(validateForm()){
            var selectedOrgs = [];
            var selectedSpaces = [];
            var selectedOrgsGuid = [];
            var selectedSpacesGuid = [];
            var selectedRoles = [];
            
            var addedOrgs = [];
            var addedSpaces = [];
            var deletedOrgs = [];
            var deletedSpaces = [];

            if($scope.chkSuperUser){
                selectedRoles = ["fih_admin"];
                /*for(var i=0; i<$scope.orgData.length;i++){
                    selectedOrgs.push($scope.orgData[i].id.org);
                    selectedSpaces.push($scope.orgData[i].id);
                }*/
            }
            else {
                console.log("Current Org: "+$scope.userCurrentOrg);
                console.log("Current Space: "+$scope.userCurrentSpace);
                for(var i=0; i<$scope.orgModel.length;i++){
                    //Identify added objects
                    if($scope.userCurrentOrg.indexOf($scope.orgModel[i].id.org.guid) === -1){
                        addedOrgs.push($scope.orgModel[i].id.org.guid);
                    }
                    if($scope.userCurrentSpace.indexOf($scope.orgModel[i].id.guid) === -1){
                        addedSpaces.push($scope.orgModel[i].id.guid);
                    }
                    selectedOrgs.push($scope.orgModel[i].id.org);
                    selectedSpaces.push($scope.orgModel[i].id);
                    selectedOrgsGuid.push($scope.orgModel[i].id.org.guid);
                    selectedSpacesGuid.push($scope.orgModel[i].id.guid);
                }
                for(var j=0; j<$scope.userCurrentOrg.length; j++){
                    if(selectedOrgsGuid.indexOf($scope.userCurrentOrg[j]) === -1){
                        deletedOrgs.push($scope.userCurrentOrg[j]);
                    }
                }
                for(var j=0; j<$scope.userCurrentSpace.length; j++){
                    if(selectedSpacesGuid.indexOf($scope.userCurrentSpace[j]) === -1){
                        deletedSpaces.push($scope.userCurrentSpace[j]);
                    }
                }

                console.log("deletedOrgs: "+JSON.stringify(deletedOrgs));
                console.log("deletedSpaces: "+JSON.stringify(deletedSpaces));
                console.log("addedOrgs: "+JSON.stringify(addedOrgs));
                console.log("addedSpaces: "+JSON.stringify(addedSpaces));

                selectedRoles = generateRolesArray($scope.checkboxes.items);
            }
            
            var user = {
                objectid: $scope.userDetails._id,
                guid: $scope.userDetails.guid,
                superuser: $scope.chkSuperUser,
                spaces: selectedSpaces,
                orgs: selectedOrgs,
                roles: selectedRoles,
                changeInOrgs: {added: addedOrgs, deleted: deletedOrgs},
                changeInSpaces: {added: addedSpaces, deleted: deletedSpaces}
            };
            console.log("Updating user with data: "+JSON.stringify(user));
            
            var Apps = $resource('/fih/users/update');
            Apps.save(user, function (res) {
                if(res.success){
                    console.log("User data updated successfully: "+JSON.stringify(res));
                    $scope.openPromptSuccess("User data updated successfully");
                    $scope.reset();
                }
                else{
                    console.log("Error in User updation: "+JSON.stringify(res));
                    $scope.openPromptFailure("Error in User updation");
                }
            }, function (error) {
                console.log("Error in User creation: "+error);
                $scope.openPromptFailure("Error in User updation");
            });
        }
    };
    
    $scope.reset = function(){
        $scope.checkboxes = { 'checked': false, items: {} };
        init();
    };

    var init = function () {
        
        var UserAPI = $resource('/fih/users/objectid/'+$scope.userid);
        UserAPI.get(function (user) {
            if (user && user.username) {
                console.log("Fetched user: " + JSON.stringify(user));
                $scope.userDetails = user;

                var OrgAPI = $resource('/fih/stackatoapis/orgs');
                OrgAPI.query(function (orgs) {
                    
                    $scope.orgData = [];
                    $scope.orgModel = [];
                    
                    console.log("Fetched orgs: " + JSON.stringify(orgs));
                    if (orgs) {
                        var spaceData = [];
                        var spaceModel =[];
                        for (var i = 0; i < orgs.length; i++) {
                            var spaces = orgs[i].spaces;
                            for (var j = 0; j < spaces.length; j++) {
                                spaces[j].org = {name: orgs[i].name, guid: orgs[i].guid};
                                spaceData.push({ id: spaces[j], label: spaces[j].name, orgName: orgs[i].name });
                            }
                        }
                        $scope.orgData = spaceData;
                        console.log("Org/Spaces:"+JSON.stringify($scope.orgData));

                        for (var j = 0; j < user.spaces.length; j++) {
                            spaceModel.push({ id: user.spaces[j]});
                        }
                        $scope.orgModel = spaceModel;
                        console.log("Selected Org/Spaces:"+JSON.stringify($scope.orgModel));
                        
                        var userCurrentSpace = [];
                        var userCurrentOrg = [];
                        for (var j = 0; j < user.spaces.length; j++) {
                            userCurrentSpace.push(user.spaces[j].guid);
                            userCurrentOrg.push(user.spaces[j].org.guid);
                        }
                        $scope.userCurrentSpace = userCurrentSpace;
                        $scope.userCurrentOrg = userCurrentOrg;
                    }
                });

                $scope.pageHeader = 'Edit '+user.username;
                $scope.txtUserName = user.username;
                $scope.txtFullName = user.first_name ? user.first_name : '' + ' ' + user.last_name ? user.last_name : '';
                $scope.txtEmail = user.email;
                $scope.chkSuperUser = user.superuser;

                for(var i=0;i<user.roles.length;i++){
                    $scope.checkboxes.items[user.roles[i]] = true;
                }
                
            }
            else{
                $scope.openPromptFailure("Selected user not found. Please make sure you select user from user table.!");
                $location.path('/users');
            }
        });

    };

    init();
        
    $scope.openPromptSuccess = function(message){
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

});


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

