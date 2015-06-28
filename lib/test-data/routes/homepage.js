module.exports = {

  default_middleware: [ 'middleware.middleware1', 'middleware.middleware2' ],

  routes: [
    [ 'get' , '/',   [ 'middleware.middleware3', 'middleware.middleware4' ],  'homepage.mainPage' ]
  ]

};