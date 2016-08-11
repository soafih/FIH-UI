angular.module('fihApp').controller('LoginCtrl', function ($scope, $resource, $window) {
    $scope.pageHeader = "Login";

    $scope.credentials = {
        username: "",
        password: ""
    };
    $scope.onSubmit = function () {
        console.log("Sending request to stackato.");
        var StackatoService = $resource('/fih/stackatoapis/login');
        StackatoService.save($scope.credentials, function (res) {
            var response = JSON.stringify(res);
            if (res.status == 'success') {
                console.log("Login success.." + res.accessToken);
                $window.alert("Logged in successfully..");
            }
            else {
                console.log('Failed to authenticate..');
                $window.alert("Authentication Failed. Try again..!!");
            }
        },
            function (error) {
                var response = JSON.stringify(error);
                console.log("Response Error:" + response);
            });
    };
});
