
fihApp.controller('ApiDetailsCtrl', function ($scope, $routeParams, $resource, $filter) {
    $scope.apiName = $routeParams.apiname;
        
    var init = function () {
        var ApiService = $resource('/fih/apis/name/' + $scope.apiName);
        ApiService.get(function (apiDetails) {
            console.log("Fetched api details: " + JSON.stringify(apiDetails));
            $scope.apiDetails = apiDetails;

            $scope.apiSummary = [
                { "Version": apiDetails.version },
                { "created Date": $filter('date')(toJsDate(apiDetails.created_date), "yyyy-MM-dd HH:mm:ss")},
                { "References": apiDetails.references },
                { "Created By": apiDetails.created_by },
                { "Endpoint": apiDetails.api_ep },
                { "Last Updated": $filter('date')(toJsDate(apiDetails.last_updated_date), "yyyy-MM-dd HH:mm:ss")},
                { "Published Date": $filter('date')(toJsDate(apiDetails.published_date), "yyyy-MM-dd HH:mm:ss")},
                { "Last Updated By": apiDetails.last_updated_by }
            ];

        });
    };
    init();
});

var toJsDate = function (str) {
    if (!str) return null;
    return new Date(str);
};