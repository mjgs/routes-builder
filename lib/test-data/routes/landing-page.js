module.exports = {

  prefix: '/some/path/on/the/site',

  default_middleware: [ 'middleware.middleware1', 'middleware.middleware2' ],

  routes: [
    [ 'get' , '/landing-page',   [ 'middleware.middleware3', 'middleware.middleware4' ],  'landing-page.mainPage' ]
  ]

};