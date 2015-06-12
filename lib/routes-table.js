// Module: routes-table.js
//
// Provides a route table to view routes
//
// (1) SCOPE VARIABLES, (2) UTILITY METHODS, (3) ROUTE HANDLER METHODS
// (3) MODULE EXPORTS

//--------------- BEGIN MODULE SCOPE VARIABLES ---------------
var
  mu   = require('mu2'),
  path = require('path'),

  _addRouteTable,
  _generateRouteTable,
  _sortRoutes,

  config_map = {};
//---------------- END MODULE SCOPE VARIABLES ----------------

//------------------- BEGIN UTILITY METHODS ------------------
_addRouteTable = function (routes_map, url, prefix, hostname, port) {
  if (typeof routes_map.handlersDefMap['#routes-table#'] !== 'undefined') {
    console.log("Warning: '#routes-table#.js' is a reserved handler file name");
  }
  if (typeof routes_map.routesDefMap['#routes-table#'] !== 'undefined') {
    console.log("Warning: '#routes-table#.js' is a reserved routes file name");
  }

  config_map.routes_map = routes_map;
  config_map.url = url;
  config_map.prefix = prefix;
  config_map.hostname = hostname;
  config_map.port = hostname;


  routes_map.handlersDefMap['#routes-table#'] = {
    _generateRouteTable : _generateRouteTable
  };

  routes_map.routesDefMap['#routes-table#'] = {
    prefix: config_map.prefix,
    routes: [
      [ 'get', config_map.url, [], '#routes-table#._generateRouteTable' ]
    ]
  };
  return routes_map;
};

_sortRoutes = function ( routeA, routeB ) {
  if ( routeA.group < routeB.group ) { return -1; } // sort ascending
  if ( routeA.group > routeB.group ) { return 1; }
  return 0;
};
//-------------------- END UTILITY METHODS -------------------

//--------------- BEGIN ROUTE HANDLER METHODS ----------------
_generateRouteTable = function (req, res) {
  var route_groups = [];

  Object.keys(config_map.routes_map.routesDefMap).forEach(function(group) {
    route_groups.push({
      group: group,
      definition: config_map.routes_map.routesDefMap[group]
    });
  });

  if ((req.headers['Content-Type'] === 'application/json') ||
      (req.headers['Accept'] === 'application/json') ||
      (req.headers['X-Requested-With'] === 'XMLHttpRequest')) {
    return res.json({ routes_map: route_groups });
  }
  else {
    var routes = [];
    route_groups.forEach(function(route_group) {
      var definition = route_group.definition;
      var group_name = route_group.group;
      var prefix = definition.prefix;
      var default_middleware = definition.default_middleware || '';

      route_group.definition.routes.forEach(function(route) {
        var middleware = route[2].join(',');
        if (default_middleware) {
          middleware = default_middleware.concat(route[2] ).join(',');
        }
        var route_path;
        (prefix) ? route_path = prefix + route[1] : route_path = route[1];
        if (prefix === '/') {
          route_path = route[1];
        }
        routes.push({
          app_middleware: 'TODO',
          group: group_name,
          method: route[0],
          path: route_path,
          middleware: middleware,
          handler: route[3]
        });
      });
    });

    mu.root = path.join( __dirname, 'html' );
    var stream = mu.compileAndRender( 'routes-table.html', {
      routes : routes,
      host   : config_map.hostname || 'localhost',
      port   : config_map.port || 3000
    });
    stream.pipe(res);
  }
};
//---------------- END ROUTE HANDLER METHODS -----------------

//------------------- BEGIN MODULE EXPORTS -------------------
module.exports = {
  addRouteTable : _addRouteTable
};
//-------------------- END MODULE EXPORTS --------------------
