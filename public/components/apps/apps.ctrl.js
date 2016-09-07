
fihApp.controller('AppsCtrl', function($scope, $resource, $location, userProfile, $filter, $uibModal){
    $scope.pageHeader = "Applications / Integration Services";
    $scope.isActive = function(route) {
        return route === $location.path();
    };
    
    $scope.showBtnView = userProfile.$hasPermission('app.view');

    // Generate random colors for API Panel
    $scope.Math = window.Math;
    $scope.hcolors = new Array("#009688","#D50000","#2962FF","#2E7D32","#006064","#607D8B","#4E342E","#E64A19");
    $scope.bcolors = new Array("#80CBC4","#FF8A80","#82B1FF","#C8E6C9","#B2EBF2","#CFD8DC","#BCAAA4","#FFAB91");
    $scope.fcolors = new Array("#E0F2F1","#FFEBEE","#E3F2FD","#E8F5E9","#E0F7FA","#ECEFF1","#EFEBE9","#FBE9E7");

    var orgs = [], spaces = [];
    for (var i = 0; i < userProfile.stackato_config.length; i++) {
        orgs.push(userProfile.stackato_config[i].name);
        spaces = spaces.concat(userProfile.stackato_config[i].spaces);
    }
    var request = {
        "orgs": orgs,
        "spaces": spaces
    };
    var Apps = $resource('/fih/apps/userorgspace');
    Apps.save(request, function (res) {
            $scope.apps = res.apps;
            $scope.appSearchBackup = res.apps;
        },function(error){
            console.log("Got error: "+JSON.stringify(error.data));
        }
    );

    $scope.advKeyVal = [];

    $scope.AdvSearchList = [
        { id: "name", name: "Application Name" },
		{ id: "descr", name:"Application Description"},
        { id: "api_type", name: "API Name" },
        { id: "api_ver", name: "API Version" },
        { id: "created_by", name: "Created By" },
        { id: "created_date", name: "Created Date" },
        { id: "last_updated_date", name: "Modified Date" },
        { id: "org", name: "Organization" },
        { id: "space", name: "Space" }
    ];


    $scope.simpleFilter = function (app) {
        if ($scope.simpleSearchQuery == null || app.name.toLowerCase().indexOf($scope.simpleSearchQuery.toLowerCase()) != -1 || app.api_type.toLowerCase().indexOf($scope.simpleSearchQuery.toLowerCase()) != -1 || app.created_by.toLowerCase().indexOf($scope.simpleSearchQuery.toLowerCase()) != -1) {
            return true;
        }
        return false;
    };


    $scope.advkeyValUpdate = function () {
       // console.log($scope.advSearchKey);

        if ($scope.advSearchVal == null && ($scope.advFromDate == null || $scope.advToDate == null)) {
             $scope.searchAlertModal();

            return;
        }
        if ($scope.advSearchVal == null) {
            $scope.advKeyVal.push({ id: $scope.advSearchKey.id, key: $scope.advSearchKey.name, val: $filter('date')($scope.advFromDate, "yyyy-MM-dd") + ',' + $filter('date')($scope.advToDate, "yyyy-MM-dd") });
        }
        else
            $scope.advKeyVal.push({ id: $scope.advSearchKey.id, key: $scope.advSearchKey.name, val: $scope.advSearchVal });


        $scope.AdvSearchList = $scope.AdvSearchList.filter(function (data) {
            return (data.id != $scope.advSearchKey.id);
        });

        $scope.advSearchVal = null;
        $scope.advFromDate = null;
        $scope.advToDate = null;

        $scope.advSearch();
    };


    $scope.advSearch = function () {

        $scope.apps = $scope.appSearchBackup;
        ($scope.advKeyVal).forEach(function (item) {
            if (item.id == 'org' || item.id == 'space') {
                $scope.apps = $scope.apps.filter(function (data, $scope) {
                    return (data.stackato_config[item.id].toLowerCase().indexOf(item.val.toLowerCase()) != -1);
                });
            }
            else if (item.id == 'created_date' || item.id == 'last_updated_date') {
                var dates = item.val.split(",");

                $scope.apps = $scope.apps.filter(function (data, $scope) {

                    return (data[item.id] >= dates[0] && data[item.id] <= dates[1]);
                });
            }
            else {
                $scope.apps = $scope.apps.filter(function (data, $scope) {
                    return (data[item.id].toLowerCase().indexOf(item.val.toLowerCase()) != -1);
                });
            }

        });
    };


    $scope.advRemoveFilter = function (id) {


        $scope.advKeyVal = $scope.advKeyVal.filter(function (data) {
            if (data.id != id)
                return true;

            else {
                $scope.AdvSearchList.push({ id: data.id, name: data.key });
                return false;
            }
        });
        $scope.advSearch();
    };

  $scope.advReset = function () {

        ($scope.advKeyVal).forEach(function (item) {
            $scope.AdvSearchList.push({ id: item.id, name: item.key });
        });

        $scope.advKeyVal = [];
        $scope.apps = $scope.appSearchBackup;
    };

  $scope.searchAlertModal = function () {
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'serachAlertModalContent.html',
            controller: 'ModalSearchAlertCtrl',
            size: 'sm'
        });

    };
});


fihApp.controller('ModalAppCtrl', function ($scope, $uibModal, $filter, $window) {

    $scope.animationsEnabled = true;
    $scope.appDetails = [];
    $scope.viewDetails = function(appName) {
        $window.location.href = "/#/appdetails/"+appName;
    };
    $scope.open = function (appName) {

        var choosenApp = $filter('filter')($scope.apps, {name: appName}, true)[0];
        console.log("Filtered App Details: " + JSON.stringify(choosenApp));

        $scope.appDetails = [
            { "App / Integration Service": choosenApp.name },
            { "Application Description": choosenApp.descr },
            { "API Type": choosenApp.api_type },
            { "API Version": choosenApp.api_ver },
            { "End Point": choosenApp.endpoint },
            { "Status": choosenApp.status },
            { "Organization": choosenApp.stackato_config.org },
            { "Space": choosenApp.stackato_config.space },
            { "Database": choosenApp.api_config.db_name },
            { "DB Query": choosenApp.api_config.query }
        ];
        console.log("App Details:" + JSON.stringify($scope.appDetails));

        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            templateUrl: 'myModalContent.html',
            controller: 'ModalInstanceCtrl',
            appName: appName,
            resolve: {
                appDetails: function () {
                    return $scope.appDetails;
                }
            }
        });

        modalInstance.result.then(function (selectedItem) {
            $scope.selected = selectedItem;
        }, function () {
            console.log('Modal dismissed at: ' + new Date());
        });
    };

});



// Note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.
fihApp.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, appDetails) {

    $scope.appDetails = appDetails;

    $scope.selected = {
    };

    $scope.ok = function () {
        $uibModalInstance.close($scope.selected.item);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

fihApp.controller('ModalSearchAlertCtrl', function ($scope, $uibModalInstance) {

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});