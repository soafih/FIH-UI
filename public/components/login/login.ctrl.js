angular.module('fihApp').controller('LoginCtrl', function ($scope, $resource, $window, $location, UserService, $rootScope) {
    $scope.pageHeader = "Login";

    $scope.credentials = {
        username: "",
        password: ""
    };

    $scope.onSubmit = function () {
        var StackatoService = $resource('/fih/stackatoapis/login');
        StackatoService.save($scope.credentials, function (res) {
            var response = JSON.stringify(res);
            if (res.status == 'success') {
                var SecurityService = $resource('/fih/security/'+res.username);
                SecurityService.get(function (user) {
                    user.accessToken = res.accessToken;
                    console.log("Final User Obj: "+JSON.stringify(user));
                    UserService.setCurrentUser(user, res.accessToken);
                    
                    $rootScope.$broadcast('authorized');
                    $location.path('/apps');
                },
                    function (error) {
                        var response = JSON.stringify(error);
                        console.log("Response Error:" + response);
                    });
                //$window.alert("Logged in successfully..");
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
