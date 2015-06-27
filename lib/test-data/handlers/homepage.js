module.exports = {
  mainPage: function (req, res) {
    console.log('This is the homepage.mainPage handler');
    res.render('homepage', { user : req.user });
  }
};