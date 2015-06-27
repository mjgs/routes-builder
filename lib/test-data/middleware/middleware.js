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
