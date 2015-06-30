# Routes-Builder

  Node.js module for route auto-creation, per-route middleware, and a development route table viewer.
  Just drop your route definitions, middleware and handlers into a folder and they load on startup.

## Features

  * Easy to define routes and per-route middleware
  * Auto-loading of route definitions, route middleware and route handlers
  * Auto-creation of routes
  * HTML page to view routes and per-route middleware during development
  * Flexible structure where you can use any folder naming and positioning you like
  * Simple command line tool to create new projects
  * Defaults to using Express but you can write your own route loading and building functions
    
## Getting Started
  
    var express = require('express');
    var routes_builder = require('routes_builder');
    var app = routes_builder(express());
    
  If you need to do some more setup once the routes have been created, listen for the 'setup-complete' event:
     
    app.on('setup-complete', function(app) {
      // setup error handlers
    });   
      
  The best way to get started is to install the command line tool.

## Installing the Command Line Tool

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

  You define the routes at the same time as the middleware that will run when the route is requested. 
  Add as many routes in a definition file as you want.
  
  A route table is created so you can easily view the routes during development by browsing to 
  http://localhost:3000/routes-table:

  ![alt tag](https://raw.githubusercontent.com/mjgs/routes-builder/master/lib/html/routes-table.jpg)

  The grouping is useful for feature development, all routes in the same route file will have that 
  as the group name.
  
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
      middleware2: function (req, res, next) {
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
      
## Creating Restful Routes

  Creating restful routes using the command line tool is easy:
  
    $ routes-builder -f -r users
    
    Created Restful Routes:
    
    Routes file: [project_directory]/routes/users.js
    Handlers file: [project_directory]/handlers/users.js
  
## Writing Custom Loader and Builder Functions

  If you look in app.js you'll see the line:
  
    var app = routes_builder(express());
    
  That's where everything gets setup, the route building pipeline happens in 2 steps:
  
  (1) route-loader function runs (_loader in index.js)
  
  (2) route-builder function runs (_builder in index.js)
  
  If you want to create your own then specify them in the options object like so:
  
    var custom_loader = function(options, cb) { 
      // add some route loading code here
      cb(null, map);
    }
    var custom_builder = function(app, map, cb) { 
      // add some route building code here
      cb(null, app);
    }
    var options = { loader: custom_loader, builder: custom_builder } 
    
    var anotherWebServer = require('anotherWebServer');
    var app = routes_builder(anotherWebServer(), options);  

  
  The route-loader function can pass data to the route-builder function, the default routes 
  loader function uses a folder structure and route files to define the routes, but you could 
  create the routes by loading them from a database if you wanted to. The default route builder 
  function creates routes for Express, but you could create your own function to create them 
  for any other web server.
    
  The route-loader function passes it's results as an object called a map to the builder function.
  Have a look at RoutesTable.runRoutesPipeline for the pipeline logic and the default loader and 
  builder utility functions are in index.js.
    
  Of course your builder function might require different data or data in a different structure. 
  Make sure to write your route-loader and route-builder functions to be compatible.  
    
  If you want to create your own route table viewer then that's possible too since the route table 
  route returns json rather than html if you request it in the HTTP header.  
  
## Specifying Different Folder Names
  
  If you want to use different names than the defaults then pass them in as absolute paths in the options:
  
    var options = { 
      dirs: {
        routes: '/projects/testApp/paths', 
        middleware: '/projects/testApp/middlewares', 
        handlers: '/projects/testApp/controllers' 
      }
    } 
    var app = routes_builder(express(), options);
  
## Single File Apps

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

## Summary
  
  Routes-Builder is a good place to start building web applications using Node and Express.
  It does a few key things that will enable you to get up and running
  quickly, it's simple enough that you don't get confused by too many layers,
  and you'll learn techniques and patterns that are useful for Node.js app
  development.
  
## Possible Additions

  * Routes table shows some stats (total routes, total GETs/PUTs/etc)
  * Routes table shows application level middleware
  * Routes table feature to create and edit routes & restful routes
  * Routes table sort by column
  * Re-load of assets without stop/starting app
  * Write some example route loader and route builder functions for other architectures
  * Write some more unit tests
  
## MIT License
Copyright (c)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWAR  