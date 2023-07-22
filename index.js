var http = require('http');
var express = require('express');
var app = express();
var socketIO = require('socket.io');
var server = http.createServer(app);
var io = socketIO(server, {
	cors: {
		origin: '*',
	},
});
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
var Restaurant = require('./routes/restaurantRoutes');
var Chat = require('./routes/chatRoutes');
var Admin = require('./routes/adminRoutes');
var Skooper = require('./routes/skooperRoutes');

server.listen(process.env.PORT, () => {
	console.log(`Running on port ${process.env.PORT} 👍.`);
});
connection.connectDB();

app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: false }));
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

//?Socket Start
let users = [];
const addUser = (userId, socketId) => {
	!users.some(user => user.userId === userId) &&
		users.push({ userId, socketId });
};
const removeUser = socketId => {
	users = users.filter(user => user.socketId !== socketId);
};
const getUser = userId => {
	return users.find(user => user.userId === userId);
};
io.on('connection', socket => {
	console.log('a user connected.');
	socket.on('addUser', userId => {
		addUser(userId, socket.id);
		io.emit('getUsers', users);
	});
	socket.on('sendMessage', ({ senderId, receiverId, text }) => {
		const user = getUser(receiverId);
		io.to(user.socketId).emit('getMessage', {
			senderId,
			text,
		});
	});
	socket.on('disconnect', () => {
		console.log('a user disconnected!');
		removeUser(socket.id);
		io.emit('getUsers', users);
	});
});
//!Socket End

app.use('/customers', Customer);
app.use('/restaurant', Restaurant);
app.use('/chat', Chat);
app.use('/admin', Admin);
app.use('/skooper', Skooper);

app.all('*', (req, res, next) => {
	next(new ErrorHandler('Bad Request', 404));
});
app.use(errorMiddleware);

module.exports = app;
