var express = require('express');
var path = require('path');
// var nunjucks = require('nunjucks')
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

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

app.get('/', function (req, res) {
  res.render("index.html");
});

server.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log("Listening @ %s", port);
});
