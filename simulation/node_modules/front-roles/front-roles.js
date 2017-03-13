'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function (angular, crypto) {

  'use strict';
  // TODO: Need to get resource from server side:
  // - format JSON - TODO: Need to format the data so it ready to use
  // can: {  index: ["ModelName1", "ModelName2", "ModelName3"],    get list of things
  //         create: ["ModelName1", "ModelName2", "ModelName3"],   create new thing
  //         show: ["ModelName1", "ModelName2", "ModelName3"],     get a thing
  //         update: ["ModelName1", "ModelName2", "ModelName3"],   update a thing
  //         destroy: ["ModelName1", "ModelName2", "ModelName3"] } destory a thing

  // - When to get the data from server? (How soon?) (The Performance Impact?) [Handle change of permission because of server data change]
  //      - Option1: before every http call (very accurate)
  //      - Option2: at each reload, with interval that can be set, default every 1 hour (realible) we do this
  // - When to check? (For user permissions)
  //      - We can put it in directive (user can put on what events to check for the permission)
  //      - We can also put it on controller and service via dep injection to get ability checking in code (a service)
  // - Where to get the data for the module?
  //      - In the module provider (set data for how the module works)
  //      - In the service? (need url_to_server and params to get permissions data from server)
  // - How to get the permissions data?
  //      - User provide url and params data form FrontRolesService that injected with FrontRolesResourceService
  //      - There is a FrontRolesService for after_login and after_logout (change of user) [Handle change of permission because of user action]
  //      - User can choose to user the http service or just provide data manualy from service
  //

  //TODO: check dependencies of angular, CryptoJS and localStorage, throw error if one of it not provided!
  // throw new Error("CryptoJS not provided!");

  var module_name = "front-roles";
  var Roles = {};

  // validator
  var is_really_object = function is_really_object(obj) {
    if (obj instanceof Array === false && obj !== null && (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object') {
      return true;
    } else {
      return false;
    }
  };

  var clone_obj = function clone_obj(obj) {
    return JSON.parse(JSON.stringify(obj));
  };

  angular.module(module_name, []);
  Roles = angular.module(module_name);

  Roles.provider('FrontRoles', function () {
    // utilize_fetch - (false) if user want to directly provide permissions data, default is (true)
    // encryption_secret - secret for encryption of permissions and resources

    var default_configs = {
      utilize_fetch: true,
      encryption_secret: 'secret',
      guest_abilities: ['index', 'show']
    };

    var configs = clone_obj(default_configs);
    /**
     * this - set up initial url for later use in the module
     *
     * @param  {String} str description
     * @return {none}       description
     */
    this.init_configs = function () {
      var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

      if (data) {
        configs.utilize_fetch = data.utilize_fetch || default_configs.utilize_fetch;
        configs.encryption_secret = data.encryption_secret || default_configs.encryption_secret;
        configs.guest_abilities = data.guest_abilities || default_configs.guest_abilities;
      }
    };

    this.$get = function () {
      return {
        get_configs: function get_configs() {
          return configs;
        }
      };
    };
  });

  Roles.config(function () {
    // console.info("config");
  });

  /**
   * Our Main go here
   * 1. checking if any resources and permissions store in local storage if any use that instead,
   *    guess mode will be automatically turn off when setting permissions
   */
  Roles.run(['FrontRolesLocalStorageService', 'FrontRolesResourceService', 'FrontRolesPermissionService', function (FrontRolesLocalStorageService, FrontRolesResourceService, FrontRolesPermissionService) {
    var Storage = FrontRolesLocalStorageService;

    var current_resources = Storage.get('front_roles.resources');
    var current_permissions = Storage.get('front_roles.permissions');
    if (current_resources) {
      FrontRolesResourceService.set_resources(current_resources);
    }
    if (current_permissions) {
      FrontRolesPermissionService.set_permissions(current_permissions);
    }
    // console.info("run");
  }]);

  /**
   * FrontRolesResourceService - service to manage resource for set up url to server and it's params,
   * params like current user and outh token can go through here
   *
   * @param  {type} 'PermissionsService' description
   * @return {type}                      description
   */
  Roles.service('FrontRolesResourceService', ['FrontRoles', 'FrontRolesPermissionService', 'FrontRolesLocalStorageService', function (FrontRoles, FrontRolesPermissionService, FrontRolesLocalStorageService) {
    var Storage = FrontRolesLocalStorageService;
    var configs = FrontRoles.get_configs();

    var default_resources = {
      server_url: '',
      current_user: {},
      params: {}
    };
    var resources = clone_obj(default_resources);

    this.set_resources = function (data) {
      //TODO: filter for making sure the server_url is ok (maybe regex will help)
      resources.server_url = data.server_url;
      resources.current_user = data.current_user;
      resources.params = data.params;
      Storage.set('front_roles.resources', resources);
      return resources;
    };

    this.get_resources = function () {
      return resources;
    };

    this.delete_resources = function () {
      resources = clone_obj(default_resources);
      Storage.unset('front_roles.resources');
    };
  }]);

  /**
   * FrontRolesPermissionService - service to manage permissions that applied in the application
   *
   * @param  {type} 'PermissionsService' description
   * @return {type}                      description
   */
  Roles.service('FrontRolesPermissionService', ['$http', 'FrontRoles', 'FrontRolesLocalStorageService', function ($http, FrontRoles, FrontRolesLocalStorageService) {
    var Storage = FrontRolesLocalStorageService;
    var on_guess = true;
    var guest_abilities = FrontRoles.get_configs().guest_abilities;

    this.permissions = {};

    this.to_guess_state = function () {
      on_guess = true;
      this.permissions = {};
      Storage.unset('front_roles.permissions');
    };

    this.set_permissions = function (permissions) {
      //TODO: make sure the permissions data format is right
      this.permissions = permissions;
      Storage.set('front_roles.permissions', permissions);
      on_guess = false;
    };

    this.get_permissions = function () {
      return this.permissions;
    };

    this.fetch_permissions = function (resources) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var command = resources.params || {};

        if (resources.current_user) {
          command.user_id = resources.current_user.id;
          command.username = resources.current_user.username;
          command.user_email = resources.current_user.email;
        }

        $http({
          url: resources.server_url,
          method: "GET",
          params: command
        }).then(function (res) {
          // set resource to permissions
          if (res.status == 200) {
            _this.set_permissions(res.data);
            resolve(res.data);
          } else {
            reject(Error(res.statusText));
          }
        }, function (reason) {
          console.error("FrontRoles: Failed to fetch resources from server, fall back to default guest only privileges [" + guest_abilities.toString() + "]");
          reject(reason);
        });
      });
    };

    this.check_permission = function (ability, resource) {
      var permission_index = -1;
      if (on_guess) {
        permission_index = guest_abilities.indexOf(ability);
      } else {
        var abilities = this.permissions[ability];
        if (abilities) {
          permission_index = abilities.indexOf(resource);
        }
      }
      return permission_index !== -1 ? true : false;
    };
  }]);

  Roles.factory('FrontRolesLocalStorageService', ['FrontRoles', function (FrontRoles) {
    var configs = FrontRoles.get_configs();
    var aes = crypto.AES;
    return {
      get: function get(key) {
        var decrypted_data = undefined;
        var cipher_text = localStorage.getItem(key);
        if (cipher_text) {
          var bytes = aes.decrypt(cipher_text.toString(), configs.encryption_secret);
          decrypted_data = JSON.parse(bytes.toString(crypto.enc.Utf8));
        }
        return decrypted_data;
      },
      set: function set(key, val) {
        var data = val;
        if (is_really_object(data)) {
          data = JSON.stringify(data);
        }
        data = aes.encrypt(data, configs.encryption_secret);
        return localStorage.setItem(key, data);
      },
      unset: function unset(key) {
        return localStorage.removeItem(key);
      }
    };
  }]);

  /**
   * FrontRolesService  - service to manage interaction with user of module
   *                    - provide after_login, after_logout, set_resources, fetch_permissions
   *
   * @param  {type} 'PermissionsService' description
   * @return {type}                      description
   */
  Roles.service('FrontRolesService', ['FrontRoles', 'FrontRolesResourceService', 'FrontRolesPermissionService', function (FrontRoles, FrontRolesResourceService, FrontRolesPermissionService) {
    var configs = FrontRoles.get_configs();
    /**
     * Login -
     *
     * @param  {type} data description
     * @return {type}      description
     */
    this.after_login = function (data) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        if (configs.utilize_fetch) {
          // set resource service and fetch data,
          // set permissions service with data from the server
          var resources = FrontRolesResourceService.set_resources(data);
          FrontRolesPermissionService.fetch_permissions(resources).then(function (permissions) {
            var success_data = {};
            success_data.current_user = _this2.current_user();
            success_data.permissions = permissions;
            resolve(success_data);
          }, function (reason) {
            reject(reason);
          });
        } else {
          //TODO: this is when user want to fill in permissions manualy

        }
      });
    };

    this.after_logout = function (data) {
      FrontRolesResourceService.delete_resources();
      FrontRolesPermissionService.to_guess_state();
    };

    this.current_user = function () {
      return FrontRolesResourceService.get_resources().current_user;
    };

    this.user_can = function (ability, resource) {
      return FrontRolesPermissionService.check_permission(ability, resource);
    };
  }]);

  /**
   * Return the DOM siblings between the first and last node in the given array.
   * @param {Array} array like object
   * @returns {Array} the inputted object or a jqLite collection containing the nodes
   */
  function getBlockNodes(nodes) {
    // TODO(perf): update `nodes` instead of creating a new object?
    var node = nodes[0];
    var endNode = nodes[nodes.length - 1];
    var blockNodes;

    for (var i = 1; node !== endNode && (node = node.nextSibling); i++) {
      if (blockNodes || nodes[i] !== node) {
        if (!blockNodes) {
          blockNodes = jqLite(slice.call(nodes, 0, i));
        }
        blockNodes.push(node);
      }
    }

    return blockNodes || nodes;
  }

  /**
   * Front Role Attributes Directive
   *
   * @param  {type} 'fr-can'  description
   * @param  {type} function( description
   * @return {type}           description
   */
  Roles.directive('frCan', ['$animate', '$compile', 'FrontRolesPermissionService', function ($animate, $compile, FrontRolesPermissionService) {
    var link = function link($scope, $element, $attr, ctrl, $transclude) {
      var block, childScope, previousElements;

      var attr_params = $attr.frCan.split(" ");
      var ability = attr_params[0];
      var resource = attr_params[1];
      var evt = attr_params[2];

      var permissions_watcher = function permissions_watcher() {
        return FrontRolesPermissionService.permissions;
      };

      $scope.$watch(permissions_watcher, function (newVal) {
        var has_permission = FrontRolesPermissionService.check_permission(ability, resource);
        if (has_permission) {
          if (!childScope) {
            $transclude(function (clone, newScope) {
              childScope = newScope;
              clone[clone.length++] = $compile.$$createComment('end Front Roles Can', $attr.frCan);
              // Note: We only need the first/last node of the cloned nodes.
              // However, we need to keep the reference to the jqlite wrapper as it might be changed later
              // by a directive with templateUrl when its template arrives.
              block = {
                clone: clone
              };
              $animate.enter(clone, $element.parent(), $element);
            });
          }
        } else {
          if (previousElements) {
            previousElements.remove();
            previousElements = null;
          }
          if (childScope) {
            childScope.$destroy();
            childScope = null;
          }
          if (block) {
            previousElements = getBlockNodes(block.clone);
            $animate.leave(previousElements).done(function (response) {
              if (response !== false) previousElements = null;
            });
            block = null;
          }
        }
      });

      // let clickAction = $attr.ngClick;
      // $element.bind('click', (e)=>{
      //   let has_permission = FrontRolesPermissionService.check_permission(ability, resource);
      //   if (has_permission){
      //     $scope.$eval(clickAction)
      //   }
      // });
    };

    // multiElement: true,
    // transclude: 'element',
    // priority: 600,
    // terminal: true,
    // restrict: 'A',
    // $$tlb: true,

    return {
      priority: 1,
      terminal: true,
      transclude: 'element',
      restrict: 'A',
      link: link
    };
  }]);
})(angular, CryptoJS);