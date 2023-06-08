var express = require('express');
var passport = require('passport');
var bodyParser = require('body-parser');
var router = express.Router();
var nodemailer = require('nodemailer');
var path = require('path');
router.use(bodyParser.json());

var authenticate = require('../middleware/auth');
var asyncHandler = require('../middleware/asyncHandler');
var ErrorHandler = require('../utils/error');

var Restaurant = require('../models/restaurants');
var Otp = require('../models/otp');

exports.register = async (req, res, next) => {
	var exists = [];
	exists = await Restaurant.find({ email: req.body.email });
	if (exists.length !== 0) {
		next(new ErrorHandler('Restaurant already exists.', 409));
	} else {
		try {
			const restaurant = await Restaurant.register(
				new Restaurant({
					restaurant_name: req.body.restaurant_id,
					email: req.body.email,
					phone_number: req.body.phone_number,
				}),
				req.body.password
			);
			if (restaurant) {
				try {
					await restaurant.save();
					passport.authenticate('local-res')(req, res, () => {
						res.status(201).json({
							success: true,
							status: 'Registration Successful!',
						});
					});
				} catch (error) {
					return next(error);
				}
			}
		} catch (error) {
			return next(error);
		}
	}
};

exports.signIn = asyncHandler(async (req, res) => {
	let token = authenticate.getToken({ _id: req.user._id });
	let update = { fcm: req.body.token };
	await Restaurant.findByIdAndUpdate(req.user._id, update);
	res.status(200).json({
		success: true,
		token: token,
		restaurant: req.user._id,
	});
});

exports.getRestaurant = asyncHandler(async (req, res) => {
	res.json({ restaurant: req.user });
});

exports.getOtp = asyncHandler(async (req, res, next) => {
	var exists = [];
	exists = await Restaurant.find({ email: req.params.email });

	if (exists.length === 0) {
		next(new ErrorHandler('Email does not exist', 404));
	} else {
		var existing = await Otp.find({ email: req.params.email });
		if (existing.length > 0) {
			await Otp.deleteOne({ email: req.params.email });
		}
		var a = Math.floor(1000 + Math.random() * 9000).toString();
		var code = a.substring(-2);
		await Otp.create({ token: code, email: req.params.email });
		let transport = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			port: 465,
			secure: true,
			auth: {
				user: process.env.EMAIL,
				pass: process.env.EMAIL_PASSWORD,
			},
		});
		const mailOptions = {
			from: process.env.EMAIL,
			to: req.params.email,
			subject: 'OTP Verification',
			text: `Your four-digit verification code is: ${code}`,
		};

		transport.sendMail(mailOptions, function (err, info) {
			if (err) {
				next(new ErrorHandler('Internal Server Error', 500));
			} else {
				res.status(200).json();
			}
		});
	}
});

exports.verifyOtp = asyncHandler(async (req, res, next) => {
	let otp = req.params.otp;
	let email = req.params.email;
	let doc = await Otp.findOne({ email: email });
	if (otp === doc.token) {
		await Otp.deleteOne({ email: email });
		res.status(200).json();
	} else {
		res.status(404).json({ message: 'Invalid or Expired token' });
	}
});

exports.passwordReset = asyncHandler(async (req, res, next) => {
	let restaurant = await Restaurant.findOne({ email: req.body.email });
	let newRestaurant = await restaurant.setPassword(req.body.password);
	newRestaurant.save();
	res.status(204).json();
});

exports.passwordChange = asyncHandler(async (req, res, next) => {
	let restaurant = await Restaurant.findById(req.user._id);
	let newRestaurant = await restaurant.setPassword(req.body.new_password);
	newRestaurant.save();
	res.status(204).json();
});
