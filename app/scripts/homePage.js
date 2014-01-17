angular.module('app.homePage', [])

  .factory('InternetUsageDataLoader', function($q, $http) {
    var deferred = $q.defer();
    $http.get('assets/world-internet-usage.json').success(function(json) {
      deferred.resolve(json.Root.data.record);
    });
    return deferred.promise;
  })

  .factory('InternetUsageData', function($q, InternetUsageDataLoader) {

    function get() {
      var deferred = $q.defer();
      InternetUsageDataLoader.then(function(data) {
        deferred.resolve(parse(data));
      },function(error) {
        deferred.reject(error);
      });
      return deferred.promise;
    }
    

    function parse(data) {

      var newData = {
        countries:{}
      };

      angular.forEach(data, function(value) {
        var year = value.field[2]['#text'],
            country = value.field[0]['#text'],
            usage = (value.field[3]['#text']) ? value.field[3]['#text'] / 100 : 0;

        if (!newData.countries[country]) {
          newData.countries[country] = [];
        }
        newData.countries[country][year] = usage;
      });
      return newData;
    }

    return {
      get: get
    };
  })

  .directive('svg', function() {
    return {
      restrict: 'E',
      link: function() {

        var label = d3.select('.info text');

        function mouseover() {

          var obj = d3.select(this),
              id = obj.attr('id');

          function getLabel() {
            var percentage = Math.round(obj.style('fill-opacity') * 100);
            var country = toTitleCase(id.replace(/_/g,' '));
            return (percentage < 100) ? country + ' ' + percentage + '%' : country + ' 0%';
          }

          d3.selectAll('#' + id)
            .style('stroke', 'yellow')
            .style('stroke-width', '2');

          label.text(getLabel)
               .style('font-size', '24px');
        }

        function mouseout() {
          var id = d3.select(this).attr('id');

          d3.selectAll('#' + id)
            .style('stroke', '#666666')
            .style('stroke-width', '1');

          label.text('');
        }

        // make the background map layer white
        // so the opacity has a consistent backdrop
        d3.selectAll('.map-bg path')
          .style('fill', '#ffffff')
          .style('stroke', '#ffffff')
          .style('stroke-width', '1');

        // set a stroke to outline the countries
        // and attach the mouseevents to the top map layer
        d3.selectAll('.map path')
          .style('fill', '#ffffff')
          .style('stroke', '#666666')
          .style('stroke-width', '1')
          .on('mouseover', mouseover)
          .on('mouseout', mouseout);

        function toTitleCase(str) {
          if (str.length === 3) {
            return angular.uppercase(str);
          }
          return str.replace(/\w\S*/g, function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
          });
        }
      }
    };
  })

  .directive('axis', function() {
    return {
      restrict: 'E',
      link: function() {
        // create a scale to map the year values to pixels
        var axisScale = d3.scale.linear()
                          .domain([1988, 2012])
                          .range([10, 930]);

        // remove commas from years (i.e. 2,012 -> 2012)
        var yearFormat = d3.format('Y');

        // create our axis with our year format and scale
        var xAxis = d3.svg
                      .axis()
                      .scale(axisScale)
                      .orient('bottom')
                      .ticks(12)
                      .tickFormat(yearFormat);

        d3.select('svg')
          .append('g')
          .attr('class', 'axis')
          .call(xAxis)
          .attr("transform", "translate(0,1)");
      }
    };
  })

  .directive('key', function(MAP_COLOR) {
    return {
      restrict: 'E',
      link: function() {

        // we show every 20% on our key, hence the data scale below...
        var keyData = [0, 2, 4, 6, 8, 10];

        // key background layer
        // for white background under opacity
        d3.select('svg')
          .append('g')
          .attr('class', 'key-bg')
          .selectAll('rect')
          .data(keyData)
          .enter()
          .append('rect')
          .attr('width', '40px')
          .attr('height', '40px')
          .attr('x', '890px')
          .attr('y', function(d) {
            return (d * -20) + 250;
          })
          .style('fill', 'white');

        // the actual key
        // rectanges of the key with opacity
        d3.select('svg')
          .append('g')
          .attr('class', 'key')
          .selectAll('rect')
          .data(keyData)
          .enter()
          .append('rect')
          .attr('width', '40px')
          .attr('height', '40px')
          .style('stroke', 'black')
          .style('fill', MAP_COLOR)
          .style('fill-opacity', function(d) {
            return d / 10;
          })
          .attr('x', '890px')
          .attr('y', function(d) {
            return (d * -20) + 250;
          });

        // the percentage text labels on the key
        d3.select('.key')
          .selectAll('text')
          .data(keyData)
          .enter()
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('font-size', '11px')
          .attr('x', '910px')
          .attr('y', function(d) {
            return (d * -20) + 275;
          })
          .text(function(d) {
            return (d * 10) + '%';
          });
      }
    };
  })

  .directive('activeCountry', function() {
    return {
      restrict: 'E',
      link: function() {
        d3.select('svg')
          .append('g')
          .attr('class', 'info')
          .append('text')
          .attr('x', 5)
          .attr('y', 572);
      }
    };
  })

  .controller('HomeCtrl', function($scope, $timeout, InternetUsageData, MAP_COLOR) {

    $scope.data = {};
    $scope.currentYear = 2012;
    $scope.paused = true;

    InternetUsageData.get().then(function(data) {
      $scope.data = data;
      $scope.draw($scope.data, $scope.currentYear);
    });

    $scope.draw = function(data, year) {
      var paths = d3.selectAll('.map path'), elem;
      angular.forEach(data.countries, function (value, key) {
        paths.each(function () {
          elem = d3.select(this);
          if (angular.lowercase(key).replace(/ /g,'_') === elem.attr('id')) {
            elem.transition().style('fill', MAP_COLOR).style('fill-opacity', value[year]);
          }
        });
      });
    };

    $scope.play = function() {
      if ($scope.paused) {
        $scope.resetTimelapse();
        $scope.paused = false;
        $scope.startTimelapse();
      } else {
        $scope.paused = true;
      }
    };

    $scope.resetTimelapse = function() {
      if (Number($scope.currentYear) === 2012) {
        $scope.currentYear = 1988;
        $scope.draw($scope.data, $scope.currentYear);
      }
    };

    $scope.startTimelapse = function() {
      if (!$scope.paused && $scope.currentYear < 2012) {
        $scope.incrementYear();
      }
    };

    $scope.incrementYear = function() {
      $timeout(function(){
        $scope.currentYear++;
        $scope.draw($scope.data, $scope.currentYear);
        $scope.startTimelapse();
      }, 750);
    };

    $scope.$watch('currentYear', function(newVal) {
      if (newVal) {
        $scope.currentYear = newVal;
        $scope.draw($scope.data, newVal);
        if (Number(newVal) === 2012) {
          $scope.paused = true;
        }
      }
    });
  });
