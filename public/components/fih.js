var fihApp = angular.module('fihApp', ['ngAnimate','ui.bootstrap', 'ngSanitize', 'cgPrompt', 'ngResource', 'ngRoute', 'ngTable', 'ngCookies', 'angular-storage','ngMaterial', 'angular-loading-bar']);
fihApp.constant('AUTH_EVENTS', {
    notAuthenticated: 'auth-not-authenticated',
    notAuthorized: 'auth-not-authorized'
});
fihApp.config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider) {
    cfpLoadingBarProvider.includeSpinner = false;
    cfpLoadingBarProvider.spinnerTemplate = '<div><span class="fa fa-spinner fa-spin">Loading...</div>';
  }]);

fihApp.config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'components/marketplace/marketplace.html',
            controller: 'MarketPlaceCtrl',
            resolve: {
                userProfile: "UserProfile"
            }
        })
		.when('/apidetails/:apiname', {
            templateUrl: 'components/apis/apidetails.html',
            controller: 'ApiDetailsCtrl',
			resolve: {
                userProfile: "UserProfile",
                access: ["Access", function (Access) { return Access.hasAnyRole("api_operator, api_developer"); }]
            }
        })
        .when('/dashboard', {
            templateUrl: 'components/dashboard/dashboard.html',
            controller: 'DashboardCtrl',
            resolve: {
                access: ["Access", function (Access) { return Access.hasRole("app_admin"); }]
            }
        })
        .when('/help', {
            templateUrl: 'components/help/help.html',
            controller: 'HelpCtrl',
        })
        .when('/forbidden', {
            templateUrl: 'components/shared/forbidden.html',
        })
        .when('/test', {
            templateUrl: 'components/test.html',
            controller: 'TestCtrl',
        })
        .when('/apps', {
            templateUrl: 'components/apps/apps.html',
            controller: 'AppsCtrl',
            resolve: {
                userProfile: "UserProfile",
                access: ["Access", function (Access) { return Access.hasRole("app_developer"); }]
            }
        })
        .when('/appdetails/:appname', {
            templateUrl: 'components/apps/appdetails.html',
            controller: 'AppDetailsCtrl',
            resolve: {
                userProfile: "UserProfile",
                access: ["Access", function (Access) { return Access.hasAnyRole("app_operator, app_developer"); }]
            }
        })
        .when('/add-api', {
            templateUrl: 'components/apis/addapi.html',
            controller: 'AddApiCtrl',
            resolve: {
                access: ["Access", function (Access) { return Access.hasRole("api_developer"); }]
            }
        })
        .when('/appstatus', {
            templateUrl: 'components/apps/appstatus.html',
            controller: 'AppStatusCtrl',
            resolve: {
                access: ["Access", function (Access) { return Access.hasRole("app_developer"); }]
            }
        })
        .when('/add-app/:apitype', {
            templateUrl: 'components/apps/addapp.html',
            controller: 'AddAppCtrl',
            resolve: {
                userProfile: "UserProfile",
                databaseList: function (databaseListFactory) {
                    return databaseListFactory.getDatabaseList();
                },
                access: ["Access", function (Access) { return Access.hasRole("app_developer"); }]
            }
        })
		.when('/dbconfig', {
            templateUrl: 'components/dbconfig/dbconfig.html',
            controller: 'dbconfigctrl',
            resolve: {
                userProfile: "UserProfile",
                access: ["Access", function (Access) { return Access.hasRole("app_admin"); }]
            }
        })
		.when('/users', {
            templateUrl: 'components/admin/users.html',
            controller: 'UsersCtrl',
            resolve: {
                userProfile: "UserProfile",
                access: ["Access", function (Access) { return Access.hasRole("fih_admin"); }]
            }
        })
        .when('/roles', {
            templateUrl: 'components/admin/roles.html',
            controller: 'RolesCtrl',
            resolve: {
                userProfile: "UserProfile",
                access: ["Access", function (Access) { return Access.hasRole("fih_admin"); }]
            }
        })
        .otherwise({
            redirectTo: '/'
        });

    $httpProvider.interceptors.push('APIInterceptor');
    $httpProvider.interceptors.push('RedirectInterceptor');
}]);

fihApp.service('APIInterceptor', function ($rootScope) {
    console.log("Entered APIInterceptor..!!");
    var service = this;
    service.request = function (config) {
        return config;
    };
    service.response = function (response) {
        if (response.status === 401 || response.status === 403) {
            $rootScope.$broadcast('unauthorized');
        }
        return response;
    };
    service.responseError = function (response) {
         if (response.status === 400) {
            $rootScope.$broadcast('usernotfound');
        }
        if (response.status === 401 || response.status === 403) {
            $rootScope.$broadcast('unauthorized');
        }
        if (response.status === 503) {
            $rootScope.$broadcast('serviceunavailable');
        }
        return response;
    };
});

fihApp.factory('RedirectInterceptor', function($window, $location, $q) {
    console.log("RedirectInterceptor | Entered");
    return function(promise) {
        promise.then(
            function(response) {
                if (typeof response.data === 'string') {
                    console.log("RedirectInterceptor | Str response");
                    if (response.data.indexOf instanceof Function) {
                    //&& response.data.indexOf('<html id="ng-app" ng-app="loginApp">') != -1) {
                        //$location.path("/logout");
                        console.log("RedirectInterceptor | Redirecting to logout");
                        $window.location.href = "/auth/logout"; 
                    }
                }
                return response;
            },
            function(response) {
                 console.log("RedirectInterceptor | $q reject");
                return $q.reject(response);
            }
        );
        return promise;
    };
});

