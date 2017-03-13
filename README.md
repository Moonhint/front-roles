# front-roles
Simple user permission manager that fetch data from your server side (Only for Angular)

## Dependencies
by npm:

`<script src="./node_modules/angular/angular.min.js"></script>`

`<script src="./node_modules/crypto-js/crypto-js.js"></script>`

by bower:

`<script src="./bower_components/angular/angular.min.js"></script>`

`<script src="./bower_components/crypto-js/crypto-js.js"></script>`

## How To Setup
on your index.html:

`<script src="./node_modules/front-roles/front-roles.js"></script>`

or

`<script src="./bower_components/front-roles/front-roles.js"></script>`


on index.js

`const module_name = "front-roles-simulation";`

`let RSimulation = angular.module(module_name, ['front-roles']);`

optional:

```
RSimulation.config((FrontRolesProvider)=>{
  FrontRolesProvider.init_configs({
    utilize_fetch: true,
    encryption_secret: 'mysecret',
    guest_abilities: ['index', 'show']
    ...
  });
});
```

### FrontRoles Provider Params:
  - `utilize_fetch: Boolean` (default to true)

    This params is for specify if user want to use front-roles to automatically
    fetch permission from the server side or not. `server_url` and `needed params` are
    must specified in `after_login` if you choose to utilize it.

  - `encryption_secret: String` (default to 'secret')

    This params is a `secret` for encryption of permissions and resources that saved in localStorage,
    front-roles will use AES encryption methods.

  - `guest_abilities: Array of String` (default to ['index', 'show'])

    Default state of the permissions will be guest if `after_login` has not been called or will
    again fall-back to guest if front-roles fail to fetch the permissions from the server.
    guest can do all `index` and `show`, you can still override it as you see fit.

## How To Use
  - As Directive:

    `<any fr-can="[ability] [resource]"></any>`

    - ability: `index`, `show`, `create`, `update`, `destroy`

    - resource: any model name in from the server side

    This directive is a modification of `ng-if` angular directive, instead of watching the value of `ng-if attr`,
    `fr-can` watch the change in permissions, and will not render the element if ability and resource
    not match the permissions.


    As Service means that you have to inject `FrontRolesService` when you want to use it.

  - `As Service: to get your current user`,

    current user will be store in localStorage and encrypted with AES you can get it with,

    `let current_user = FrontRolesService.current_user();`, will return object of current user.

  - `As Service: to dynamically check permission`,

    `let has_ability = FrontRolesService.user_can('show', 'Agreement');`, will return boolean value.


## Permissions Management with after_login and after_logout
  - Inject `FrontRolesService` into sign-in/login controller and call `after_login`,
    you need to provide:
    1. `server_url`: This is a url for getting the permissions, check how to make API for
        permissions generation from server side.
    2. `current_user`: if you specified it `id`, `username` and `email` it will be automatically
        injected as your params to every call for fetching permissions. And this user is also the
        return of the `current_user` method of the `FrontRolesService`.
        - `id` will be injected as `user_id` in the params
        - `username` injected as `username` in the params
        - `email` injected as `user_email` in the params
    3. `params`: others params that you needed to fetch from the server.

    ```
    FrontRolesService.after_login({
      server_url: 'http://your-server/user_groups/get_permissions',
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
    }).then((user_and_permissions)=>{
      console.info(user_and_permissions);
    },(reason)=>{
      console.error(reason);
    });
    ```

    `after_login` will return a promise and if resolved will return `permissions` and `current_user` object.

  - Also inject `FrontRolesService` into sign-out/logout controller and call `after_logout`:
    `FrontRolesService.after_logout();` will destroy any record of `resources` and `permissions` on the localStorage.


### Format of Permissions JSON
  permissions = { index: ["ModelName1", "ModelName2", "ModelName3"],    get list of things
                  create: ["ModelName1", "ModelName2", "ModelName3"],   create new thing
                  show: ["ModelName1", "ModelName2", "ModelName3"],     get a thing
                  update: ["ModelName1", "ModelName2", "ModelName3"],   update a thing
                  destroy: ["ModelName1", "ModelName2", "ModelName3"] } destory a thing

## Generate Permissions From Server Side
  - If you are user of ruby on rails you can use 'can can' or 'can can can'
    (the community version) to easily generate permission for you.
    You will be told to create an 'Ability' service that extend CanCan::Ability and then you can use it in
    your rails view and controller (usual way to use it), but since we want to extract it for API call,
    we can coerce it to JSON by

    `permissions = Ability.new(User.find(params[:user_id])).permissions.as_json`.

    for complete how to use 'can can' check out the cool repo of it https://github.com/ryanb/cancan

  - Or you can just make it the manually by any other server side script and framework that you like.  
