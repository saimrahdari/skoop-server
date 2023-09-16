var passport = require('passport');
var nodemailer = require('nodemailer');

var authenticate = require('../middleware/auth');
var asyncHandler = require('../middleware/asyncHandler');
var ErrorHandler = require('../utils/error');

var Customer = require('../models/customers');
var Restaurant = require('../models/restaurants');
var Otp = require('../models/otp');
var DeliveryAddress = require('../models/delivery_addresses');
var FoodCategory = require('../models/food_categories');
var Order = require('../models/orders');
var FoodItem = require('../models/food_items');
var PaymentMethod = require('../models/payment_methods');
var Report = require('../models/reports');
var Admin = require('../models/admin');

exports.register = async (req, res, next) => {
	var exists = await Customer.findOne({
		$or: [{ email: req.body.email }, { student_id: req.body.student_id }],
	});
	if (exists) {
		next(
			new ErrorHandler(
				'Email or StudentId already associated with an account',
				409
			)
		);
	} else {
		try {
			const customer = await Customer.register(
				new Customer({
					student_id: req.body.student_id,
					email: req.body.email,
					full_name: req.body.full_name,
				}),
				req.body.password
			);
			if (customer) {
				try {
					await customer.save();
					passport.authenticate('local')(req, res, () => {
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
	await Customer.findByIdAndUpdate(req.user._id, update);
	res.status(200).json({
		success: true,
		token: token,
		customer: req.user._id,
	});
});

exports.getCustomer = asyncHandler(async (req, res) => {
	res.json({ customer: req.user });
});

exports.getOtp = asyncHandler(async (req, res, next) => {
	var exists = await Customer.findOne({ email: req.params.email });
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
	let customer = await Customer.findOne({ email: req.body.email });
	let newCustomer = await customer.setPassword(req.body.password);
	newCustomer.save();
	res.status(204).json();
});

exports.passwordChange = asyncHandler(async (req, res, next) => {
	let customer = await Customer.findById(req.user._id);
	let newCustomer = await customer.setPassword(req.body.new_password);
	newCustomer.save();
	res.status(204).json();
});

exports.addLocation = asyncHandler(async (req, res, next) => {
	let update = {
		latitude: req.body.latitude,
		longitude: req.body.longitude,
	};
	await Customer.findByIdAndUpdate(req.user._id, update);
	res.status(204).json();
});

exports.editCustomer = asyncHandler(async (req, res) => {
	if (req.user.email !== req.body.email) {
		var exists = await Customer.findOne({
			email: req.body.email,
		});
		if (exists) {
			return res
				.status(409)
				.json({ message: 'Email already associated with a user.' });
		}
	}
	if (req.user.student_id !== req.body.student_id) {
		var exists = await Customer.findOne({
			student_id: req.body.student_id,
		});
		if (exists) {
			return res.status(409).json({
				message: 'Student-Id already associated with a user.',
			});
		}
	}
	let update = {
		student_id: req.body.student_id,
		email: req.body.email,
		full_name: req.body.full_name,
		picture: req.body.picture,
	};
	await Customer.findByIdAndUpdate(req.user._id, update);
	res.status(204).json({});
});

exports.switchRoles = asyncHandler(async (req, res) => {
	let update = {};
	if (req.user.role === 'customer') {
		update = {
			role: 'skooper',
		};
	} else {
		update = {
			role: 'customer',
		};
	}
	await Customer.findByIdAndUpdate(req.user._id, update);
	res.status(204).json({});
});

exports.addAddress = asyncHandler(async (req, res) => {
	await DeliveryAddress.create(req.body);
	res.status(201).json({});
});

exports.getAddress = asyncHandler(async (req, res) => {
	const addresses = await DeliveryAddress.find({ customer: req.user._id });
	res.status(200).json({ addresses });
});

exports.getSingleAddress = asyncHandler(async (req, res) => {
	const address = await DeliveryAddress.findById(req.params.id);
	res.status(200).json({ address });
});

exports.updateWallet = asyncHandler(async (req, res) => {
	await Customer.findByIdAndUpdate(req.user._id, {
		$inc: { balance: req.body.amount },
	});
	res.status(204).json({});
});

exports.addReview = asyncHandler(async (req, res) => {
	await Restaurant.findByIdAndUpdate(
		{ _id: req.body.restaurantId },
		{
			$push: {
				reviews: {
					message: req.body.message,
					stars: req.body.stars,
					customer: req.user._id,
					orderID: req.body.orderId,
				},
			},
		},
		{ new: true, upset: false }
	);
	if (req.body.stars < 2) {
		await Report.create({
			customer: req.user._id,
			type: true,
			message: req.body.message,
			restaurant: req.body.restaurantId,
		});
	}
	res.status(204).json({});
});

exports.getRestaurants = asyncHandler(async (req, res) => {
	const restaurants = await Restaurant.find({})
		.sort({ reviews: -1 })
		.limit(5);
	res.status(200).json({ restaurants });
});

exports.getPizzaBurgerRestaurant = asyncHandler(async (req, res) => {
	const restaurants = await FoodCategory.find({
		$or: [{ title: 'pizza' }, { title: 'burger' }],
	}).select('restaurant -_id');
	var ids = [];
	for (let index = 0; index < restaurants.length; index++) {
		ids.push(restaurants[index].restaurant);
	}
	const finalData = await Restaurant.find({ _id: { $in: ids } });
	res.status(200).json({ restaurants: finalData });
});

exports.createOrder = asyncHandler(async (req, res) => {
	const user = await Customer.findById(req.user._id);
	if (user.balance < req.body.total) {
		return res.status(400).json({ message: 'Not enough balance' });
	}
	await Order.create({
		customer: req.user._id,
		address: req.body.address,
		status: req.body.status,
		delivery_charges: req.body.delivery_charges,
		tip: req.body.tip,
		special_instructions: req.body.special_instructions,
		foodItems: req.body.foodItems,
		tax: req.body.tax,
		total: req.body.total,
		subtotal: req.body.subtotal,
	});
	const admin = await Admin.findOne({ email: 'admin@gmail.com' });
	await Customer.findByIdAndUpdate(user.id, {
		$inc: { balance: -req.body.total },
	});
	await Admin.findByIdAndUpdate(admin.id, {
		$inc: { wallet: req.body.total },
	});
	res.status(201).json({ message: 'Order Created Successfully.' });
});

exports.getOrders = asyncHandler(async (req, res) => {
	const orders = await Order.find({ customer: req.user._id });
	if (orders.length === 0) {
		res.status(200).json({ message: 'No orders found.' });
	} else {
		res.status(200).json({ orders });
	}
});

exports.getSingleOrder = asyncHandler(async (req, res) => {
	const order = await Order.findById(req.params.id).populate(
		'foodItems.item'
	);
	res.status(200).json({ order });
});

exports.setFavouriteRestaurant = asyncHandler(async (req, res) => {
	const favAlready = await Customer.findOne({
		_id: req.user._id,
		'favourite.rid': req.params.id,
	});
	if (favAlready) {
		return res
			.status(400)
			.json({ message: 'Restaurant already favourite' });
	}
	await Customer.findByIdAndUpdate(
		{ _id: req.user._id },
		{
			$push: {
				favourite: {
					rid: req.params.id,
				},
			},
		}
	);
	res.status(204).json({});
});

exports.removeFavouriteRestaurant = asyncHandler(async (req, res) => {
	await Customer.findByIdAndUpdate(
		{ _id: req.user._id },
		{
			$pull: {
				favourite: {
					rid: req.params.id,
				},
			},
		}
	);
	res.status(204).json({});
});

exports.getFavouriteRestaurant = asyncHandler(async (req, res) => {
	const restaurants = await Customer.findById(req.user._id).populate(
		'favourite.rid'
	);
	res.status(200).json({ favourite: restaurants.favourite });
});

exports.getRestaurantWithCategoryItems = asyncHandler(async (req, res) => {
	const foodCategories = await FoodCategory.find({
		restaurant: req.params.id,
	});
	var finalData = [];
	for (let i = 0; i < foodCategories.length; i++) {
		var foodItems = await FoodItem.find({
			restaurant: req.params.id,
			food_category: foodCategories[i]._id,
		});
		var obj = { title: foodCategories[i].title, data: foodItems };
		finalData.push(obj);
	}
	res.status(200).json(finalData);
});

exports.getRestaurant = asyncHandler(async (req, res) => {
	const restaurant = await Restaurant.findById(req.params.id);
	res.status(200).json(restaurant);
});

exports.getCustomerById = asyncHandler(async (req, res) => {
	const customer = await Customer.findById(req.params.id);
	res.status(200).json(customer);
});

exports.searchRestaurant = asyncHandler(async (req, res) => {
	const query = req.query.name;
	var rest = await Restaurant.find({
		restaurant_name: { $regex: new RegExp(query, 'i') },
	});
	res.status(200).json(rest);
});

exports.searchFoodItem = asyncHandler(async (req, res) => {
	const query = req.query.name;
	var items = await FoodItem.find({
		name: { $regex: new RegExp(query, 'i') },
	});
	res.status(200).json(items);
});

exports.getActiveOrder = asyncHandler(async (req, res) => {
	const orders = await Order.find({
		$and: [
			{ customer: req.user._id },
			{ $or: [{ status: 0 }, { status: 1 }, { status: 2 }] },
		],
	});
	res.status(200).json({ activeOrders: orders });
});

exports.getPastOrder = asyncHandler(async (req, res) => {
	const orders = await Order.find({
		$and: [
			{ customer: req.user._id },
			{ $or: [{ status: 3 }, { status: 4 }] },
		],
	});
	res.status(200).json({ pastOrders: orders });
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
		cancelReason: req.body.reason,
	};
	await Order.findByIdAndUpdate(req.params.id, update);
	res.status(204).json({});
});

exports.getReviews = asyncHandler(async (req, res) => {
	const reviews = await Restaurant.findById(req.params.id).populate(
		'reviews.customer'
	);
	res.status(200).json(reviews.reviews);
});

exports.getFoodItems = asyncHandler(async (req, res) => {
	const items = await FoodItem.find({}).sort({ _id: -1 }).limit(10);
	res.status(200).json(items);
});

exports.getSingleFoodItem = asyncHandler(async (req, res) => {
	const item = await FoodItem.findById(req.params.id);
	res.status(200).json(item);
});

exports.getSingleFoodCategory = asyncHandler(async (req, res) => {
	const category = await FoodCategory.findById(req.params.id).populate(
		'restaurant'
	);
	res.status(200).json(category);
});

exports.addCard = asyncHandler(async (req, res) => {
	let create = { ...req.body, user: req.user._id };
	await PaymentMethod.create(create);
	res.status(201).json({ message: 'Payment card added successgully.' });
});

exports.getAllCards = asyncHandler(async (req, res) => {
	const cards = await PaymentMethod.find({ user: req.user._id });
	res.status(200).json(cards);
});

exports.getSingleCard = asyncHandler(async (req, res) => {
	const card = await PaymentMethod.findById(req.params.id);
	res.status(200).json(card);
});

exports.addReviewOfSkooper = asyncHandler(async (req, res) => {
	const order = await Order.findById(req.params.id);
	let update = {
		rating: req.body.rating,
		reviewer: req.user._id,
		message: req.body.message,
	};
	if (req.body.rating < 2) {
		await Report.create({
			customer: req.user._id,
			scooper: order.scooper,
			message: req.body.message,
		});
	}
	await Order.findByIdAndUpdate(req.params.id, { scooperReview: update });
	await Customer.findByIdAndUpdate(req.params.id, { $inc: { reviews: 1 } });
	res.status(201).json({ message: 'Review added.' });
});

exports.recentOrdersFromSpecificRestaurant = asyncHandler(async (req, res) => {
	const foodItems = await FoodItem.find({ restaurant: req.params.id });
	var ids = [];
	for (let i = 0; i < foodItems.length; i++) {
		ids.push(foodItems[i]._id);
	}
	const recentOrders = await Order.find({
		customer: req.user._id,
		'foodItems.item': { $in: ids },
	}).limit(5);
	res.status(201).json({ recentOrders });
});

exports.deleteAccount = asyncHandler(async (req, res, next) => {
	await Customer.deleteOne({
		_id: req.params.id,
	});
	res.status(204).json({});
});

exports.withdrawCustomer = asyncHandler(async (req, res, next) => {
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
		text: `Account details: title:${title} account number:${iban} bank:${bankName}. The amount to be withdraw is ${amount}. Skoop customer account ID: ${req.user._id}`,
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
