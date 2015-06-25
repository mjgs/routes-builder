# Routes-Builder

  Node.js module for route auto-creation, per-route middleware, and a development route table viewer. 
  Route-Builder automatically sets up routes, middleware and handlers that you simply drop in.

## Features

  * Easy to define routes and per-route middleware
  * Auto-loading of route definitions, route middleware and route handlers
  * Auto-creation of routes
  * HTML page to view routes and per-route middleware during development
  * Flexible structure where you can use any folder naming and positioning you like
  * Simple command line tool to create new projects
  * Defaults to using Express but you can write your own route definition and build functions
    
## Getting started
  
    var express = require('express');
    var routes-builder = require('routes_builder');
    var app = routes_builder(express());
    
  If you need to do some more setup once the routes have been created, listen for the 'setup-complete' event:
     
    app.routes_builder.on('setup-complete', function(app) {
      // setup error handlers
    });   
      
  The best way to get started is to install the command line tool.

## Installing the command line tool

  To install routes-builder globally use npm:

    npm install -g routes-builder

  Then create a new project:

    $ routes-builder -p myNewProject

    Created new project:

    myNewProject
    |
    |-app.js       - file that contains the main application
    |-bin          - folder that contains the runnable www file
    |-handlers     - folder for route handler functions
    |-lib          - folder for other functionality modules you create
    |-middleware   - folder for per route middleware functions
    |-package.json - file containing npm package information about your project
    |-public       - folder for css, javascript, images and other front end stuff
    |-routes       - folder for route definitions
    |-test         - folder for unit tests
    --views        - folder for views

    Next steps:
      $ cd myNewProject && npm install (install dependencies)
      $ export NODE_ENV=development DEBUG=routes-builder:* (export environment variables)
      $ npm start (or if you prefer node app.js)
               
