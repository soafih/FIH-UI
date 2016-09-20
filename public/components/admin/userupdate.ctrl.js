angular.module('fihApp').controller('UserUpdateCtrl', function ($scope, $resource, $location, $routeParams, prompt, 
        roleList, NgTableParams) {
    $scope.pageHeader = "Edit";
    
    $scope.userid = $routeParams.userid;

    $scope.orgModel = [];
    $scope.orgData = [];
    $scope.spaceModel = [];
    $scope.spaceData = [];

    $scope.orgCustomTexts = { buttonDefaultText: 'Select Organizations' };
    $scope.spaceCustomTexts = { buttonDefaultText: 'Select Spaces' };

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
        if (!$scope.txtUserName || $scope.txtUserName === '' || !$scope.txtEmail || $scope.txtEmail === '' || !$scope.txtFullName || $scope.txtFullName === '') {
            isValid = false;
            $scope.openPromptFailure("Please select user details by clicking search button adjacent to UserName field!");
        }
        else if ($scope.orgModel.length < 1) {
            isValid = false;
            $scope.openPromptFailure("Please select user's organization from dropdown. You may select multiple organization!");
        }
        else if ($scope.spaceModel.length < 1) {
            isValid = false;
            $scope.openPromptFailure("Please select user's space from dropdown. You may select multiple space!");
        }
        return isValid;
    };
    $scope.createUser = function(){
        if(validateForm()){
            var selectedOrgs = [];
            for(var i=0; i<$scope.orgModel.length;i++){
                selectedOrgs.push($scope.orgModel[i].id);
            }
            var selectedSpace = [];
            for(var i=0; i<$scope.spaceModel.length;i++){
                selectedSpace.push($scope.spaceModel[i].id);
            }
            var selectedRoles = generateRolesArray($scope.checkboxes.items);
            
            var user = {
                username: $scope.txtUserName,
                email: $scope.txtEmail,
                fullname: $scope.txtFullName,
                superuser: $scope.chkSuperUser,
                spaces: selectedSpace,
                orgs: selectedOrgs,
                roles: selectedRoles
            };
            console.log("Creating user with data: "+JSON.stringify(user));

            var Apps = $resource('/fih/users');
            Apps.save(user, function (res) {
                if(res.success){
                    console.log("User created successfully: "+JSON.stringify(res));
                    $scope.openPromptSuccess("User created successfully");
                    $scope.reset();
                }
                else{
                    console.log("Error in User creation: "+JSON.stringify(res));
                    $scope.openPromptFailure("Error in User creation");
                }
            }, function (error) {
                console.log("Error in User creation: "+error);
                $scope.openPromptFailure("Error in User creation");
            });
        }
    };
    
    $scope.reset = function(){
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
                    $scope.orgData =[];
                    $scope.orgModel =[];
                    if (orgs) {
                        
                        $scope.orgs = orgs;
                        for (var i = 0; i < orgs.length; i++) {
                            $scope.orgData.push({ id: orgs[i].guid, label: orgs[i].name });
                        }
                        for(var i=0; i<user.orgs.length;i++){
                            $scope.orgModel.push({"id": user.orgs[i].guid});
                        }
                    }
                });

                var SpaceAPI = $resource('/fih/stackatoapis/spaces');
                SpaceAPI.query(function (spaces) {
                    $scope.spaceData = [];
                    $scope.spaceModel = [];
                    if (spaces) {
                        $scope.spaces = spaces;
                        for (var i = 0; i < spaces.length; i++) {
                            $scope.spaceData.push({ id: spaces[i].guid, label: spaces[i].name });
                        }
                        for (var i = 0; i < user.spaces.length; i++) {
                            $scope.spaceModel.push({"id": user.spaces[i].guid});
                        }
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
                //$scope.checkboxes.items = {"api_developer":true,"api_operator":true} ;
                //{"api_developer":true,"api_operator":true}
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

