var fihApp = angular.module('fihApp', ['ngAnimate','ui.bootstrap','ngResource','ngRoute','ngTable', 'ngCookies', 'angular-storage']);
fihApp.constant("DOMAIN_URL","soadev.stackato-poc.foxinc.com");

fihApp.config(['$routeProvider','$httpProvider', function($routeProvider, $httpProvider){
    $routeProvider
        .when('/', {
            templateUrl: 'components/marketplace/marketplace.html',
            controller: 'MarketPlaceCtrl',
            activetab: 'APIMarketplace'
        })
        .when('/dashboard', {
            templateUrl: 'components/dashboard/dashboard.html',
            controller: 'DashboardCtrl',
            activetab: 'Dashboard'
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
            activetab: 'Applications'
        })
        .when('/appdetails/:appname', {
            templateUrl: 'components/apps/appdetails.html',
            controller: 'AppDetailsCtrl'
        })
        .when('/add-api', {
            templateUrl: 'components/apis/addapi.html',
            controller: 'AddApiCtrl'
        })
        .when('/appstatus', {
            templateUrl: 'components/apps/appstatus.html',
            controller: 'AppStatusCtrl',
        })
        .when('/login', {
            templateUrl: 'components/login/login-form.html',
            controller: 'LoginCtrl',
        })
        .when('/add-app/:apitype', {
            templateUrl: 'components/apps/addapp.html',
            controller: 'AddAppCtrl',
            resolve: {
                databaseList: function(databaseListFactory) {
                    return databaseListFactory.getDatabaseList();
                }
            }
        })
        .otherwise({
            redirectTo: '/'
        });

    $httpProvider.interceptors.push('APIInterceptor');
}]);

fihApp.service('UserService', function (store) {
    var service = this,
        currentUser = null;

    service.setCurrentUser = function (user) {
        currentUser = user;
        store.set('user', user);
        return currentUser;
    };

    service.getCurrentUser = function () {
        if (!currentUser) {
            currentUser = store.get('user');
        }
        return currentUser;
    };

});

fihApp.service('APIInterceptor', function ($rootScope, UserService) {
    var service = this;
    service.request = function (config) {
        var currentUser = UserService.getCurrentUser(),
            access_token = currentUser ? currentUser.access_token : null;
        if (access_token) {
            config.headers.authorization = access_token;
        }
        return config;
    };
    service.responseError = function (response) {
        if (response.status === 401) {
            $rootScope.$broadcast('unauthorized');
        }
        return response;
    };
});

fihApp.controller('SidebarCtrl', function($scope, $resource, $location){
    $scope.isActive = function(route) {
        return route === $location.path();
    };

});


    
