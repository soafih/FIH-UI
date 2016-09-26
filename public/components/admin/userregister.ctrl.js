angular.module('fihApp').controller('UserRegisterCtrl', function ($scope, $resource, $location, $uibModal, prompt, roleList, NgTableParams) {
    $scope.pageHeader = "Register New User";
    
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

    var validateForm = function () {
        var isValid = true;
        if (!$scope.txtUserName || $scope.txtUserName === '' || !$scope.txtEmail || $scope.txtEmail === '' || !$scope.txtFullName || $scope.txtFullName === '') {
            isValid = false;
            $scope.openPromptFailure("Please select user details by clicking search button adjacent to UserName field!");
        }
        else if (!$scope.chkSuperUser && $scope.orgModel.length < 1) {
            isValid = false;
            $scope.openPromptFailure("Please select user's org/spaces from dropdown. You may select multiple org/space combination!");
        }
        return isValid;
    };

    $scope.createUser = function(){
        console.log("Selected Org/Spaces: "+JSON.stringify($scope.orgModel));
        if(validateForm()){
            var selectedOrgs = [];
            var selectedSpace = [];
            var selectedRoles = [];

            if($scope.chkSuperUser){
                selectedRoles = ["fih_admin"];
                /*for(var i=0; i<$scope.orgData.length;i++){
                    selectedOrgs.push($scope.orgData[i].id.org);
                    selectedSpace.push($scope.orgData[i].id);
                }*/
            }
            else {
                for(var i=0; i<$scope.orgModel.length;i++){
                    selectedOrgs.push($scope.orgModel[i].id.org);
                    selectedSpace.push($scope.orgModel[i].id);
                }
                selectedRoles = generateRolesArray($scope.checkboxes.items);
            }
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
        $scope.txtUserName = "";
        $scope.txtEmail = "";
        $scope.txtFullName = "";
        $scope.orgModel = [];
        $scope.chkSuperUser = false;
        $scope.checkboxes = { 'checked': false, items: {} };
    };

    $scope.animationsEnabled = false;
    $scope.openSearch = function(){
        console.log("Opening openSearchDialog");
        console.log("Selected Org/Spaces: "+JSON.stringify($scope.orgModel));
        if($scope.txtUserName && $scope.txtUserName.length >= 3){
            var modalInstance = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: 'myModalContent.html',
                controller: 'ModalInstanceCtrl',
                size: 'lg',
                resolve: {
                    usernameParam: function () {
                        return $scope.txtUserName;
                    },
                    adUsers : function () {
                        users = [
                            {username: "testuser1", fullname:"test user1", email:"testuser1@fox.com"},
                            {username: "testuser2", fullname:"test user2", email:"testuser2@fox.com"},
                            {username: "testuser3", fullname:"test user3", email:"testuser3@fox.com"},
                        ];
                        return users;
                    }
                }
            });
            modalInstance.result.then(function (selectedUser) {
                $scope.txtUserName = selectedUser.username;
                $scope.txtFullName = selectedUser.fullname;
                $scope.txtEmail = selectedUser.email;
            }, function () {
                console.log('Modal dismissed at: ' + new Date());
            });
        }
        else{
            $scope.openPromptFailure("Enter atleast 3 char in username field and try again!");
        }
    };
        
    var init = function () {
        var OrgAPI = $resource('/fih/stackatoapis/orgs');
        OrgAPI.query(function (orgs) {
            console.log("Fetched orgs: " + JSON.stringify(orgs));
            if (orgs) {
                var spaceData = [];
                for (var i = 0; i < orgs.length; i++) {
                    var spaces = orgs[i].spaces;
                    for (var j = 0; j < spaces.length; j++) {
                        spaces[j].org = {name: orgs[i].name, guid: orgs[i].guid};
                        spaceData.push({ id: spaces[j], label: spaces[j].name, orgName: orgs[i].name });
                    }
                }
                $scope.orgData = spaceData;
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

fihApp.controller('ModalInstanceCtrl', function ($uibModalInstance, $scope, $filter, $window, usernameParam, adUsers, NgTableParams) {
    console.log("Passed user name: " + usernameParam);
    console.log("adUsers: " + JSON.stringify(adUsers));
    $scope.selectedUser = {};
    $scope.selectedUser.username = usernameParam;

    $scope.noUserDataFound = false;
    if (adUsers && adUsers.length > 0) {
        $scope.noUserDataFound = false;
    }
    else {
        $scope.noUserDataFound = true;
    }

    $scope.searchModal = function () {
        adUsers = [
            { username: "testuser1", fullname: "test user1", email: "testuser1@fox.com" },
            { username: "testuser2", fullname: "test user2", email: "testuser2@fox.com" },
            { username: "testuser3", fullname: "test user3", email: "testuser3@fox.com" },
        ];

        $scope.users = $filter('filter')(adUsers, { username: $scope.selectedUser.username });
        $scope.adUserTable.total($scope.users);
        $scope.adUserTable.settings().dataset = $scope.users;
        $scope.adUserTable.reload();
    };

    $scope.modalOk = function () {
        if ($scope.rdbSelectedUser)
            $uibModalInstance.close($scope.rdbSelectedUser);
        else {
            $window.alert("Please select user from search table!");
        }
    };

    $scope.modalCancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    $scope.pageLoaded = false;
    if (!$scope.pageLoaded) {
        $scope.users = $filter('filter')(adUsers, { username: $scope.selectedUser.username });
        if ($scope.users.length === 1) {
            $scope.rdbSelectedUser = $scope.users[0];
            $scope.selectedUser.username = $scope.users[0].username;
            $scope.selectedUser.fullname = $scope.users[0].fullname;
            $scope.selectedUser.email = $scope.users[0].email;
        }
        $scope.pageLoaded = true;
    }
    else {
        $scope.users = adUsers;
    }

    $scope.resetModal = function () {
        $scope.rdbSelectedUser = undefined;
        $scope.selectedUser.username = usernameParam;
        $scope.selectedUser.fullname = "";
        $scope.selectedUser.email = "";
        $scope.users = $filter('filter')(adUsers, { username: $scope.selectedUser.username });
        $scope.adUserTable.total($scope.users);
        $scope.adUserTable.settings().dataset = $scope.users;
        $scope.adUserTable.reload();
    };

    $scope.adUserTable = new NgTableParams(
        {
            page: 1,
            count: 5
        },
        {
            counts: [],
            paginationMaxBlocks: 13,
            paginationMinBlocks: 2,
            total: $scope.users.length,
            dataset: $scope.users,
        }
    );
    $scope.rdbChanged = function (rdbSelectedUser) {
        $scope.rdbSelectedUser = rdbSelectedUser;
        $scope.selectedUser.username = rdbSelectedUser.username;
        $scope.selectedUser.fullname = rdbSelectedUser.fullname;
        $scope.selectedUser.email = rdbSelectedUser.email;
    };

    $scope.openPromptFailure = function (message) {
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
        }).then(function () {
            //he hit ok and not can,
        });
    };
});

