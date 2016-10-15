var graphApp = angular.module('graphApp', ['ng']);

graphApp.controller('graphAppController', function GraphAppController($scope) {
    $scope.title = "Deer God";
    $scope.d3Data = [];
    $scope.add = function(data) {
        var f = document.getElementById('file').files[0];
        var r = new FileReader();
        r.onloadend = function(e) {
            console.log(e.target.result);
            console.log(d3.csvParseRows(e.target.result));
            $scope.parseData(e.target.result);
            $scope.d3Data = d3.csvParseRows(e.target.result);
            $scope.$apply();
        };
        r.readAsBinaryString(f);
    };
    $scope.onClick = function(scope) {
        d3.text("./public/data/data.csv", function(error, data) {
            if (error) throw error;
            $scope.d3Data = d3.csvParseRows(data);
            $scope.$apply();
        });
    };
    $scope.parseData = function(unparsedData) {
        var data = d3.csvParseRows(unparsedData);
        var peaks = [];
        console.log(data.length);
        // Find the peaks in magnetic activity from the data
        for (i = 0; i < data.length; i++) {
            if (i == 0) {
                if (parseInt(data[i][0]) > parseInt(data[i + 1][0])) {
                    peaks.push(data[i][0]);
                }
            } else if (i == data.length - 1) {
                if (parseInt(data[i][0]) > parseInt(data[i - 1][0])) {
                    peaks.push(data[i][0]);
                }
            } else {
                if (parseInt(data[i][0]) > parseInt(data[i - 1][0]) && parseInt(data[i][0]) > parseInt(data[i + 1][0])) {
                    peaks.push(data[i][0]);
                }
            }
        }
        console.log("peaks", peaks);
    };
});

graphApp.directive('d3Bars', [function() {
    return {
        restrict: 'EA',
        scope: {
            data: '=',
            label: '@',
            onClick: "&"
        },
        link: function(scope, iElement, iAttrs) {
            var svg = d3.select(iElement[0])
                .append("svg")
                .attr("width", "100%");

            scope.$watch(function() {
                return scope.render(scope.data);
            });

            // watch for data changes and re-render
            scope.$watch('data', function(newVals, oldVals) {
                return scope.render(newVals);
            }, true);

            // define render function
            scope.render = function(data) {
                console.log("data", data);
                // remove all previous items before render
                svg.selectAll("*").remove();
                // setup variables
                var width, height, max;
                width = d3.select(iElement[0]).node().offsetWidth - 20;
                // 20 is for margins and can be changed
                height = scope.data.length * 50;
                // 35 = 30(bar height) + 5(margin between bars)
                max = 150;
                // this can also be found dynamically when the data is not static
                // max = Math.max.apply(Math, _.map(data, ((val)-> val.count)))

                // set the height based on the calculations above
                svg.attr('height', height);

                //create the rectangles for the bar chart
                svg.selectAll("rect")
                    .data(data)
                    .enter()
                    .append("rect")
                    .attr("height", 30) // height of each bar
                    .attr("width", function(d) {
                        return d / (max / width);
                    }) // width of the bar
                    .attr("fill", "#ffff") // color of each bar
                    .attr("x", 10) // half of the 20 side margin specified above
                    .attr("y", function(d, i) {
                        return i * 50;
                    }); // height + margin between bars

                svg.selectAll("text")
                    .data(data)
                    .enter()
                    .append("text")
                    .attr("fill", "#fff")
                    .attr("y", function(d, i) {
                        return i * 50 + 22;
                    })
                    .attr("x", 15)
                    .text(function(d) {
                        return d;
                    });

            };
        }
    };
}]);
