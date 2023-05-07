var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var passport = require('passport');
var session = require('express-session');
require('dotenv').config();

var errorMiddleware = require('./middleware/errorMiddleware');
var ErrorHandler = require('./utils/error');
var connection = require('./utils/connection');

var Customer = require('./routes/customerRoutes');

app.listen(process.env.PORT, () => {
	console.log(`Running on port ${process.env.PORT} 👍.`);
});
connection.connectDB();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(
	session({
		secret: process.env.SECRET,
		resave: false,
		saveUninitialized: true,
	})
);
app.use(passport.initialize());
app.use(passport.session());

app.use('/customers', Customer);

app.all('*', function (req, res, next) {
	next(new ErrorHandler('Bad Request', 404));
});
app.use(errorMiddleware);

module.exports = app;
