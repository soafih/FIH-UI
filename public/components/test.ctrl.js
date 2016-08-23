angular.module('fihApp').controller('TestCtrl', function ($scope, $resource, $window, $cookies) {
    $cookies.put("FihUITestCookie", "FihUITestCookieValue");
    console.log("stackato-sso:"+$cookies.get('stackato-sso'));
    $scope.cookieValue = JSON.stringify($cookies.get('stackato-sso'));
    console.log("All Cookies:"+JSON.stringify($cookies.getAll()));
    //$scope.browserCookie = JSON.stringify($browser.cookies());
    $scope.test = function () {
        console.log("Sending request to stackato.");
        var StackatoService = $resource('/fih/security/user');
        StackatoService.get(function (res) {
            
            var response = JSON.stringify(res);
            
            $scope.responseData = response;
        },
            function (error) {
                var response = JSON.stringify(error);
                console.log("Response Error:" + response);
            });
    };
});
