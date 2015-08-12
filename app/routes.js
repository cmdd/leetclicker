module.exports = function(app, passport) {
  app.get('/', function (req, res) {
    /*
    If you want local variables, do it like this:
    res.locals.token = '1234';
    */
    var error = req.query.error;

    if (req.user) {
      var username = req.user.local.username;
    } else {
      var username = false;
    }

    res.render("index.ejs", {error: error, username: username});
  });

  app.get('/login', function(req, res) {
    // render the page and pass in any flash data if it exists
    if (req.user) {
      var string = encodeURIComponent("login_exist");
      res.redirect('/?error=' + string);
    }
    res.render('login.ejs', { message: req.flash('loginMessage') });
  });

  app.post('/login', passport.authenticate('local-login', {
    successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  }));

  app.get('/signup', function(req, res) {
    // render the page and pass in any flash data if it exists
    if (req.user) {
      var string = encodeURIComponent("login_exist");
      res.redirect('/?error=' + string);
    }
    res.render('signup.ejs', { message: req.flash('signupMessage') });
  });

  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/signup', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  }));

  /*
  app.get('/profile', isLoggedIn, function(req, res) {
    res.render('profile.ejs', {
      user : req.user // get the user out of session and pass to template
    });
  });
  */

  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });
};

function isLoggedIn(req, res, next) {

    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
