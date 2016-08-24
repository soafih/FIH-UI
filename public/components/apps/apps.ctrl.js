
fihApp.controller('AppsCtrl', function($scope, $resource, $location, userProfile){
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

    var Apps = $resource('/fih/apps');
    Apps.query(function(apps){
        $scope.apps = apps;
    });
});

fihApp.controller('ModalAppCtrl', function ($scope, $uibModal, $filter, $window) {

    $scope.animationsEnabled = true;
    $scope.appDetails = [];
    $scope.viewDetails = function(appName){
        $window.location.href = "/#/appdetails/"+appName;
    };
    $scope.open = function (appName) {
        
        var choosenApp = $filter('filter')($scope.apps, {name: appName}, true)[0];
        console.log("Filtered App Details: "+JSON.stringify(choosenApp));

        $scope.appDetails = [
            {"App / Integration Service" : choosenApp.name},
            {"Application Description" : choosenApp.descr},
            {"API Type" : choosenApp.api_type},
            {"API Version" : choosenApp.api_ver},
            {"End Point": choosenApp.endpoint},
            {"Status" : choosenApp.status},
            {"Organization" : choosenApp.stackato_config.org},
            {"Space" : choosenApp.stackato_config.space},
            {"Database" : choosenApp.api_config.db_name},
            {"DB Query" : choosenApp.api_config.query}
        ];
        console.log("App Details:"+JSON.stringify($scope.appDetails));

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