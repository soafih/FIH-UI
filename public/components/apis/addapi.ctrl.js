
fihApp.controller('AddApiCtrl', function($scope, $resource, $location){
    $scope.pageHeader = "API Configuration";
    $scope.save = function(){
        var Apis = $resource('/fih/apis');
        Apis.save($scope.api, function(){
            $location.path('/');
        });
    };
});