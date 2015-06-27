module.exports = {
  mainPage: function (req, res) {
    console.log('This is the landing-page.mainPage handler');
    res.render('landing-page', { user : req.user });
  }
};