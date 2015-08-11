var express = require('express');
var path = require('path');
// var nunjucks = require('nunjucks')
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var configDB = require('./config/database.js');

mongoose.connect(configDB.url);

require('./config/passport')(passport);

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
/*
nunjucks.configure('views', {
    autoescape: true,
    express: app,
    tags: {
      blockStart: '<%',
      blockEnd: '%>',
      variableStart: '<$',
      variableEnd: '$>',
      commentStart: '<#',
      commentEnd: '#>'
    }
});
*/
// async-each, readdirp are dependencies for nunjucks

// Path for static files
app.use(express.static(path.join(__dirname, 'public')));

app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({ secret: configDB.secret })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

require('./app/routes.js')(app, passport);

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

server.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log("Listening @ %s", port);
});
