describe('Home Pages', function() {

  beforeEach(module('app.homePage'));

  it('should test the homePages controller', inject(function($controller, $rootScope) {
    var ctrl = $controller('HomeCtrl', {
      $scope : $rootScope
    });
    expect($rootScope.welcome_message.length).toBeGreaterThan(0);
  }));

  it('should properly provide a welcome message', inject(function(welcomeMessage) {
    expect(welcomeMessage()).toMatch('Angular is working!');
  }));

});
