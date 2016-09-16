angular.module('fihApp').controller('UserRegisterCtrl', function ($scope, $resource,  $location, prompt, roleList, NgTableParams, $filter) {
    $scope.pageHeader = "Register User";
    
    $scope.orgModel = [];
    $scope.orgData = [];
    $scope.spaceModel = [];
    $scope.spaceData = [];

    $scope.orgCustomTexts = { buttonDefaultText: 'Select Organizations' };
    $scope.spaceCustomTexts = { buttonDefaultText: 'Select Spaces' };

    $scope.selectSettings = {
        smartButtonMaxItems: 3
    };
    $scope.roles = roleList.data;
    $scope.roleTable = new NgTableParams(
        {
            page: 1,
            count: 5
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
    // watch for check all checkbox
    $scope.$watch('checkboxes.checked', function (value) {
        console.log("Checkbox changed: ");
        angular.forEach($scope.users, function (item) {
            if (angular.isDefined(item.username)) {
                $scope.checkboxes.items[item.username] = value;
            }
        });
    });

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

    $scope.createUser = function(){

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
                $scope.openPrompt("User created successfully");
            }
            else{
                console.log("Error in User creation: "+JSON.stringify(res));
                $scope.openPrompt("Error in User creation");
            }
        }, function (error) {
            console.log("Error in User creation: "+error);
            $scope.openPrompt("Error in User creation");
        });

    };

    $scope.reset = function(){
        $scope.txtUserName = "";
        $scope.txtEmail = "";
        $scope.txtFullName = "";
        $scope.orgModel = [];
        $scope.spaceModel = [];
        $scope.checkboxes = { 'checked': false, items: {} };
    };

    var init = function () {
        
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

    $scope.openPrompt = function(message){
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

