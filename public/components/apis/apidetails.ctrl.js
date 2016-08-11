
fihApp.controller('ApiDetailsCtrl', function ($scope, $routeParams, $resource) {
    $scope.apiName = $routeParams.apiname;
        
    var init = function () {
        var ApiService = $resource('/fih/apis/name/' + $scope.apiName);
        ApiService.get(function (apiDetails) {
            console.log("Fetched api details: " + JSON.stringify(apiDetails));
            $scope.apiDetails = apiDetails;
            $scope.apiSummary = [
                { "Version": apiDetails.version },
                { "created Date": apiDetails.created_date },
                { "References": apiDetails.references },
                { "Created By": apiDetails.created_by },
                { "Endpoint": apiDetails.api_ep },
                { "Last Updated": apiDetails.last_updated_date },
                { "Published Date": apiDetails.published_date },
                { "Last Updated By": apiDetails.last_updated_by }
            ];

        });
    };



    init();
});