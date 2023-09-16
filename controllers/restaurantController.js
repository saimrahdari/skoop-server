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
var Customer = require('../models/customers');
var Admin = require('../models/admin');
var DeliveryAddress = require('../models/delivery_addresses');

exports.register = async (req, res, next) => {
	var exists = await Restaurant.findOne({ email: req.body.email });
	if (exists) {
		next(new ErrorHandler('Restaurant already exists.', 409));
	} else {
		try {
			const restaurant = await Restaurant.register(
				new Restaurant({
					restaurant_name: req.body.restaurant_name,
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

exports.editRestaurant = asyncHandler(async (req, res, next) => {
	let update = {
		restaurant_name: req.body.restaurant_name,
		email: req.body.email,
		phone_number: req.body.phone_number,
		category: req.body.category,
		description: req.body.description,
		address: req.body.address,
		picture: req.body.picture,
	};
	if (req.user.email !== req.body.email) {
		var exists = await Restaurant.findOne({
			email: req.body.email,
		});
		if (exists) {
			return res.status(409).json({
				message: 'Email already associated with a restaurant.',
			});
		}
	}
	await Restaurant.findByIdAndUpdate(req.user._id, update);
	res.status(204).json();
});

exports.openCloseRestaurant = asyncHandler(async (req, res, next) => {
	if (req.user.open) {
		await Restaurant.findByIdAndUpdate(req.user._id, { open: false });
	} else {
		await Restaurant.findByIdAndUpdate(req.user._id, { open: true });
	}
	res.status(204).json();
});

exports.addLocation = asyncHandler(async (req, res, next) => {
	let update = {
		latitude: req.body.latitude,
		longitude: req.body.longitude,
	};
	await Restaurant.findByIdAndUpdate(req.user._id, update);
	res.status(204).json();
});

exports.addOpeningHours = asyncHandler(async (req, res, next) => {
	let update = {
		opening_hours: req.body.opening_hours,
	};
	await Restaurant.findByIdAndUpdate(req.user._id, update);
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

exports.getSingleFoodItem = asyncHandler(async (req, res, next) => {
	const foodItem = await FoodItem.findById(req.params.id).populate(
		'food_category restaurant'
	);
	res.status(200).json({ foodItem });
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
		starting_time: req.body.starting_time,
		ending_time: req.body.ending_time,
		food_items: req.body.foodItems,
		date: req.body.date,
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
		starting_time: req.body.starting_time,
		ending_time: req.body.ending_time,
		date: req.body.date,
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
	var ids = [];
	for (let i = 0; i < foodItems.length; i++) {
		ids.push(foodItems[i]._id);
	}
	const orders = await Order.find({
		'foodItems.item': { $in: ids },
		status: req.params.status,
	});
	res.status(200).json(orders);
});

exports.getSingleAddress = asyncHandler(async (req, res) => {
	const address = await DeliveryAddress.findById(req.params.id);
	res.status(200).json({ address });
});

exports.getCustomerDetails = asyncHandler(async (req, res, next) => {
	const customer = await Customer.findById(req.params.id);
	res.status(200).json(customer);
});

exports.cancelOrder = asyncHandler(async (req, res) => {
	var order = await Order.findById(req.params.id);
	for (let i = 0; i < order.foodItems.length; i++) {
		const rest = await FoodItem.findById(order.foodItems[i].item).populate(
			'restaurant'
		);
		await Restaurant.findByIdAndUpdate(rest.restaurant._id, {
			$inc: { cancelled: 1 },
		});
	}
	await Customer.findByIdAndUpdate(order.customer, {
		$inc: { cancelled_orders: 1, balance: order.total },
	});
	await Admin.findOneAndUpdate(
		{ email: 'admin@gmail.com' },
		{
			$inc: { wallet: -order.total },
		}
	);
	let update = {
		status: 4,
		cancelReason: 'Restaurant cancelled the order.',
	};
	await Order.findByIdAndUpdate(req.params.id, update);
	res.status(204).json({});
});

exports.deleteAccount = asyncHandler(async (req, res, next) => {
	await Restaurant.deleteOne({
		_id: req.params.id,
	});
	res.status(204).json({});
});

exports.updateWallet = asyncHandler(async (req, res) => {
	await Restaurant.findByIdAndUpdate(req.user._id, {
		$inc: { balance: -req.body.amount },
	});
	res.status(204).json({});
});

exports.getOrdersOfLastWeek = asyncHandler(async (req, res, next) => {
	const now = new Date();
	const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	const foodItems = await FoodItem.find({ restaurant: req.user._id });
	var ids = [];
	for (let i = 0; i < foodItems.length; i++) {
		ids.push(foodItems[i]._id);
	}
	const result = await Order.aggregate([
		{
			$match: {
				foodItems: { $elemMatch: { item: { $in: ids } } },
				status: 3,
				createdAt: { $gte: oneWeekAgo, $lte: now },
			},
		},
		{
			$group: {
				_id: { $dayOfWeek: '$createdAt' },
				count: { $sum: 1 },
			},
		},
		{
			$project: {
				dayOfWeek: {
					$let: {
						vars: {
							days: [
								'Sunday',
								'Monday',
								'Tuesday',
								'Wednesday',
								'Thursday',
								'Friday',
								'Saturday',
							],
						},
						in: {
							$arrayElemAt: [
								'$$days',
								{ $subtract: ['$_id', 1] },
							],
						},
					},
				},
				count: 1,
				_id: 0,
			},
		},
		{
			$sort: { _id: 1 },
		},
	]);
	res.status(200).json({ result });
});

exports.withdrawRestaurant = asyncHandler(async (req, res, next) => {
	var { title, iban, bankName, amount } = req.body;
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
		to: 'admin@gmail.com',
		subject: 'Withdraw Money',
		text: `Account details: title:${title} account number:${iban} bank:${bankName}. The amount to be withdraw is ${amount}. Skoop restaurant account ID: ${req.user._id}`,
	};
	transport.sendMail(mailOptions, function (err, info) {
		if (err) {
			next(new ErrorHandler('Internal Server Error', 500));
		} else {
			res.status(200).json({
				message: 'Your request is sent to the authorities.',
			});
		}
	});
});
