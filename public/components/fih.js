var fihApp = angular.module('fihApp', ['ngAnimate', 'ui.bootstrap', 'ngResource', 'ngRoute', 'ngTable', 'ngCookies', 'angular-storage']);
fihApp.constant('AUTH_EVENTS', {
    notAuthenticated: 'auth-not-authenticated',
    notAuthorized: 'auth-not-authorized'
});

fihApp.config(['$routeProvider', '$httpProvider', function ($routeProvider, $httpProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'components/marketplace/marketplace.html',
            controller: 'MarketPlaceCtrl',
            activetab: 'APIMarketplace',
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
            activetab: 'Dashboard',
            resolve: {
                access: ["Access", function (Access) { return Access.hasRole("app_admin"); }]
            }
        })
        .when('/help', {
            templateUrl: 'components/help/help.html',
            controller: 'HelpCtrl',
        })
        .when('/test', {
            templateUrl: 'components/test.html',
            controller: 'TestCtrl',
        })
        .when('/apps', {
            templateUrl: 'components/apps/apps.html',
            controller: 'AppsCtrl',
            activetab: 'Applications',
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
                userProfile: "UserProfile",
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
        .otherwise({
            redirectTo: '/'
        });

    //$httpProvider.interceptors.push('APIInterceptor');
}]);

fihApp.controller('SidebarCtrl', function ($scope, $resource, $location) {
    $scope.isActive = function (route) {
        return route === $location.path();
    };
});

fihApp.controller('MainCtrl', function ($rootScope, $scope) {
    $scope.showSidebarApps = true;
    $scope.showSidebarDashboard = true;
    
    $scope.userData = $rootScope.user;
});

fihApp.run(function ($resource, $rootScope, $location, $window, Access) {

    $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
        if (rejection == Access.UNAUTHORIZED) {
            console.log("Rejection: " + JSON.stringify(rejection));
            $window.alert('You are not authorized to access this page. Please contact system administrator for details.');
            $location.path("/");
        } else if (rejection == Access.FORBIDDEN) {
            $window.alert('You are not allowed to access this page. Please contact system administrator for details.');
            $location.path("/forbidden");
        }
    });
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
                console.log("Access | userProfile: " + JSON.stringify(userProfile));
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

fihApp.factory("UserProfile", function (Security, $rootScope) {

    var userProfile = {};

    var fetchUserProfile = function () {
        return Security.getProfile().then(function (response) {
            $rootScope.user = response;
            console.log("Loaded user profile");
            for (var prop in userProfile) {
                if (userProfile.hasOwnProperty(prop)) {
                    delete userProfile[prop];
                }
            }

            return angular.extend(userProfile, response.data, {

                $refresh: fetchUserProfile,

                $hasPermission: function (resource) {
                    return userProfile.permission.indexOf(resource) >= 0;
                },

                $hasRole: function (role) {
                    return userProfile.roles.indexOf(role) >= 0;
                },

                $hasAnyRole: function (roles) {
                    return !!userProfile.roles.filter(function (role) {
                        return roles.indexOf(role) >= 0;
                    }).length;
                },

            });
        });
    };
    return fetchUserProfile();

});

fihApp.service("Security", function ($http) {

    this.getProfile = function () {
        console.log("Fetching user profile data..!!");
        return $http.get("/fih/security/user");
    };
});



    
