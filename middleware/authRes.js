var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var jwt = require('jsonwebtoken');
var Restaurant = require('../models/restaurants');

passport.serializeUser(Restaurant.serializeUser());
passport.deserializeUser(Restaurant.deserializeUser());
passport.use(
	'local-res',
	new LocalStrategy(
		{
			usernameField: 'email',
		},
		Restaurant.authenticate()
	)
);

exports.getToken = function (user) {
	return jwt.sign(user, process.env.SECRET);
};

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.SECRET;

passport.use(
	'jwt-res',
	new JwtStrategy(opts, async (jwt_payload, done) => {
		try {
			const user = await Restaurant.findOne({ _id: jwt_payload._id });
			if (user) {
				return done(null, user);
			} else {
				return done(null, false);
			}
		} catch (error) {
			return error, false;
		}
	})
);

exports.verifyRestaurant = passport.authenticate('jwt-res', { session: false });
