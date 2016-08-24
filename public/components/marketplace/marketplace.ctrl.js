fihApp.controller('MarketPlaceCtrl', function ($scope, $resource, $location, userProfile) {
    $scope.pageHeader = "API Markeplace";
    $scope.isActive = function (route) {
        return route === $location.path();
    };
    
    $scope.showBtnAddApp = userProfile.$hasPermission('app.create');

    // Generate random colors for API Panel
    $scope.Math = window.Math;
    $scope.hcolors = new Array("#009688", "#D50000", "#2962FF", "#2E7D32", "#006064", "#607D8B", "#4E342E", "#E64A19");
    $scope.bcolors = new Array("#80CBC4", "#FF8A80", "#82B1FF", "#C8E6C9", "#B2EBF2", "#CFD8DC", "#BCAAA4", "#FFAB91");
    $scope.fcolors = new Array("#E0F2F1", "#FFEBEE", "#E3F2FD", "#E8F5E9", "#E0F7FA", "#ECEFF1", "#EFEBE9", "#FBE9E7");

    $scope.hexstyle = new Array("hexagon1", "hexagon2", "hexagon3", "hexagon4", "hexagon5");
    $scope.hextextstyle = new Array("hex-text1", "hex-text2", "hex-text3", "hex-text4", "hex-text5");

    var Apis = $resource('/fih/apis');
    Apis.query(function (apis) {
        $scope.apis = apis;
    });
    
});


fihApp.controller('ModalApiCtrl', function ($scope, $window) {

    $scope.viewDetails = function (apiName) {
        $window.location.href = "/#/apidetails/" + apiName;
    };
});