var graphApp = angular.module('graphApp', ['ng']);

graphApp.controller('graphAppController', function GraphAppController($scope) {
    //Global variables
    $scope.d3Data = [];
    $scope.magX = [];
    $scope.magY = [];
    $scope.magZ = [];

    // Time variables
    $scope.totalTime = 0;
    $scope.timeBlocks = 0;

    // Progress Variables
    $scope.inProgress = false;
    $scope.done = false;

    // Array with Times
    $scope.times = [];

    // Peak Thresholds
    $scope.XpeakThreshold = 0.4;
    $scope.YpeakThreshold = 0.15;
    $scope.ZpeakThreshold = -0.5;

    // Trough Thresholds
    $scope.XtroughThreshold = 0.1;
    $scope.YtroughThreshold = -0.4;
    $scope.ZtroughThreshold = -0.8;

    // Reads the input file and processes it
    $scope.add = function(data) {
        $scope.inProgress = true;
        var f = document.getElementById('file').files[0];
        var r = new FileReader();
        r.onloadend = function(e) {
            var rawData = e.target.result;
            // console.log(rawData);
            // console.log(d3.csvParseRows(rawData));
            $scope.parseData(rawData);
            // $scope.d3Data = d3.csvParseRows(e.target.result);
            $scope.$apply();
        };
        r.readAsBinaryString(f);
    };

    $scope.onClick = function(scope) {};

    $scope.parseData = function(unparsedData) {
        var data = d3.csvParseRows(unparsedData);
        $scope.timeTaken(data);
        $scope.parseMagData(data, 'X');
        $scope.parseMagData(data, 'Y');
        $scope.parseMagData(data, 'Z');
        $scope.compileData();
        $scope.configureData();
        $scope.inProgress = false;
        $scope.done = true;
    };

    $scope.parseMagData = function(data, dimension) {
        var dimensionNumber = 0;
        switch (dimension) {
            case 'X':
                dimensionNumber = 1;
                console.log('Dimension is X');
                break;
            case 'Y':
                dimensionNumber = 2;
                console.log('Dimension is Y');
                break;
            case 'Z':
                dimensionNumber = 3;
                console.log('Dimension is Z');
                break;
        };
        var peaks = [];
        var troughs = [];

        // Find the peaks in magnetic activity from the data
        // Only registers peaks that are above a predetermined threshold
        for (i = 1; i < data.length; i++) {
            if (i == 1) {
                if (parseFloat(data[i][dimensionNumber]) > parseFloat(data[i + 1][dimensionNumber])) {
                    if ($scope.checkData(data[i][dimensionNumber], dimension))
                        peaks.push(data[i]);
                }
            } else if (i == data.length - 1) {
                if (parseFloat(data[i][dimensionNumber]) > parseFloat(data[i - 1][dimensionNumber])) {
                    if ($scope.checkData(data[i][dimensionNumber], dimension))
                        peaks.push(data[i]);
                }
            } else {
                if (parseFloat(data[i][dimensionNumber]) > parseFloat(data[i - 1][dimensionNumber]) && parseFloat(data[i][dimensionNumber]) > parseFloat(data[i + 1][dimensionNumber])) {
                    if ($scope.checkData(data[i][dimensionNumber], dimension))
                        peaks.push(data[i]);
                }
            }
        };

        // Find the troughs in magnetic activity from the data
        // Only registers troughs that are below a predetermined threshold
        for (i = 1; i < data.length; i++) {
            if (i == 1) {
                if (parseFloat(data[i][dimensionNumber]) < parseFloat(data[i + 1][dimensionNumber])) {
                    if ($scope.checkData(data[i][dimensionNumber], dimension))
                        troughs.push(data[i]);
                }
            } else if (i == data.length - 1) {
                if (parseFloat(data[i][dimensionNumber]) < parseFloat(data[i - 1][dimensionNumber])) {
                    if ($scope.checkData(data[i][dimensionNumber], dimension))
                        troughs.push(data[i]);
                }
            } else {
                if (parseFloat(data[i][dimensionNumber]) < parseFloat(data[i - 1][dimensionNumber]) && parseFloat(data[i][dimensionNumber]) < parseFloat(data[i + 1][dimensionNumber])) {
                    if ($scope.checkData(data[i][dimensionNumber], dimension))
                        troughs.push(data[i]);
                }
            }
        };

        console.log(dimension + " peaks", peaks);
        console.log(dimension + " troughs", troughs);
        var compile = peaks.concat(troughs);
        console.log("Compiled " + dimension, compile);
        $scope.addMagData(compile, dimension);
    };

    // Check if data meets threshold requirements
    $scope.checkData = function(rawData, dimension) {
        var data = parseFloat(rawData);
        switch (dimension) {
            case 'X':
                if (data > $scope.XpeakThreshold) {
                    return true;
                } else if (data < $scope.XtroughThreshold) {
                    return true;
                } else {
                    return false;
                };
                break;
            case 'Y':
                if (data > $scope.YpeakThreshold) {
                    return true;
                } else if (data < $scope.YtroughThreshold) {
                    return true;
                } else {
                    return false;
                };
                break;
            case 'Z':
                if (data > $scope.ZpeakThreshold) {
                    return true;
                } else if (data < $scope.ZtroughThreshold) {
                    return true;
                } else {
                    return false;
                };
                break;
            default:
                return false;
                break;
        }
    };

    // Adds peak/trough data to the controller
    $scope.addMagData = function(data, dimension) {
        switch (dimension) {
            case 'X':
                $scope.magX = data;
                break;
            case 'Y':
                $scope.magY = data;
                break;
            case 'Z':
                $scope.magZ = data;
                break;
        }
    };

    // Compiles the XYZ mag data together
    $scope.compileData = function() {
        var compiledMag = $scope.magX.concat($scope.magY, $scope.magZ);
        var cleanedArray = [];
        console.log("Compiled Data", compiledMag);
        compiledMag.forEach(function(element, index, array) {
            var time = Math.floor(parseInt(element[0]));
            var alreadyAdded = false;
            cleanedArray.forEach(function(element, index, array) {
                if (element == time)
                    alreadyAdded = true;
            });
            if (!alreadyAdded)
                cleanedArray.push(time);
        });
        // Sort the array in ascending order
        cleanedArray.sort(function(a, b) {
            return a - b
        });
        console.log("Cleaned array", cleanedArray);
        $scope.times = cleanedArray;
    };

    // Computes the time spent in
    $scope.timeTaken = function(data) {
        $scope.totalTime = Math.round(data[data.length - 1][0]);

        // Cut the time taken into 5 minute blocks
        $scope.timeBlocks = Math.ceil($scope.totalTime / 300);
        console.log($scope.timeBlocks);
    };

    // Configures d3Data for graph rendering
    $scope.configureData = function() {
        var dataArray = $scope.createDataArray();
        console.log("Data", dataArray);
        // Determine which time slots each time fits into
        for (i = 1; i <= $scope.timeBlocks; i++) {
            $scope.times.forEach(function(element, index, array) {
                var timeInMinutes = element / 60;
                if (timeInMinutes < i * 5 && timeInMinutes > (i - 1) * 5) {
                    dataArray[i - 1].count++;
                };
            });
        };
        console.log("Data array", dataArray);
        $scope.d3Data = dataArray;
    };

    $scope.createDataArray = function() {
        var dataArray = [];
        dataArray.length = $scope.timeBlocks;
        for (i = 0; i < dataArray.length; i++) {
            dataArray[i] = {
                time: i * 5,
                count: 0
            };
        }
        return dataArray;
    }
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
                var dataMax = 0;
                data.forEach(function(element, index, array) {
                    if (element[0] > dataMax)
                        dataMax = element[0];
                });
                // remove all previous items before render
                svg.selectAll("*").remove();
                // setup variables
                var width, height, max;
                width = d3.select(iElement[0]).node().offsetWidth - 20;
                // 20 is for margins and can be changed
                height = scope.data.length * 50;
                // 35 = 30(bar height) + 5(margin between bars)
                max = (dataMax > 5) ? dataMax : 5;
                console.log("Max", dataMax, max);
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
                        return d.count / (max / width);
                    }) // width of the bar
                    .attr("fill", "#ffff") // color of each bar
                    .attr("x", 60) // half of the 20 side margin specified above
                    .attr("y", function(d, i) {
                        return i * 50;
                    }); // height + margin between bars

                var texts = svg.selectAll("text")
                    .data(data)
                    .enter();

                texts.append("text")
                    .attr("fill", "#ffff")
                    .attr("y", function(d, i) {
                        return i * 50 + 22;
                    })
                    .attr("x", 15)
                    .text(function(d) {
                        return d.time + "-" + (d.time + 5);
                    });

                texts.append("text")
                    .data(data)
                    .attr("fill", "#fff")
                    .attr("y", function(d, i) {
                        return i * 50 + 22;
                    })
                    .attr("x", 65)
                    .text(function(d) {
                        return d.count;
                    });
            };
        }
    };
}]);