fihApp.controller('SidebarCtrl', function ($scope, $resource, $location) {
    $scope.isActive = function (route) {
        if(route instanceof Array){
            var res = false;
            for(var i=0; i<route.length;i++){
                res = route[i] === $location.path();
                if(res)
                    break;
            }
            return res;
        }
        return route === $location.path();
    };
});

fihApp.controller('LogoutCtrl', function ($scope, $resource, userProfile) {
    console.log("Logging out..");
    userProfile.$refresh();
    $window.location.href = '/auth/logout';
});

fihApp.controller('MainCtrl', function ($rootScope, $scope, $window, $location, UserProfile, prompt) {
    $scope.showSidebarApps = true;
    $scope.showSidebarDashboard = true;
    $scope.loadUserData = function(){
        UserProfile.then(function (response) {
            console.log(response);
            if(response._id){
                $scope.userfullname = response.first_name + ' ' + response.last_name;
                $scope.useremail = response.email;
                var userOrgs = '';
                var userSpaces = '';
                var orgs = response.stackato_config;
                for(var i=0; i < orgs.length; i++){
                    userOrgs += orgs[i].name + ', ';
                    userSpaces += orgs[i].spaces + ', ';
                }
                $scope.userorgs = userOrgs.slice(0, -2);
                $scope.userspaces = userSpaces.slice(0, -2);
            }
            else{
                $rootScope.$broadcast('usernotfound'); 
            }
        });
    };

    $scope.logout = function(message){
        console.log("Logging out..");
        $window.location.href = '/auth/logout';
    };

    $scope.openDialog = function(message){
        prompt({
            title: 'Alert!',
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

    $rootScope.$on('usernotfound', function(){
        $scope.openDialog('User details not found. Only API Market place will be visible to you. In case you need further access, please contact System Administrator.');
        $location.path('/');
    });
    $rootScope.$on('unauthorized', function () {
        $location.path('/forbidden');
    });
    $rootScope.$on('serviceunavailable', function () {
        $scope.openDialog("System seems to be responding slow. Please try after sometime.");
    });
});

fihApp.run(function ($rootScope, $location, Access) {

    $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
        if (rejection == Access.UNAUTHORIZED) {
            $rootScope.$broadcast('unauthorized');
        } else if (rejection == Access.FORBIDDEN) {
            $rootScope.$broadcast('unauthorized');
        }
    });

    var history = [];

    $rootScope.$on('$routeChangeSuccess', function() {
        history.push($location.$$path);
    });

    $rootScope.back = function () {
        console.log("Go back:"+history.splice(-2)[0]);
        var prevUrl = history.length > 1 ? history.splice(-2)[0] : "/";
        $location.path(prevUrl);
    };
}); //bootstrap session;

fihApp.factory("Access", function ($q, UserProfile) {

    var Access = {
        OK: 200,

        // "User is unknown"
        UNAUTHORIZED: 401,

        // "User is known but profile does not allow access this resource"
        FORBIDDEN: 403,

        hasRole: function (role) {
            console.log("Access | Checking Access for Role: " + role);
            return UserProfile.then(function (userProfile) {
                //console.log("Access | userProfile: " + JSON.stringify(userProfile));
                if (userProfile.$hasRole(role)) {
                    console.log("Access | Permission Granted to " + role);
                    return Access.OK;
                }
                else {
                    console.log("Access | Permission denied to role: " + role);
                    return $q.reject(Access.FORBIDDEN);
                }
            });
        },

        hasAnyRole: function (roles) {
            console.log("Access | Checking Access for Roles: " + roles);
            return UserProfile.then(function (userProfile) {
                if (userProfile.$hasAnyRole(roles)) {
                    return Access.OK;
                }
                else {
                    console.log("Access | Permission denied to roles: " + roles);
                    return $q.reject(Access.FORBIDDEN);
                }
            });
        }
    };

    return Access;

});

fihApp.service("UserService", function (Security) {
    var service = this;
    service.hasAnyRole = function(roles){
        Security.getProfile().then(function (response) {
            var found = false;
            console.log("User Roles:" +response.roles);
            console.log("Auth Roles: "+roles);
            for (var i = 0; i < roles.length; i++) {
                if (response.roles.indexOf(roles[i]) > -1) {
                    console.log("Found");
                    found = true;
                    break;
                }
            }
            return found;
        });
    };
});

fihApp.factory("UserProfile", function (Security) {

    var userProfile = {};

    var fetchUserProfile = function () {
        return Security.getProfile().then(function (response) {

            for (var prop in userProfile) {
                if (userProfile.hasOwnProperty(prop)) {
                    delete userProfile[prop];
                }
            }

            return angular.extend(userProfile, response.data, {

                $userProfile: userProfile,

                $refresh: fetchUserProfile,

                $hasPermission: function (resource) {
                    if(userProfile.permission)
                        return userProfile.permission.indexOf(resource) >= 0;
                },

                $hasRole: function (role) {
                    if(userProfile.roles)
                        return userProfile.roles.indexOf(role) >= 0;
                },

                $hasAnyRole: function (roles) {
                    if(userProfile.roles)
                    return !!userProfile.roles.filter(function (role) {
                        return roles.indexOf(role) >= 0;
                    }).length;
                },

            });
        });
    };

    return fetchUserProfile();

});

fihApp.service("Security", function ($http, $window) {

    this.getProfile = function () {
        console.log("Fetching user profile data..!!");
        return $http.get("/fih/security/user");
    };
});


    
