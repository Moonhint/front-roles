'use strict';

(() => {

  const module_name = "front-roles-simulation";

  let RSimulation = angular.module(module_name, [
    'front-roles'
  ]);

  RSimulation.config((FrontRolesProvider)=>{
    //TODO: we can get url set from here
    console.info("simulation config");
    FrontRolesProvider.init_configs({
      encryption_secret: 'mysecret'
    });
  });

  /**
   * Our Main go here
   */
  RSimulation.run(()=>{
    //TODO: we can run first http call from here
    console.info("simulation run");
  });

  RSimulation.controller('RSimulationCtrl', ['$scope', 'FrontRolesService', function($scope, FrontRolesService){

    $scope.simulate_login = function (){
      FrontRolesService.after_login({
        server_url: 'http://localhost:3000/bold/v1/user_groups/get_permissions',
        current_user: {
          id: '4fac049959aa92040e00040c',
          username: 'antoni',
          name: 'Antoni',
          email: 'email.to.antoni@gmail.com',
          user_group: {
            id: '1234',
            name: 'Administrator'
          }
        },
        params: {
          other_att: 'other_att',
          other_att2: 'other_att2'
        }
      }).then((permissions)=>{
        console.info(permissions);
      },(reason)=>{
        console.error(reason);
      });
    }

    console.info(FrontRolesService.user_can('show', 'Agreement'));

    $scope.simulate_logout = function(){
      FrontRolesService.after_logout();
    }

    $scope.button_click = function(){
      console.info("do button click");
    }

    $scope.sec_button_click = function(){
      console.info("do sec button click");
    }

  }]);

})();
