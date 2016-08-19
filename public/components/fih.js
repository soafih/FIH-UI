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
        .when('/apidetails/:apiname', {
            templateUrl: 'components/apis/apidetails.html',
            controller: 'ApiDetailsCtrl'
        })
        .when('/help', {
            templateUrl: 'components/help/help.html',
            controller: 'HelpCtrl',
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

}]);


fihApp.controller('SidebarCtrl', function($scope, $resource, $location){
    $scope.isActive = function(route) {
        return route === $location.path();
    };

});


    
