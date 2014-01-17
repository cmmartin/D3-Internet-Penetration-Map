angular.module('myApp', ['ngRoute', 'app.homePage'])

  .constant('TPL_PATH', '/templates')

  .constant('MAP_COLOR', 'red')

  .config(function($routeProvider, TPL_PATH) {
    $routeProvider.when('/',{
      controller : 'HomeCtrl',
      templateUrl : TPL_PATH + '/home.html'
    });
  });
