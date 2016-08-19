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

fihApp.controller('SidebarCtrl', function($scope, $resource, $location){
    $scope.isActive = function(route) {
        return route === $location.path();
    };
});

fihApp.controller('MainCtrl', function ($rootScope,  UserService, LoginService, $scope) {
    var main = this;

    function logout() {
        LoginService.logout()
            .then(function (response) {
                main.currentUser = UserService.setCurrentUser(null);
                //$state.go('login');
            }, function (error) {
                console.log(error);
            });
    }
    $rootScope.$on('authorized', function () {
        main.currentUser = UserService.getCurrentUser();
        $scope.currentUser = UserService.getCurrentUser();
        console.log("Authorized: "+main.currentUser.username);
    });

    $rootScope.$on('unauthorized', function () {
        main.currentUser = UserService.setCurrentUser(null);
        //$state.go('login');
    });

    main.logout = logout;
    main.currentUser = UserService.getCurrentUser();
});

fihApp.service('LoginService', function ($http) {
    var service = this,
        path = 'Users/';

    service.login = function (credentials) {
        //return $http.post(getLogUrl('login'), credentials);
    };

    service.logout = function () {
        //return $http.post(getLogUrl('logout'));
    };

    service.register = function (user) {
        //return $http.post(getUrl(), user);
    };
});

fihApp.service('UserService', function (store) {
    var service = this,
    currentUser = null;

    service.setCurrentUser = function (user, accessToken) {
        console.log("User Service:"+JSON.stringify(user)+" : "+accessToken);
        currentUser = user;
        currentUser.access_token = accessToken;
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
    console.log("Entered APIInterceptor..!!");
    var service = this;
    service.request = function (config) {
        console.log("Entered Service..!!");
        var currentUser = UserService.getCurrentUser(),
            access_token = currentUser ? currentUser.accessToken : null;
        if (access_token) {
            config.headers.authorization = access_token;
            console.log(" config.headers: "+ config.headers);
        }
        if(currentUser)
            console.log("APIInterceptor:"+JSON.stringify(currentUser.access_token));
        return config;
    };
    service.responseError = function (response) {
        if (response.status === 401) {
            $rootScope.$broadcast('unauthorized');
        }
        return response;
    };
});


/*
fihApp.run(function(UserSession) {}); //bootstrap session;

fihApp.factory('UserSession', function ($http) {
    console.log("Initiated UserSession Service..!!");
    var UserSession = {
        data: {},
        saveSession: function () { // persist session data if required 
            },
        updateSession: function (userObj) {
            /* load data from db 
              $http.get('session.json').then(function (r) { 
                  return Session.data = r.data; 
              });
            console.log('Updating user session data');
            UserSession.accessToken = userObj.accessToken;
            UserSession.username = userObj.username;
            delete userObj.accessToken;
            UserSession.data = userObj;
            return true;
        }
    };
    //Session.updateSession();
    return UserSession;
});
*/

    