## Overview

     --------------------------------------------------------------------------
    |     routes   |            middlewares             |      handlers        |
     --------------------------------------------------------------------------
    |       /     -->  middleware1 --> middleware2 ... -->  homepage.mainPage  |
     --------------------------------------------------------------------------

  The general idea is that you define the routes separate from the code that handles the route request. 
  
  Route definition files are simple javascript objects:
    
    module.exports = {
      prefix: '/some/path/on/the/site',
      default_middleware: [ 'middleware.middleware1', 'middleware.middleware2' ],
      routes: [
        [ 'get' , '/landing-page',   [ 'middleware.middleware3', 'middleware.middleware4' ],  'landing-page.mainPage' ]
        ...
      ]
    };

  You define the routes at the same time as the middleware that will run when the route is requested. Add as many routes
  in a definition file as you want.
  
  A route table is created so you can easily view the routes during development by browsing to http://localhost/route-table:

  ![alt tag](https://raw.githubusercontent.com/mjgs/routes-builder/master/lib/routes-table.jpg)

  The grouping is useful for feature development, all routes in the same route file will have that as the group name.
  
  You define your handler functions in the usual way, homepage.js handler looks like this:

    module.exports = {
      mainPage: function (req, res) {
        console.log('This is the homepage.mainPage handler');
        res.render('homepage', { user : req.user });
      }
    };
    
  You can have as many handler functions in a file as you want.

  Middleware are defined as regular javascript objects, you can have several in
  one file and/or have many files, middleware.js looks like this:

    module.exports = {
      middleware1: function (req, res, next) {
        console.log("This is middleware1");
        next();
      },
      middleware2: function ( req, res, next ) {
        console.log("This is middleware2");
        next();
      },
      middleware3: function (req, res, next) {
        console.log("This is middleware3");
        next();
      },
      middleware4: function (req, res, next) {
        console.log("This is middleware4");
        next();
      }
    };  
    
  Remember to always put your next() in the right place, if you find your handlers are 
  getting run several times that's probably the reason.
      
## Creating Restful routes with command line tool

  Let's say you wanted to create some resful routes for users, then just run the command line 
  tool and copy and paste the output into a routes file and a handler file:
  
    $ routes-builder -f -u users
      
    [proj_dir]/routes/users.js:
    module.exports = {
      prefix: '/users',
      default_middleware: [ ],
      routes: [
        [ 'get'    , ''                 , [ ] , 'users.index'   ],
        [ 'get'    , '.format'          , [ ] , 'users.index'   ],
        [ 'get'    , '/new'             , [ ] , 'users.new'     ],
        [ 'get'    , '/new.format'      , [ ] , 'users.new'     ],
        [ 'post'   , ''                 , [ ] , 'users.create'  ],
        [ 'post'   , '.format'          , [ ] , 'users.create'  ],
        [ 'get'    , '/:id'             , [ ] , 'users.show'    ],
        [ 'get'    , '/:id.format'      , [ ] , 'users.show'    ],
        [ 'get'    , '/:id/edit'        , [ ] , 'users.edit'    ],
        [ 'get'    , '/:id/edit.format' , [ ] , 'users.edit'    ],
        [ 'post'   , '/:id'             , [ ] , 'users.update'  ],
        [ 'post'   , '/:id.format'      , [ ] , 'users.update'  ],
        [ 'delete' , '/:id'             , [ ] , 'users.destroy' ],
        [ 'delete' , '/:id.format'      , [ ] , 'users.destroy' ]
      ]
    };
    
    [proj_dir]/handlers/users.js:
    module.exports = {
      'index': function ( req, res ) { res.send( 'This is the users.index handler' ); },
      'new': function ( req, res ) { res.send( 'This is the users.new handler' ); },
      'create': function ( req, res ) { res.send( 'This is the users.create handler' ); },
      'show': function ( req, res ) { res.send( 'This is the users.show handler' ); },
      'edit': function ( req, res ) { res.send( 'This is the users.edit handler' ); },
      'update': function ( req, res ) { res.send( 'This is the users.update handler' ); },
      'destroy': function ( req, res ) { res.send( 'This is the users.destroy handler' ); }
    };
  
## Writing your own route definition and route build functions

  If you look in app.js you'll see the line:
  
    var app = routes_builder(express());
    
  That's where everything gets setup, and it happens in two steps:
  
  (1) route-definition function runs  (./lib/route-definitions)
  
  (2) route-build function runs       (./lib/route-builds)
  
  If you want to create your own then add them to the above folders and specify them as options 
  without the .js in the filename like so:
  
    var anotherWebServer = require('anotherWebServer');
    var options = { route_definition: 'myFancyRoutes.definition', route_build: 'myDeploymentServer.build' } 
    var app = routes_builder(anotherWebServer(), options);  

  
  The route-definition function can pass data to the route-build function, the default routes 
  definition function uses a folder structure and route files to define the routes, but you could 
  create the routes by loading them from a database if you wanted to. The default route build 
  function creates routes for Express, but you could create your own function to create them 
  for any other web server.
  
  If you want the development route table viewer then add these lines to the definition function:
  
    if (process.env.NODE_ENV === 'development') {
      routes_map = routes_table.addRouteTable(routes_map, '/', '/routes-table');
    }
    
  Then pass the route_map to your build function, of course your build function might require 
  different data or data in a different structure. Make sure to write your definition and build 
  functions to be compatible.
    
  If you want to create your own route table viewer then that's possible too since the route table 
  route returns json rather than html if you request it in the HTTP header.
  
  Routes-Builder is a good place to start building web applications using Node and Express.
  It does a few key things that will enable you to get up and running
  quickly, it's simple enough that you don't get confused by too many layers,
  and you'll learn techniques and patterns that are useful for Node.js app
  development.  
  
## Specifying different folder names
  
  If you want to use different names than the defaults then pass them in the options:
  
    var options = { routes: 'paths', middleware: 'middlewares', handlers: 'controllers' } 
    var app = routes_builder(express(), options);
  
## Single file apps

  For small apps it's convenient to be able to have all the pieces of the app in the same app.js file
  rather than spread out in different folders. You can specify any/all of the routes, middleware
  and handlers in a javascript object and pass that in the options object like so:
  
    var options = {
      routes: {
        'landing-pages': {
          prefix: '/landing-pages',
          default_middleware: [ 'middleware.middleware1', 'middleware.middleware2' ],
          routes: [
            [ 'get' , '/first-page',   [ 'middleware.middleware3', 'middleware.middleware4' ],  'handlers.first_handler'  ],
            [ 'get' , '/second-page',  [ 'middleware.middleware3', 'middleware.middleware4' ],  'handlers.second_handler' ]
          ]
        }
      },
      middleware: {
        'middleware': {
          middleware1: function (req, res, next) { console.log("This is middleware1"); next(); },
          middleware2: function (req, res, next) { console.log("This is middleware2"); next(); },
          middleware3: function (req, res, next) { console.log("This is middleware3"); next(); },
          middleware4: function (req, res, next) { console.log("This is middleware4"); next(); }
        }
      },
      handlers: {
        'handlers': {
          first_handler: function (req, res) { console.log('This is the first-page handler'); return res.send('This is the first-page handler'); },
          second_handler: function (req, res) { console.log('This is the second-page handler'); return res.send('This is the second-page handler'); }
        }
      }
    };
    
    var app = routes_builder(express(), options);  


## Possible additions

  * Route table shows some stats (total routes, total GETs/PUTs/etc)
  * Route table shows application level middleware
  * Sort route table by column
  * Re-load of assets without stop/starting app
  * Write some example definition and build functions for other architectures
  * Write some unit tests                                                                                         