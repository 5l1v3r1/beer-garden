import _ from 'lodash';
import {camelCaseKeys, responseState} from './services/utility_service.js';

import loginTemplate from '../templates/login.html';

appRun.$inject = [
  '$rootScope',
  '$state',
  '$stateParams',
  '$http',
  '$q',
  '$uibModal',
  '$transitions',
  '$interval',
  'localStorageService',
  'UtilityService',
  'SystemService',
  'UserService',
  'TokenService',
  'RoleService',
  'EventService',
];

/**
 * appRun - Runs the front-end application.
 * @param  {Object} $rootScope           Angular's $rootScope object.
 * @param  {Object} $state               Angular's $state object.
 * @param  {Object} $stateParams         Angular's $stateParams object.
 * @param  {Object} $http                Angular's $http object.
 * @param  {Object} $q                   Angular's $q object.
 * @param  {Object} $uibModal            Angular UI's $uibModal object.
 * @param  {Object} $transitions         Angular's $transitions object.
 * @param  {Object} $interval            Angular's $interval object.
 * @param  {Object} localStorageService  Storage service
 * @param  {Object} UtilityService       Service for configuration/icons.
 * @param  {Object} SystemService        Service for System information.
 * @param  {Object} UserService          Service for User information.
 * @param  {Object} TokenService         Service for Token information.
 * @param  {Object} RoleService          Service for Role information.
 * @param  {Object} EventService         Service for Event information.
 */
export default function appRun(
    $rootScope,
    $state,
    $stateParams,
    $http,
    $q,
    $uibModal,
    $transitions,
    $interval,
    localStorageService,
    UtilityService,
    SystemService,
    UserService,
    TokenService,
    RoleService,
    EventService) {
  $rootScope.$state = $state;
  $rootScope.$stateParams = $stateParams;

  let loginModal;
  $rootScope.loginInfo = {};

  // Change this to point to the Brew-View backend if it's at another location
  $rootScope.apiBaseUrl = '';

  $rootScope.config = {};

  $rootScope.themes = {
    'default': false,
    'slate': false,
  };

  $rootScope.responseState = responseState;

  $rootScope.getIcon = UtilityService.getIcon;

  $rootScope.loadUser = function(token) {
    $rootScope.userPromise = UserService.loadUser(token).then(
      (response) => {
        // Angular doesn't do a deep watch here, so make sure we calculate
        // and set the permissions before setting $rootScope.user
        let user = response.data;

        // coalescePermissions [0] is roles, [1] is permissions
        user.permissions = RoleService.coalescePermissions(user.roles)[1];

        let theme = _.get(user, 'preferences.theme', 'default');
        $rootScope.changeTheme(theme);

        $rootScope.user = user;
      }, (response) => {
        return $q.reject(response);
      }
    );
    return $rootScope.userPromise;
  };

  $rootScope.changeUser = function(token) {
    // // We need to reload systems as those permisisons could have changed
    // SystemService.loadSystems();

    $rootScope.loadUser(token).then(
      () => {
        $state.reload();
        // $rootScope.$broadcast('userChange');
      }
    );
  };

  $rootScope.initialLoad = function() {
    // Very first thing is to load up a token if one exists
    let token = localStorageService.get('token');
    if (token) {
      TokenService.handleToken(token);
    }

    // Connect to the event socket
    EventService.connect(token);

    $rootScope.loadUser(token).catch(
      // This prevents the situation where the user needs to logout but the
      // logout button isn't displayed because there's no user loaded
      // (happens if the server secret changes)
      (response) => {
        $rootScope.doLogout();
      }
    );
  };

  $rootScope.hasPermission = function(user, permissions) {
    if (!$rootScope.config.authEnabled) return true;
    if (_.isUndefined(user)) return false;
    if (_.includes(user.permissions, 'bg-all')) return true;

    // This makes it possible to pass an array or a single string
    return _.intersection(
      user.permissions, _.castArray(permissions)
    ).length;
  };

  $rootScope.changeTheme = function(theme, sendUpdate) {
    localStorageService.set('currentTheme', theme);
    for (const key of Object.keys($rootScope.themes)) {
      $rootScope.themes[key] = (key == theme);
    };

    if ($rootScope.isUser($rootScope.user) && sendUpdate) {
      UserService.setTheme($rootScope.user.id, theme);
    }
  };

  $rootScope.isUser = function(user) {
    return user && user.username !== 'anonymous';
  };

  $rootScope.doLogin = function() {
    if (!loginModal) {
      loginModal = $uibModal.open({
        controller: 'LoginController',
        size: 'sm',
        template: loginTemplate,
      });
      loginModal.result.then(
        () => {
          $rootScope.changeUser(TokenService.getToken());
        },
        _.noop // Prevents annoying console log messages
      );
      loginModal.closed.then(
        () => {
          loginModal = undefined;
        }
      );
    }
    return loginModal;
  };

  $rootScope.doLogout = function() {
    TokenService.clearToken();
    TokenService.clearRefresh();

    $rootScope.changeUser(undefined);
  };

  $rootScope.setWindowTitle = function(...titleParts) {
    titleParts.push($rootScope.config.applicationName);
    $rootScope.title = _.join(titleParts, ' - ');
  };

  $transitions.onSuccess({to: 'base'}, () => {
    $state.go('base.landing');
  });

  EventService.addCallback('global_systems', (event) => {
    if (['SYSTEM_CREATED', 'SYSTEM_REMOVED', 'SYSTEM_UPDATED'].includes(event.name)) {

      let existingSystem = SystemService.findSystemByID(event.payload.id);

      switch (event.name) {
        case 'SYSTEM_CREATED':
          if (!existingSystem) {
            $rootScope.systems.push(event.payload);
          }
          break;
        case 'SYSTEM_REMOVED':
          if (existingSystem) {
            _.pull($rootScope.systems, existingSystem);
          }
          break;
        case 'SYSTEM_UPDATED':
          if (existingSystem) {
            _.pull($rootScope.systems, existingSystem);
            $rootScope.systems.push(event.payload);
          }
          break;
      }
    }
  });

  $interval(function() {
    EventService.connect(TokenService.getToken());
  }, 5000);

  $rootScope.initialLoad();
};
