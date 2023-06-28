var passport = require('passport');
var nodemailer = require('nodemailer');

var authenticate = require('../middleware/auth');
var asyncHandler = require('../middleware/asyncHandler');
var ErrorHandler = require('../utils/error');

var Restaurant = require('../models/restaurants');
var Otp = require('../models/otp');
var FoodCategory = require('../models/food_categories');
var FoodItem = require('../models/food_items');
var FoodDeals = require('../models/food_deals');
var Order = require('../models/orders');

exports.register = async (req, res, next) => {
	var exists = await Restaurant.findOne({ email: req.body.email });
	if (exists) {
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
	var exists = await Restaurant.findOne({ email: req.params.email });
	if (!exists) {
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

exports.addCategory = asyncHandler(async (req, res, next) => {
	var exist = await FoodCategory.findOne({
		restaurant: req.user._id,
		title: req.body.title.toLowerCase(),
	});
	if (exist) {
		return res.status(409).json({ message: 'Already exists.' });
	}
	await FoodCategory.create({
		title: req.body.title.toLowerCase(),
		description: req.body.description,
		image: req.body.image,
		restaurant: req.user._id,
	});
	res.status(204).json({});
});

exports.addFoodItem = asyncHandler(async (req, res, next) => {
	await FoodItem.create({
		name: req.body.name,
		price: req.body.price,
		ingredient: req.body.ingredient,
		description: req.body.description,
		food_category: req.body.food_category,
		image: req.body.image,
		restaurant: req.user._id,
	});
	res.status(204).json({});
});

exports.viewFoodCategory = asyncHandler(async (req, res, next) => {
	const foodCategory = await FoodCategory.find({
		restaurant: req.user._id,
	});
	res.status(200).json({ foodCategory });
});

exports.viewFoodItems = asyncHandler(async (req, res, next) => {
	const foodItems = await FoodItem.find({
		restaurant: req.user._id,
	});
	res.status(200).json({ foodItems });
});

exports.editFoodCategory = asyncHandler(async (req, res, next) => {
	let update = {
		title: req.body.title.toLowerCase(),
		description: req.body.description,
		image: req.body.image,
		restaurant: req.user._id,
	};
	await FoodCategory.findByIdAndUpdate(req.params.id, update);
	res.status(204).json({});
});

exports.editFoodItem = asyncHandler(async (req, res, next) => {
	let update = {
		name: req.body.name,
		price: req.body.price,
		ingredient: req.body.ingredient,
		description: req.body.description,
		food_category: req.body.food_category,
		image: req.body.image,
		restaurant: req.user._id,
	};
	await FoodItem.findByIdAndUpdate(req.params.id, update);
	res.status(204).json({});
});

exports.deleteCategory = asyncHandler(async (req, res, next) => {
	await FoodCategory.deleteOne({
		_id: req.params.fid,
	});
	await FoodItem.deleteMany({
		food_category: req.params.fid,
	});
	res.status(204).json({});
});

exports.deleteFoodItem = asyncHandler(async (req, res, next) => {
	await FoodItem.deleteOne({
		_id: req.params.fid,
	});
	res.status(204).json({});
});

exports.addFoodDeal = asyncHandler(async (req, res, next) => {
	await FoodDeals.create({
		title: req.body.title,
		images: req.body.images,
		price: req.body.price,
		description: req.body.description,
		restaurant: req.user._id,
		starting_date: req.body.starting_date,
		ending_date: req.body.ending_date,
		food_items: req.body.foodItems,
	});
	res.status(201).json({ message: 'Deal created successfully.' });
});

exports.editFoodDeal = asyncHandler(async (req, res, next) => {
	let update = {
		title: req.body.title,
		images: req.body.images,
		price: req.body.price,
		description: req.body.description,
		restaurant: req.user._id,
		starting_date: req.body.starting_date,
		ending_date: req.body.ending_date,
		food_items: req.body.foodItems,
	};
	await FoodDeals.findByIdAndUpdate(req.params.id, update);
	res.status(202).json({});
});

exports.getSingleDeal = asyncHandler(async (req, res, next) => {
	const foodDeal = await FoodDeals.findById(req.params.id);
	res.status(200).json(foodDeal);
});

exports.getAllDeals = asyncHandler(async (req, res, next) => {
	const foodDeals = await FoodDeals.find({ restaurant: req.user._id });
	res.status(200).json(foodDeals);
});

exports.deleteFoodDeal = asyncHandler(async (req, res, next) => {
	await FoodDeals.deleteOne({
		_id: req.params.id,
	});
	res.status(204).json({});
});

exports.getOrdersByStatus = asyncHandler(async (req, res, next) => {
	const foodItems = await FoodItem.find({ restaurant: req.user._id }, '_id');
	const orders = await Order.find({
		'foodItems.item': { $in: foodItems },
		status: req.params.status,
	});
	res.status(200).json(orders);
});
