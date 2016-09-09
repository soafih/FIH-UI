angular.module('fihApp').controller('UsersCtrl', function ($scope, $resource, userList, NgTableParams ) {
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
        smartButtonMaxItems: 3,
        smartButtonTextConverter: function (itemText, originalItem) {
            if (itemText === 'Jhon') {
                return 'Jhonny!';
            }

            return itemText;
        }
    };
    $scope.users = userList.data;
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
    $scope.countChecked = 1;

    var countCheckedBox = function(){

    };
     // watch for check all checkbox
    $scope.$watch('checkboxes.checked', function(value) {
        $scope.countChecked = 0;
        angular.forEach($scope.users, function(item) {
            if (angular.isDefined(item.username)) {
                $scope.checkboxes.items[item.username] = value;
            }
        });
    });

    var init = function () {
        var SecurityAPI = $resource('/fih/security/roles');
        SecurityAPI.query(function (roles) {
            if(roles){
                $scope.roles = roles;
                for(var i=0; i<roles.length; i++){
                    $scope.rolesData.push({id: roles[i]._id, label: roles[i].name});
                }
            }
        });

        var OrgAPI = $resource('/fih/stackatoapis/orgs');
        OrgAPI.query(function (orgs) {
            console.log("Fetched orgs: "+JSON.stringify(orgs));
            if(orgs){
                $scope.orgs = orgs;
                for(var i=0; i<orgs.length; i++){
                    $scope.orgData.push({id: orgs[i].name, label: orgs[i].name});
                }
            }
        });

        var SpaceAPI = $resource('/fih/stackatoapis/spaces');
        SpaceAPI.query(function (spaces) {
            console.log("Fetched orgs: "+JSON.stringify(spaces));
            if(spaces){
                $scope.spaces = spaces;
                for(var i=0; i<spaces.length; i++){
                    $scope.spaceData.push({id: spaces[i].name, label: spaces[i].name});
                }
            }
        });

    };

    init();
});


fihApp.factory('userListFactory', function ($http) {
    var factoryResult = {
        getUserList: function () {
            var promise = $http({
                method: 'GET',
                url: '/fih/security/users'
            }).success(function (data, status, headers, config) {
                return data;
            });

            return promise;
        }
    };

    return factoryResult;
});
