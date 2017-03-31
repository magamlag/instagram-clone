
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
// Body parsing middleware
var bodyParser = require('body-parser');
var instagram = require('./intagram');
var app = express();

//Set path to view
app.set('views', path.join(__dirname, 'views'));
//
app.set('view engine', 'jade');
// BodyParser returns middleware that only parses 'urlencoded' bodies
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use('/', instagram);

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function() {
	console.log('Listening on port ' + server.address().port);
});

module.exports = app;