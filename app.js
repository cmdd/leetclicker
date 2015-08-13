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
var User            = require('./app/models/user');

require('./config/passport')(passport);

// TODO: FORM VALIDATION!!
// TODO: Redis "database" for currently logged in users/ddos, etc

// Path for static files
app.use(express.static(path.join(__dirname, 'public')));

app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs'); // set up ejs for templating
app.set('views', path.join(__dirname, 'views'));

// required for passport
var sessionMiddleware = session({ secret: configDB.secret, saveUninitialized: true, resave: true });

app.use(sessionMiddleware); // session secret
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
    console.log(err);
  });
}

function isEmpty(obj) {
  for(var prop in obj) {
    if(obj.hasOwnProperty(prop))
      return false;
  }
  return true;
}

var getKeys = function(obj){
   var keys = [];
   for(var key in obj){
      keys.push(key);
   }
   return keys;
}

// socket.io stuff
io.use(function(socket, next) {
  sessionMiddleware(socket.request, {}, next);
});

io.on('connection', function(socket) {
  if (isEmpty(socket.request.session.passport)) {
    io.to(socket.id).emit('auth-check', {'auth': 'no-auth', 'saveData': false});
  } else {
    /* Example purposes only
    console.log(socket.request.session.passport.user);
    User.findOne({"_id": socket.request.session.passport.user}, function(err, person) {
      console.log(person);
    });
    */
    User.findById(socket.request.session.passport.user, function (err, user) {
      if (err) console.log(err);

      if (user.upgrades.length === 0 && user.buildings.length === 0) {
        io.to(socket.id).emit('auth-check', {'auth': 'yes-auth', 'saveData': false});
      } else {
        io.to(socket.id).emit('auth-check', {'auth': 'yes-auth', 'saveData': true});
      }

    });

    // Listen for anything here
    socket.on('save game', function(data) {
      User.findById(socket.request.session.passport.user, function (err, user) {
        if (err) console.log(err);

        user.stats.bytes = data.stats.bytes;
        user.stats.bytesTotal = data.stats.bytesTotal;
        user.buildings = data.buildings;
        user.upgrades = data.upgrades;

        user.save(function (err) {
          if (err) console.log(err);
        });
      });
    });

    socket.on('load game', function() {
      User.findById(socket.request.session.passport.user, function (err, user) {
        if (err) console.log(err);

        var buildingData = user.buildings;
        var upgradeData = user.upgrades;
        var statsData = user.stats;

        io.to(socket.id).emit('load data', {'buildings': buildingData, 'upgrades': upgradeData, 'stats': statsData});
      });
    });

    socket.on('wipe save', function() {
      User.findById(socket.request.session.passport.user, function (err, user) {
        if (err) console.log(err);

        user.stats.bytes = 0;
        user.stats.bytesTotal = 0;
        user.buildings = [];
        user.upgrades = [];

        user.save(function (err) {
          if (err) console.log(err);
        });
      });
    })
  }
});

server.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log("Listening @ %s", port);
});
