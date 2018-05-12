var express  = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var logger   = require('express-logger');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session  = require('express-session');
var exphbs       = require('express-handlebars');

var app      = express();
var port     = process.env.PORT || 3000;
var configDB = require('./config/database.js');

mongoose.connect(configDB.url);

require('./config/passport')(passport);

app.use(logger({path: "/logs/logFile.txt"}));
app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.engine('hbs', exphbs({
  extname: '.hbs',
  defaultLayout: 'layout'
}));
app.set('view engine', 'hbs');

app.set('trust proxy', 1); // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { 
	  secure: false,
	  maxAge: 60*60*24
 	}
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());


require('./app/routes.js')(app, passport);

app.listen(port);